// Appels à Claude : création des recettes et lecture d'une photo de frigo.
import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
// Simulation : demandée explicitement, ou automatique en local sans clé API.
export const MOCK =
  process.env.MOCK_AI === "1" || (!client && process.env.NODE_ENV !== "production");

// L'IA est-elle disponible ? (clé configurée, ou simulation en local)
export const AI_ENABLED = MOCK || !!client;

function requireClient() {
  if (!client) throw new Error("ANTHROPIC_API_KEY manquante");
}

export const UNITS = ["", "pièce", "g", "kg", "ml", "cl", "l", "tranche", "botte", "boîte", "pot", "c. à s.", "c. à c.", "pincée", "gousse"];
const DIETS = ["", "végétarien", "vegan", "sans gluten", "sans lactose", "halal", "sans porc"];
const TIMES = [0, 20, 40, 90];

/** Nettoie et limite ce que le navigateur envoie. */
export function cleanRequest(body) {
  const items = Array.isArray(body?.fridge) ? body.fridge.slice(0, 60) : [];
  const fridge = items
    .map((it) => {
      const nom = String(it?.nom ?? "").replace(/[\r\n<>]/g, " ").trim().slice(0, 60);
      let qte = it?.qte === "" || it?.qte == null ? null : Number(it.qte);
      if (!Number.isFinite(qte) || qte <= 0 || qte > 100000) qte = null;
      const unite = UNITS.includes(it?.unite) ? it.unite : "";
      return nom ? { nom, qte, unite } : null;
    })
    .filter(Boolean);
  return {
    fridge,
    temps: TIMES.includes(Number(body?.temps)) ? Number(body.temps) : 40,
    regime: DIETS.includes(body?.regime) ? body.regime : "",
    personnes: Math.min(12, Math.max(1, parseInt(body?.personnes, 10) || 2)),
    basiques: body?.basiques !== false,
  };
}

function describe(it) {
  if (it.qte == null) return `${it.nom} (quantité non précisée)`;
  const u = it.unite === "pièce" ? (it.qte > 1 ? " pièces" : " pièce") : it.unite ? ` ${it.unite}` : "";
  return `${it.nom} : ${it.qte}${u}`;
}

function recipePrompt(r) {
  return `Tu es un chef cuisinier anti-gaspillage. Propose 3 recettes variées, en français, qui utilisent au mieux ce qu'il y a dans le frigo.

Contenu du frigo, avec les quantités disponibles :
${r.fridge.map((it) => "- " + describe(it)).join("\n")}

${r.basiques ? "La personne a aussi les basiques : sel, poivre, huile, farine, sucre, beurre, vinaigre." : "Ne suppose aucun ingrédient de base en plus de la liste."}

Contraintes :
- ${r.temps ? `temps total de ${r.temps} minutes maximum` : "pas de limite de temps"}
- ${r.regime ? `régime ${r.regime}` : "pas de régime particulier"}
- quantités pour ${r.personnes} personne(s), en unités métriques (g, cl, °C)
- ne dépasse JAMAIS la quantité disponible d'un ingrédient du frigo ; si elle ne suffit pas pour ${r.personnes} personne(s), complète avec un autre ingrédient ou adapte la recette
- privilégie les ingrédients à finir en entier (moins de restes), et limite les achats à 0-2 ingrédients
- les recettes n'ont pas besoin d'utiliser tout le frigo

Réponds uniquement avec un tableau JSON de 3 objets, sans texte autour :
[{"titre":"…","temps":25,"difficulte":"facile|moyen|difficile","portions":${r.personnes},
"ingredients":[{"nom":"…","quantite":"200 g","du_frigo":true}],
"etapes":["…"],"astuce":"…","reste":"ce qui restera dans le frigo après la recette, en une phrase courte, ou chaîne vide"}]
"du_frigo" vaut true si l'ingrédient vient du frigo ou des basiques autorisés, false s'il faut l'acheter.`;
}

function parseJson(text) {
  const t = String(text || "").trim();
  const tries = [t];
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) tries.push(fence[1]);
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
  for (const s of tries) {
    try { return JSON.parse(s); } catch {}
  }
  return null;
}

function cleanRecipes(data, personnes) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((r) => r && r.titre && Array.isArray(r.ingredients) && Array.isArray(r.etapes))
    .slice(0, 4)
    .map((r) => ({
      titre: String(r.titre).slice(0, 120),
      temps: Number(r.temps) || null,
      difficulte: String(r.difficulte || "").slice(0, 20),
      portions: Number(r.portions) || personnes,
      ingredients: r.ingredients.slice(0, 25).map((i) => ({
        nom: String(i?.nom || "").slice(0, 80),
        quantite: String(i?.quantite || "").slice(0, 40),
        du_frigo: i?.du_frigo === true,
      })),
      etapes: r.etapes.slice(0, 15).map((e) => String(e).slice(0, 600)),
      astuce: r.astuce ? String(r.astuce).slice(0, 400) : "",
      reste: r.reste ? String(r.reste).slice(0, 300) : "",
    }));
}

export async function makeRecipes(req) {
  if (MOCK) return mockRecipes(req);
  requireClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: "user", content: recipePrompt(req) }],
  });
  const text = msg.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  const recipes = cleanRecipes(parseJson(text), req.personnes);
  if (!recipes.length) throw new Error("Réponse illisible");
  return recipes;
}

export async function readFridgePhoto(base64, mediaType) {
  if (MOCK) {
    return [
      { nom: "œufs", qte: 6, unite: "pièce" },
      { nom: "yaourt nature", qte: 4, unite: "pot" },
      { nom: "poivron rouge", qte: 1, unite: "pièce" },
    ];
  }
  requireClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `Cette photo montre l'intérieur d'un frigo ou des aliments. Liste les aliments que tu identifies avec certitude, en français, avec une estimation de la quantité visible.
Unités autorisées : ${UNITS.filter(Boolean).join(", ")} (ou "" si impossible à estimer).
Réponds uniquement avec un tableau JSON : [{"nom":"œufs","qte":6,"unite":"pièce"}]. Mets "qte": null si tu ne peux pas estimer.`,
          },
        ],
      },
    ],
  });
  const text = msg.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  const data = parseJson(text);
  return cleanRequest({ fridge: Array.isArray(data) ? data : [] }).fridge;
}

function mockRecipes(r) {
  const names = r.fridge.map((f) => f.nom);
  const first = names[0] || "œufs";
  const second = names[1] || "fromage";
  return [
    {
      titre: `Poêlée de ${first} et ${second} (exemple simulé)`,
      temps: 20, difficulte: "facile", portions: r.personnes,
      ingredients: [
        { nom: first, quantite: "200 g", du_frigo: true },
        { nom: second, quantite: "80 g", du_frigo: true },
        { nom: "huile d'olive", quantite: "1 c. à s.", du_frigo: true },
        { nom: "persil", quantite: "½ botte", du_frigo: false },
      ],
      etapes: ["Ceci est une recette simulée (MOCK_AI=1).", `Faire revenir ${first} 5 min.`, `Ajouter ${second} et servir.`],
      astuce: "Désactive MOCK_AI pour obtenir de vraies recettes.",
      reste: `Il te restera un peu de ${second}.`,
    },
    {
      titre: `Gratin express de ${first} (exemple simulé)`,
      temps: 35, difficulte: "facile", portions: r.personnes,
      ingredients: [
        { nom: first, quantite: "300 g", du_frigo: true },
        { nom: "crème", quantite: "15 cl", du_frigo: false },
      ],
      etapes: ["Préchauffer le four à 200 °C.", "Disposer dans un plat.", "Cuire 25 min."],
      astuce: "", reste: "",
    },
  ];
}
