// Liste des identifiants de recettes existants (pour valider les favoris).
import fs from "node:fs";
import path from "node:path";

let ids = null;
export function recipeExists(id) {
  if (!ids) {
    try {
      const carnet = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/carnet.json"), "utf8"));
      ids = new Set(carnet.map((r) => r.id));
    } catch {
      ids = new Set();
    }
  }
  return typeof id === "string" && ids.has(id);
}
