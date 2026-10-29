// Assemble data/parts/*.json en un seul fichier public/carnet.json, servi au navigateur.
// Usage : npm run carnet   (à relancer après avoir ajouté ou modifié des recettes)
import fs from "node:fs";
import path from "node:path";
import { allergensOf } from "../data/allergens.js";

const dir = "data/parts";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const seen = new Set();
const all = [];
for (const f of files) {
  for (const r of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) {
    let id = r.titre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    while (seen.has(id)) id += "-2";
    seen.add(id);
    // Photo facultative : public/photos/<id>.jpg (ou .webp / .png). Sinon, le site dessine une illustration.
    const photo = ["webp", "jpg", "jpeg", "png"].map((ext) => `photos/${id}.${ext}`).find((f) => fs.existsSync(path.join("public", f)));
    all.push({ id, ...r, allergenes: allergensOf(r), ...(photo ? { photo: "/" + photo } : {}) });
  }
}
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/carnet.json", JSON.stringify(all));
// Version légère pour la recherche dans le navigateur : sans les étapes ni l'astuce
// (chargées seulement à l'ouverture d'une recette, via /api/recette/<id>).
const lite = all.map(({ etapes, astuce, ...r }) => ({ ...r, ingredients: r.ingredients.map(({ cle, nom, qte, unite, optionnel }) => ({ cle, nom, qte, unite, ...(optionnel ? { optionnel } : {}) })) }));
fs.writeFileSync("public/carnet-lite.json", JSON.stringify(lite));
const withPhoto = all.filter((r) => r.photo).length;
console.log(`${withPhoto} recette(s) avec photo.`);
console.log(`version légère : ${Math.round(fs.statSync("public/carnet-lite.json").size / 1024)} Ko`);
console.log(`${all.length} recettes écrites dans public/carnet.json (${Math.round(fs.statSync("public/carnet.json").size / 1024)} Ko)`);
