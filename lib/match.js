// Recherche dans le carnet : tourne dans le navigateur, gratuite et instantanée.
import { VOCAB, BASICS } from "@/data/vocab";
import { familyOf } from "@/data/colors";

export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_'’\-]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["de", "d", "du", "des", "la", "le", "les", "l", "a", "au", "aux", "en", "bio", "frais", "fraiche"].includes(w))
    .map((w) => (w.length > 3 ? w.replace(/(s|x)$/, "") : w))
    .join(" ");
}

// Index : forme normalisée -> clé
const PHRASES = [];
const REPLACES = {};
const NAMES = {};
for (const [cle, nom, syn, rep] of VOCAB) {
  NAMES[cle] = nom;
  REPLACES[cle] = rep || [];
  for (const p of new Set([cle, nom, ...syn].map(norm).filter(Boolean))) PHRASES.push([p, cle]);
}
PHRASES.sort((a, b) => b[0].length - a[0].length); // les expressions les plus longues d'abord
const EXACT = new Map(PHRASES.map(([p, k]) => [p, k]));

/** Trouve la clé d'un ingrédient saisi librement (« Tomates cerises bio » -> tomate_cerise). */
export function resolve(name) {
  const n = norm(name);
  if (!n) return null;
  if (EXACT.has(n)) return EXACT.get(n);
  const padded = ` ${n} `;
  for (const [p, k] of PHRASES) if (padded.includes(` ${p} `)) return k;
  return null;
}

function withReplacements(keys) {
  const out = new Set(keys);
  const stack = [...keys];
  while (stack.length) {
    const k = stack.pop();
    for (const r of REPLACES[k] || []) if (!out.has(r)) { out.add(r); stack.push(r); }
  }
  return out;
}

// --- Quantités ---
const FAMILY = { g: ["m", 1], kg: ["m", 1000], ml: ["v", 1], cl: ["v", 10], l: ["v", 1000], "pièce": ["n", 1] };

function toBase(q, u) {
  const f = FAMILY[u || ""];
  return f && q != null ? [f[0], q * f[1]] : null;
}

export function fmtQty(q, unite) {
  if (q == null) return "";
  let v = q, u = unite || "";
  if (u === "g" && v >= 1000) { v /= 1000; u = "kg"; }
  if (u === "ml" && v >= 1000) { v /= 1000; u = "l"; }
  let s;
  if (["pièce", "gousse", "tranche", "botte", "boîte", "pot", "c. à s.", "c. à c.", "pincée", ""].includes(u)) {
    const r = Math.round(v * 2) / 2;
    const whole = Math.floor(r);
    s = r - whole === 0.5 ? (whole ? `${whole} ½` : "½") : String(Math.max(r, 0.5));
  } else if (u === "g" || u === "ml") {
    s = String(v >= 100 ? Math.round(v / 10) * 10 : Math.max(5, Math.round(v / 5) * 5));
  } else {
    s = String(Math.round(v * 10) / 10).replace(".", ",");
  }
  return u === "pièce" || u === "" ? s : `${s} ${u}`;
}

const REGIME_TAGS = {
  "végétarien": ["vegetarien"], vegan: ["vegan"], "sans gluten": ["sans_gluten"],
  "sans lactose": ["sans_lactose"], "sans porc": ["sans_porc"], halal: ["sans_porc", "sans_alcool"],
};
const TYPES = {
  plats: ["plat", "accompagnement"],
  "soupes-salades": ["soupe", "salade", "entree", "apero"],
  sucre: ["dessert", "petit-dejeuner", "gouter"],
};

// « Placard classique » : ce que presque tout le monde a sans y penser.
export const PLACARD = [
  "oignon", "echalote", "ail", "herbes_provence", "cumin", "curry", "paprika", "muscade", "cannelle",
  "piment_poudre", "curcuma", "bouillon", "moutarde", "concentre_tomate", "sauce_soja", "miel", "vanille",
  "levure", "pates", "riz", "semoule", "chapelure", "cacao",
];
// Ingrédients d'accompagnement : en manquer un est moins grave que manquer l'ingrédient principal.
export const ACCENT = new Set([
  ...BASICS, ...PLACARD, "persil", "ciboulette", "basilic", "coriandre", "menthe", "aneth", "herbes",
  "citron", "citron_vert", "capre", "cornichon", "olive", "graine", "pignon", "ketchup", "mayonnaise",
  "vin_blanc", "vin_rouge", "piment", "gingembre", "nuoc_mam", "tahini", "oignon_nouveau",
]);

function context(fridge, opts) {
  const items = fridge.map((it) => ({ ...it, cle: resolve(it.nom) })).filter((it) => it.cle);
  const byKey = new Map();
  for (const it of items) for (const k of withReplacements([it.cle])) if (!byKey.has(k)) byKey.set(k, it);
  const stock = new Set([...(opts.basiques ? BASICS : []), ...(opts.placard ? PLACARD : [])]);
  return { items, byKey, stock, people: Number(opts.personnes) || 2 };
}

// « la moitié de l'huile » → « la moitié de l'huile (1 c. à s.) » : la quantité exacte, adaptée au nombre de personnes.
const stem = (w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/s$/, "");
const SPLIT = /\b(la moitié|le reste)( du | de la | de l'| de l’| des | d'| d’)(\p{L}+)/gu;
function withQty(r, scale) {
  const steps = r.etapes || [];
  const byWord = new Map();
  for (const g of r.ingredients) {
    if (g.qte == null || !g.unite || g.unite === "pièce") continue; // « la moitié de la poire » se passe de chiffre
    const w = stem(g.nom.split(/\s+/)[0]);
    if (!byWord.has(w)) byWord.set(w, g);
  }
  const halved = new Set();
  for (const e of steps) for (const m of e.matchAll(SPLIT)) if (m[1] === "la moitié") halved.add(stem(m[3]));
  return steps.map((e) => {
    const cuts = [];
    for (const m of e.matchAll(SPLIT)) {
      const w = stem(m[3]), g = byWord.get(w);
      if (!g || !halved.has(w)) continue;
      const txt = fmtQty((g.qte * scale) / 2, g.unite);
      if (!txt) continue;
      // Nom en plusieurs mots (« garam masala ») : la quantité se place après le nom complet.
      let end = m.index + m[0].length;
      const rest = g.nom.split(/\s+/).slice(1).join(" ");
      if (rest && e.slice(end, end + rest.length + 1).toLowerCase() === " " + rest.toLowerCase()) end += rest.length + 1;
      cuts.push([end, ` (${txt})`]);
    }
    for (const [at, add] of cuts.reverse()) e = e.slice(0, at) + add + e.slice(at);
    return e;
  });
}

/** Évalue une recette par rapport au frigo : ce que tu as, ce qui manque, quantités adaptées. */
function evaluate(r, ctx) {
  const scale = ctx.people / r.portions;
  let used = 0, usedMain = 0, missing = 0, missMain = 0, short = 0;
  const ingredients = r.ingredients.map((g) => {
    const q = g.qte == null ? null : g.qte * scale;
    const main = !ACCENT.has(g.cle);
    const line = { nom: g.nom, quantite: fmtQty(q, g.unite), optionnel: !!g.optionnel, fam: familyOf(g.cle), basique: !main };
    const mine = ctx.byKey.get(g.cle);
    if (mine) {
      used++;
      if (main) usedMain++;
      const need = toBase(q, g.unite), have = toBase(mine.qte, mine.unite);
      if (need && have && need[0] === have[0] && have[1] < need[1] * 0.85) {
        short++;
        return { ...line, etat: "short", note: `tu en as ${fmtQty(mine.qte, mine.unite)}` };
      }
      return { ...line, etat: "have" };
    }
    if (ctx.stock.has(g.cle)) return { ...line, etat: "have", note: "placard" };
    if (g.optionnel) return { ...line, etat: "option" };
    missing++;
    if (main) missMain++;
    return { ...line, etat: "need" };
  });
  return {
    id: r.id, photo: r.photo, titre: r.titre, temps: r.temps, difficulte: r.difficulte, portions: ctx.people,
    categorie: r.categorie, etapes: withQty(r, scale), astuce: r.astuce || "", ingredients,
    used, usedMain, missing, missMain, short,
    score: usedMain * 4 + used - missMain * 5 - (missing - missMain) * 1.5 - short,
  };
}

/**
 * Classe les recettes du carnet selon le frigo.
 * fridge : [{nom, qte, unite}] ; opts : {temps, regime, personnes, basiques, placard, type}
 */
export function suggest(carnet, fridge, opts) {
  const ctx = context(fridge, opts);
  const tags = REGIME_TAGS[opts.regime] || [];
  const types = TYPES[opts.type];
  const out = [];
  for (const r of carnet) {
    if (opts.temps && r.temps > opts.temps) continue;
    if (tags.some((t) => !r.regimes.includes(t))) continue;
    if (types && !types.includes(r.categorie)) continue;
    const e = evaluate(r, ctx);
    // Il faut utiliser au moins un vrai ingrédient du frigo, et qu'il manque au plus 2 ingrédients principaux.
    if (e.usedMain === 0 || e.missMain > 2 || e.missing > 4) continue;
    out.push(e);
  }
  out.sort((a, b) => b.score - a.score || a.missing - b.missing || a.temps - b.temps);
  return { results: out, recognized: ctx.items.length, unknown: fridge.filter((it) => !resolve(it.nom)).map((it) => it.nom) };
}

/** Les recettes demandées (favoris), dans l'ordre donné, évaluées par rapport au frigo, sans filtre. */
export function pick(carnet, ids, fridge, opts) {
  const ctx = context(fridge, opts);
  const byId = new Map(carnet.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map((r) => evaluate(r, ctx));
}

/** Couleur (famille d'aliment) d'un ingrédient saisi librement. */
export function familyOfName(name) {
  return familyOf(resolve(name));
}

/** Nom affiché d'une clé d'ingrédient (« pomme_de_terre » -> « pomme de terre »). */
export function ingredientName(cle) {
  return NAMES[cle] || String(cle).replace(/_/g, " ");
}
