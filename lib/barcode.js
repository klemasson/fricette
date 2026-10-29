// Codes-barres -> ingrédient du frigo, grâce à la base libre Open Food Facts.
import { resolve, ingredientName } from "./match";
import { getDb } from "./db";

// Catégories Open Food Facts (anglais) -> clé du vocabulaire. Les plus précises d'abord.
const CATEGORIES = [
  ["smoked-salmons", "saumon_fume"], ["salmons", "saumon"], ["tunas", "thon"], ["sardines", "sardine"],
  ["shrimps", "crevette"], ["prawns", "crevette"], ["mussels", "moule"], ["surimi", "surimi"], ["white-fish", "poisson_blanc"], ["cod", "poisson_blanc"],
  ["feta", "feta"], ["mozzarella", "mozzarella"], ["burrata", "mozzarella"], ["parmigiano-reggiano", "parmesan"], ["grana-padano", "parmesan"],
  ["gruyere", "gruyere"], ["emmentaler", "emmental"], ["emmental", "emmental"], ["comte", "comte"], ["raclette-cheeses", "raclette"], ["raclette", "raclette"],
  ["reblochon", "reblochon"], ["camembert", "camembert"], ["blue-cheeses", "bleu"], ["goat-cheeses", "chevre"], ["mascarpone", "mascarpone"],
  ["ricotta", "ricotta"], ["cream-cheeses", "fromage_frais"], ["fromage-blanc", "fromage_blanc"], ["quark", "fromage_blanc"], ["grated-cheese", "fromage_rape"], ["grated-cheeses", "fromage_rape"],
  ["plain-yogurts", "yaourt"], ["yogurts", "yaourt"], ["butters", "beurre"], ["coconut-milks", "lait_coco"], ["plant-based-milk", "lait_vegetal"], ["plant-milks", "lait_vegetal"],
  ["milks", "lait"], ["cooking-creams", "creme"], ["creams", "creme"], ["eggs", "oeuf"], ["chicken-eggs", "oeuf"],
  ["bacon", "lardons"], ["lardons", "lardons"], ["chorizo", "chorizo"], ["dry-hams", "jambon_cru"], ["cured-hams", "jambon_cru"], ["hams", "jambon"], ["cooked-hams", "jambon"],
  ["sausages", "saucisse"], ["minced-beef", "boeuf_hache"], ["ground-beef", "boeuf_hache"], ["beef", "boeuf"], ["veal", "veau"], ["lamb", "agneau"], ["pork", "porc"],
  ["turkey", "dinde"], ["chicken", "poulet"], ["tofu", "tofu"],
  ["puff-pastries", "pate_feuilletee"], ["shortcrust-pastries", "pate_brisee"], ["pizza-doughs", "pate_pizza"], ["tortillas", "tortilla"], ["wraps", "tortilla"],
  ["gnocchi", "gnocchi"], ["lasagna", "pates_lasagne"], ["pastas", "pates"], ["risotto-rice", "riz_risotto"], ["rices", "riz"], ["couscous", "semoule"], ["semolinas", "semoule"],
  ["bulgur", "boulgour"], ["quinoa", "quinoa"], ["polenta", "polenta"], ["rolled-oats", "flocon_avoine"], ["oat-flakes", "flocon_avoine"], ["breadcrumbs", "chapelure"],
  ["sliced-breads", "pain_mie"], ["sandwich-breads", "pain_mie"], ["breads", "pain"],
  ["red-lentils", "lentille_corail"], ["lentils", "lentille"], ["chickpeas", "pois_chiche"], ["red-kidney-beans", "haricot_rouge"], ["kidney-beans", "haricot_rouge"], ["white-beans", "haricot_blanc"],
  ["green-beans", "haricot_vert"], ["peas", "petit_pois"], ["sweet-corn", "mais"], ["corn", "mais"],
  ["tomato-pastes", "concentre_tomate"], ["chopped-tomatoes", "tomate_concassee"], ["crushed-tomatoes", "tomate_concassee"], ["tomato-sauces", "tomate_concassee"], ["canned-tomatoes", "tomate_concassee"], ["tomato-purees", "tomate_concassee"],
  ["olives", "olive"], ["gherkins", "cornichon"], ["capers", "capre"], ["pestos", "pesto"], ["mayonnaises", "mayonnaise"], ["ketchup", "ketchup"], ["mustards", "moutarde"],
  ["soy-sauces", "sauce_soja"], ["fish-sauces", "nuoc_mam"], ["honeys", "miel"], ["jams", "confiture"], ["dark-chocolates", "chocolat"], ["chocolates", "chocolat"], ["cocoa-powders", "cacao"],
  ["coconut", "noix_coco"], ["almonds", "amande"], ["hazelnuts", "noisette"], ["walnuts", "noix"], ["peanuts", "cacahuete"], ["raisins", "raisin_sec"],
  ["stocks", "bouillon"], ["bouillon-cubes", "bouillon"], ["olive-oils", "huile_olive"], ["vegetable-oils", "huile"], ["vinegars", "vinaigre"],
  ["flours", "farine"], ["sugars", "sucre"], ["baking-powders", "levure"], ["white-wines", "vin_blanc"], ["red-wines", "vin_rouge"], ["beers", "biere"],
  ["spinachs", "epinard"], ["spinach", "epinard"], ["mushrooms", "champignon"], ["carrots", "carotte"], ["potatoes", "pomme_de_terre"], ["frozen-fries", "pomme_de_terre"],
  ["broccoli", "brocoli"], ["cauliflowers", "chou_fleur"], ["leeks", "poireau"], ["zucchini", "courgette"], ["eggplants", "aubergine"], ["avocados", "avocat"],
  ["berries", "fruits_rouges"], ["strawberries", "fraise"], ["bananas", "banane"], ["apples", "pomme"], ["pears", "poire"], ["lemons", "citron"],
  ["vanilla", "vanille"], ["coffees", "cafe"],
];

function guessKey(p) {
  const names = [p.product_name_fr, p.generic_name_fr, p.product_name, p.generic_name].filter(Boolean);
  for (const n of names) {
    const k = resolve(n);
    if (k) return k;
  }
  const tags = (p.categories_tags || []).slice().reverse(); // les plus précises sont à la fin
  for (const t of tags) {
    const [lang, slug] = t.includes(":") ? t.split(":") : ["en", t];
    if (lang === "fr") { const k = resolve(slug.replace(/-/g, " ")); if (k) return k; }
    const hit = CATEGORIES.find(([c]) => slug === c || slug.endsWith("-" + c));
    if (hit) return hit[1];
  }
  return null;
}

function quantity(p, key) {
  const q = Number(p.product_quantity), u = String(p.product_quantity_unit || "").toLowerCase();
  if (key === "oeuf") {
    const m = String(p.quantity || "").match(/(\d+)\s*(?:x|œufs?|oeufs?|eggs?|pcs|pièces?|stk|st\.?)?/i);
    const n = m ? Number(m[1]) : 0;
    return n > 0 && n <= 30 ? { qte: n, unite: "pièce" } : { qte: null, unite: "pièce" };
  }
  if (q > 0 && (u === "g" || u === "ml")) return { qte: Math.round(q), unite: u };
  const m = String(p.quantity || "").replace(",", ".").match(/([\d.]+)\s*(kg|g|dl|cl|ml|l)\b/i);
  if (m) {
    let v = parseFloat(m[1]); const unit = m[2].toLowerCase();
    if (unit === "kg") return { qte: Math.round(v * 1000), unite: "g" };
    if (unit === "l") return { qte: Math.round(v * 1000), unite: "ml" };
    if (unit === "dl") return { qte: Math.round(v * 100), unite: "ml" };
    if (unit === "cl") return { qte: Math.round(v * 10), unite: "ml" };
    return { qte: Math.round(v), unite: unit };
  }
  return { qte: null, unite: "" };
}

/** Transforme une fiche Open Food Facts en ingrédient pour le frigo. */
export function toIngredient(code, p) {
  const product = [p.product_name_fr || p.product_name || p.generic_name_fr || "", p.brands?.split(",")[0]].filter(Boolean).join(" · ").slice(0, 80);
  const key = guessKey(p);
  const { qte, unite } = quantity(p, key);
  return {
    code,
    found: true,
    product,
    nom: key ? ingredientName(key) : (p.product_name_fr || p.product_name || "").slice(0, 40),
    known: !!key,
    qte,
    unite,
  };
}

const FIELDS = "product_name,product_name_fr,generic_name,generic_name_fr,brands,categories_tags,quantity,product_quantity,product_quantity_unit";

export async function lookup(code) {
  const db = getDb();
  db.exec("CREATE TABLE IF NOT EXISTS barcodes (code TEXT PRIMARY KEY, json TEXT NOT NULL, ts INTEGER NOT NULL)");
  const row = db.prepare("SELECT json, ts FROM barcodes WHERE code = ?").get(code);
  const fresh = row && Date.now() - row.ts < 30 * 86400000;
  let p = fresh ? JSON.parse(row.json) : undefined;
  if (p === undefined) {
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, {
        headers: { "User-Agent": "Fricette/1.0 (bonjour@fricette.ch)" },
        signal: AbortSignal.timeout(7000),
      });
      if (r.status === 404) p = null;
      else if (!r.ok) throw new Error("OFF " + r.status);
      else { const j = await r.json(); p = j.status === 1 && j.product ? j.product : null; }
    } catch (e) {
      if (row) p = JSON.parse(row.json); // réseau en panne : on garde l'ancienne fiche
      else throw e;
    }
    db.prepare("INSERT INTO barcodes (code, json, ts) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET json = excluded.json, ts = excluded.ts")
      .run(code, JSON.stringify(p), Date.now());
  }
  if (!p || !(p.product_name || p.product_name_fr || p.generic_name_fr)) return { code, found: false };
  return toIngredient(code, p);
}
