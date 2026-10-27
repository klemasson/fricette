// Génère une photo par recette avec un modèle d'images (Flux, via Replicate),
// puis met à jour public/carnet.json.
//
// Usage (sur ton ordinateur, dans le dossier du projet) :
//   npm run photos                 → génère les photos manquantes
//   npm run photos -- --limit 5    → seulement 5 (pour tester)
//   npm run photos -- --only frittata-de-pates-aux-restes --force   → refaire une photo
//   npm run photos -- --dry        → affiche les descriptions sans rien générer
//
// Il faut REPLICATE_API_TOKEN dans .env.local (replicate.com > Account > API tokens).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// --- Lecture de .env.local ---
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = flag("--dry");
const FORCE = flag("--force");
const LIMIT = Number(value("--limit")) || Infinity;
const ONLY = value("--only");
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = process.env.REPLICATE_MODEL || "black-forest-labs/flux-schnell";
const CONCURRENCY = 3;

if (!fs.existsSync("public/carnet.json")) execSync("node scripts/build-carnet.mjs", { stdio: "inherit" });
const carnet = JSON.parse(fs.readFileSync("public/carnet.json", "utf8"));
fs.mkdirSync("public/photos", { recursive: true });

const BASICS = new Set(["sel", "poivre", "huile", "huile_olive", "farine", "sucre", "beurre", "vinaigre", "eau"]);
const SCENES = {
  dessert: "on a small ceramic plate or bowl, light linen napkin",
  gouter: "on a small plate, casual kitchen table",
  "petit-dejeuner": "breakfast table, morning daylight",
  soupe: "in a wide ceramic bowl, spoon beside it",
  salade: "in a large shallow bowl",
  apero: "on a small board, shared snack",
};

function prompt(r) {
  const main = r.ingredients.filter((i) => !BASICS.has(i.cle) && !i.optionnel).slice(0, 6).map((i) => i.nom).join(", ");
  const scene = SCENES[r.categorie] || "served on a simple matte ceramic plate";
  return [
    `Appetizing home-cooked food photograph of the dish "${r.titre}" (French recipe; main ingredients: ${main}).`,
    `${scene}, on a light natural wood table.`,
    "Soft natural daylight from a window, three-quarter overhead angle, shallow depth of field,",
    "realistic textures, modern minimal styling, muted pastel background, no text, no hands, no logo.",
  ].join(" ");
}

const todo = carnet
  .filter((r) => (ONLY ? r.id === ONLY : true))
  .filter((r) => FORCE || !["webp", "jpg", "jpeg", "png"].some((e) => fs.existsSync(`public/photos/${r.id}.${e}`)))
  .slice(0, LIMIT);

if (DRY) {
  for (const r of todo) console.log(`\n${r.id}\n  ${prompt(r)}`);
  console.log(`\n${todo.length} photo(s) à générer.`);
  process.exit(0);
}
if (!TOKEN) {
  console.error("REPLICATE_API_TOKEN manquant dans .env.local. Crée un jeton sur replicate.com > Account > API tokens.");
  process.exit(1);
}
console.log(`${todo.length} photo(s) à générer avec ${MODEL}…`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(r, attempt = 1) {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({
      input: { prompt: prompt(r), aspect_ratio: "3:2", output_format: "webp", output_quality: 82, num_outputs: 1 },
    }),
  });
  if (res.status === 429 && attempt <= 5) { await sleep(5000 * attempt); return generate(r, attempt + 1); }
  let pred = await res.json();
  if (!res.ok) throw new Error(pred.detail || pred.title || `HTTP ${res.status}`);
  // Si la génération n'est pas finie dans le délai d'attente, on interroge jusqu'au résultat.
  while (pred.status && !["succeeded", "failed", "canceled"].includes(pred.status)) {
    await sleep(1500);
    pred = await (await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (pred.status && pred.status !== "succeeded") throw new Error(pred.error || pred.status);
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const img = await fetch(url);
  if (!img.ok) throw new Error(`téléchargement impossible (${img.status})`);
  const ext = (url.split("?")[0].split(".").pop() || "webp").toLowerCase();
  fs.writeFileSync(path.join("public/photos", `${r.id}.${["webp", "jpg", "jpeg", "png"].includes(ext) ? ext : "webp"}`), Buffer.from(await img.arrayBuffer()));
}

let done = 0, failed = 0;
const queue = [...todo];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const r = queue.shift();
      try {
        await generate(r);
        done++;
        console.log(`✓ ${done}/${todo.length}  ${r.titre}`);
      } catch (e) {
        failed++;
        console.log(`✗ ${r.titre} : ${e.message}`);
      }
    }
  })
);

console.log(`\nTerminé : ${done} photo(s) créée(s), ${failed} échec(s). Relance la commande pour réessayer les échecs.`);
execSync("node scripts/build-carnet.mjs", { stdio: "inherit" });
