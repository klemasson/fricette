// Vérifie un ou plusieurs fichiers de recettes (JSON) contre le vocabulaire.
// Usage : node scripts/check-carnet.mjs data/parts/*.json
import fs from "node:fs";
import { VOCAB } from "../data/vocab.js";

export const UNITS = ["", "pièce", "g", "kg", "ml", "cl", "l", "tranche", "botte", "boîte", "pot", "c. à s.", "c. à c.", "pincée", "gousse"];
export const REGIMES = ["vegetarien", "vegan", "sans_gluten", "sans_lactose", "sans_porc", "sans_alcool"];
export const CATEGORIES = ["plat", "entree", "soupe", "salade", "accompagnement", "dessert", "petit-dejeuner", "gouter", "apero"];
const KEYS = new Set(VOCAB.map((v) => v[0]));

const files = process.argv.slice(2);
let total = 0, errors = 0;
const titles = new Map();
for (const f of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.log(`${f}: JSON invalide – ${e.message}`); errors++; continue; }
  if (!Array.isArray(data)) { console.log(`${f}: doit être un tableau`); errors++; continue; }
  data.forEach((r, i) => {
    const where = `${f} #${i} « ${r?.titre} »`;
    const err = (m) => { console.log(`${where}: ${m}`); errors++; };
    total++;
    if (!r.titre || typeof r.titre !== "string") err("titre manquant");
    const t = String(r.titre).toLowerCase();
    if (titles.has(t)) err(`titre en double (aussi dans ${titles.get(t)})`); else titles.set(t, f);
    if (!CATEGORIES.includes(r.categorie)) err(`categorie invalide: ${r.categorie}`);
    if (!Number.isInteger(r.temps) || r.temps < 3 || r.temps > 240) err("temps invalide");
    if (!["facile", "moyen", "difficile"].includes(r.difficulte)) err("difficulte invalide");
    if (!Number.isInteger(r.portions) || r.portions < 1 || r.portions > 12) err("portions invalide");
    if (!Array.isArray(r.regimes) || r.regimes.some((x) => !REGIMES.includes(x))) err(`regimes invalides: ${r.regimes}`);
    if (!Array.isArray(r.ingredients) || r.ingredients.length < 2) err("ingredients manquants");
    else r.ingredients.forEach((g) => {
      if (!KEYS.has(g.cle)) err(`clé inconnue: ${g.cle}`);
      if (!g.nom) err(`nom manquant pour ${g.cle}`);
      if (!UNITS.includes(g.unite ?? "")) err(`unité invalide « ${g.unite} » pour ${g.cle}`);
      if (g.qte !== null && !(typeof g.qte === "number" && g.qte > 0)) err(`qte invalide pour ${g.cle}`);
    });
    if (!Array.isArray(r.etapes) || r.etapes.length < 2) err("étapes manquantes");
    if (r.astuce !== undefined && typeof r.astuce !== "string") err("astuce doit être un texte");
  });
}
console.log(`${total} recettes vérifiées, ${errors} erreur(s).`);
process.exit(errors ? 1 : 0);
