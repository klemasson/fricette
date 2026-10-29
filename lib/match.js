// Recherche dans le carnet : tourne dans le navigateur, gratuite et instantanée.
import { VOCAB, BASICS } from "@/data/vocab";
import { familyOf } from "@/data/colors";
import { SUBSTITUTES } from "@/data/substitutes";

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

export function toBase(q, u) {
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

/** Jours restants avant la date « à finir avant » (négatif = dépassée), ou null. */
export function daysLeft(exp, now = new Date()) {
  if (!exp || !/^\d{4}-\d{2}-\d{2}$/.test(exp)) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = exp.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

function context(fridge, opts) {
  const items = fridge.map((it) => ({ ...it, cle: resolve(it.nom) })).filter((it) => it.cle);
  const byKey = new Map();
  for (const it of items) for (const k of withReplacements([it.cle])) if (!byKey.has(k)) byKey.set(k, it);
  const stock = new Set([...(opts.basiques ? BASICS : []), ...(opts.placard ? PLACARD : [])]);
  // Produits à finir vite (3 jours ou moins, pas dépassés de plus de 2 jours) : prioritaires.
  const urgent = new Set(items.filter((it) => { const d = daysLeft(it.exp); return d != null && d <= 3 && d >= -2; }).map((it) => it.cle));
  return { items, byKey, stock, urgent, people: Number(opts.personnes) || 2 };
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
  let used = 0, usedMain = 0, missing = 0, missMain = 0, short = 0, swaps = 0;
  const urgent = [];
  const ingredients = r.ingredients.map((g) => {
    const q = g.qte == null ? null : g.qte * scale;
    const main = !ACCENT.has(g.cle);
    const line = { nom: g.nom, cle: g.cle, q, unite: g.unite, quantite: fmtQty(q, g.unite), optionnel: !!g.optionnel, fam: familyOf(g.cle), basique: !main };
    const mine = ctx.byKey.get(g.cle);
    if (mine) {
      if (ctx.urgent?.has(mine.cle) && !urgent.includes(mine.nom)) urgent.push(mine.nom);
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
    // Un ingrédient du frigo (ou du placard) peut-il le remplacer ?
    const subs = SUBSTITUTES[g.cle] || [];
    const swap = subs.find((k) => ctx.byKey.has(k)) || subs.find((k) => ctx.stock.has(k));
    if (swap) {
      used++; swaps++;
      const name = ctx.byKey.get(swap)?.nom || NAMES[swap] || swap;
      return { ...line, etat: "swap", swap: name, note: `ou ${name}, que tu as` };
    }
    missing++;
    if (main) missMain++;
    return { ...line, etat: "need", alt: subs.slice(0, 2).map((k) => NAMES[k] || k) };
  });
  return {
    id: r.id, photo: r.photo, titre: r.titre, temps: r.temps, difficulte: r.difficulte, portions: ctx.people,
    categorie: r.categorie, etapes: withQty(r, scale), astuce: r.astuce || "", ingredients,
    allergenes: r.allergenes || [], regimes: r.regimes || [],
    used, usedMain, missing, missMain, short, swaps,
    urgent,
    score: usedMain * 4 + used - missMain * 5 - (missing - missMain) * 1.5 - short - swaps * 1.5 + urgent.length * 6,
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
    if (opts.sans?.length && r.allergenes?.some((a) => opts.sans.includes(a))) continue;
    const e = evaluate(r, ctx);
    // Il faut utiliser au moins un vrai ingrédient du frigo, et qu'il manque au plus 2 ingrédients principaux.
    if (e.usedMain === 0 || e.missMain > 2 || e.missing > 4) continue;
    if (opts.now && e.missing > 0) continue; // « seulement ce que je peux faire maintenant »
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

// --- Bilan anti-gaspi : poids approximatif des ingrédients ---
const PIECE_G = {
  oeuf: 55, courgette: 250, tomate: 120, carotte: 100, oignon: 120, oignon_rouge: 120, echalote: 30, pomme_de_terre: 150,
  patate_douce: 300, poivron: 180, aubergine: 300, concombre: 300, brocoli: 400, chou_fleur: 800, chou: 1000, poireau: 200,
  celeri: 300, citron: 100, citron_vert: 60, orange: 180, pomme: 150, poire: 170, banane: 120, avocat: 170, mangue: 300,
  kiwi: 80, fenouil: 250, navet: 150, betterave: 150, courge: 1000, champignon: 20, endive: 120, salade: 300, mozzarella: 125,
  peche: 150, abricot: 45, prune: 40, figue: 50, oignon_nouveau: 30, radis: 15, artichaut: 300, poulet: 150, saucisse: 100,
  tortilla: 40, pain: 250, gnocchi: 400, pate_feuilletee: 230, pate_brisee: 230, pate_pizza: 260, steak: 150,
};
const UNIT_G = { "c. à s.": 15, "c. à c.": 5, tranche: 30, boîte: 300, pot: 150, botte: 100, gousse: 5, pincée: 0, "": 0 };

/** Grammes approximatifs pour une quantité d'ingrédient. */
export function grams(cle, q, unite) {
  if (q == null) return 0;
  const b = toBase(q, unite);
  if (b && (b[0] === "m" || b[0] === "v")) return b[1];
  if (unite === "pièce") return q * (PIECE_G[cle] || 100);
  return q * (UNIT_G[unite] ?? 0);
}

/** Recherche par nom : tous les mots tapés doivent se trouver dans le titre ou les ingrédients. */
export function searchCarnet(carnet, q, limit = 40) {
  const words = norm(q).split(" ").filter((w) => w.length > 1);
  if (!words.length) return [];
  const out = [];
  for (const r of carnet) {
    const t = norm(r.titre);
    const ing = norm(r.ingredients.map((g) => g.nom).join(" "));
    if (!words.every((w) => t.includes(w) || ing.includes(w))) continue;
    const inTitle = words.filter((w) => t.includes(w)).length;
    out.push([inTitle * 10 + (t.startsWith(words[0]) ? 5 : 0) - t.length / 100, r]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1]);
}
