// Le carnet côté serveur (pages de recettes, pages « que faire avec… », plan du site).
import fs from "node:fs";
import path from "node:path";
import { ACCENT, ingredientName, fmtQty } from "./match";

let cache = null;
export function carnet() {
  if (!cache) cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/carnet.json"), "utf8"));
  return cache;
}

export function getRecipe(id) {
  return carnet().find((r) => r.id === id) || null;
}

const mains = (r) => new Set(r.ingredients.filter((g) => !ACCENT.has(g.cle) && !g.optionnel).map((g) => g.cle));

/** Recettes qui partagent le plus d'ingrédients principaux. */
export function similar(r, n = 4) {
  const mine = mains(r);
  return carnet()
    .filter((x) => x.id !== r.id)
    .map((x) => {
      let s = 0;
      for (const k of mains(x)) if (mine.has(k)) s++;
      return [s + (x.categorie === r.categorie ? 0.5 : 0), x];
    })
    .filter(([s]) => s >= 1)
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map((x) => x[1]);
}

// Pages « que faire avec… » : ingrédients principaux présents dans au moins 4 recettes.
const SKIP = new Set(["eau", "graine", "herbes", "levure", "levure_boulanger", "gelifiant"]);
export const slugOf = (cle) => cle.replace(/_/g, "-");
export const cleOf = (slug) => String(slug).replace(/-/g, "_");

export function ingredientPages() {
  const count = new Map();
  for (const r of carnet()) for (const k of mains(r)) count.set(k, (count.get(k) || 0) + 1);
  return [...count]
    .filter(([k, n]) => n >= 4 && !SKIP.has(k))
    .map(([cle, n]) => ({ cle, slug: slugOf(cle), nom: ingredientName(cle), n }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export function recipesWith(cle) {
  return carnet()
    .filter((r) => r.ingredients.some((g) => g.cle === cle && !g.optionnel))
    .sort((a, b) => (b.photo ? 1 : 0) - (a.photo ? 1 : 0) || a.temps - b.temps);
}

export const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function ingredientLine(g) {
  const q = fmtQty(g.qte, g.unite);
  return q ? `${q} ${g.nom}` : g.nom;
}
