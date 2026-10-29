// Ajoute les descriptions photo de data/prompts-new/*.json dans data/photo-prompts.json.
import fs from "node:fs";
const main = JSON.parse(fs.readFileSync("data/photo-prompts.json", "utf8"));
const files = process.argv.slice(2);
let n = 0;
for (const f of files) for (const [id, d] of Object.entries(JSON.parse(fs.readFileSync(f, "utf8")))) { if (!main[id]) n++; main[id] = d; }
fs.writeFileSync("data/photo-prompts.json", JSON.stringify(main, null, 2) + "\n");
console.log(`${n} description(s) ajoutée(s), ${Object.keys(main).length} au total`);
