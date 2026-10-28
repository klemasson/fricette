"""Génère une photo (IA) pour chaque recette du carnet qui n'en a pas encore.

Tourne sur GitHub Actions (voir .github/workflows/photos.yml), sur processeur, avec un
modèle d'images libre (LCM Dreamshaper v7, licence CreativeML OpenRAIL-M).
Usage : python scripts/gen_images.py --shard 0 --shards 8 --out out/
"""
import argparse, json, os, sys, time, traceback
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("--shard", type=int, default=0)
p.add_argument("--shards", type=int, default=1)
p.add_argument("--out", default="out")
p.add_argument("--limit", type=int, default=0)
args = p.parse_args()

ROOT = Path(__file__).resolve().parent.parent
carnet = json.loads((ROOT / "public/carnet.json").read_text())
prompts_file = ROOT / "data/photo-prompts.json"
prompts = json.loads(prompts_file.read_text()) if prompts_file.exists() else {}
photos = ROOT / "public/photos"
have = {f.stem for f in photos.glob("*") if f.suffix in (".webp", ".jpg", ".jpeg", ".png")}

todo = [r for r in carnet if r["id"] not in have]
if args.limit:
    todo = todo[: args.limit]
todo = [r for i, r in enumerate(todo) if i % args.shards == args.shard]
print(f"shard {args.shard}/{args.shards}: {len(todo)} photo(s) à générer", flush=True)
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
if not todo:
    sys.exit(0)

import torch
from diffusers import AutoPipelineForText2Image, LCMScheduler

torch.set_num_threads(os.cpu_count() or 4)
MODEL = os.environ.get("IMAGE_MODEL", "SimianLuo/LCM_Dreamshaper_v7")
pipe = AutoPipelineForText2Image.from_pretrained(MODEL, torch_dtype=torch.float32, safety_checker=None, requires_safety_checker=False)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.set_progress_bar_config(disable=True)

BASICS = {"sel", "poivre", "huile", "huile_olive", "farine", "sucre", "beurre", "vinaigre", "eau"}
STYLE = ("professional food photography, appetizing home-cooked dish, served on a simple matte ceramic plate, "
         "light natural wood table, soft natural window daylight, three-quarter overhead view, shallow depth of field, "
         "realistic textures, minimal modern styling, muted pastel background, no text, no hands")

def prompt_for(r):
    desc = prompts.get(r["id"])
    if not desc:
        main = ", ".join(i["nom"] for i in r["ingredients"] if i["cle"] not in BASICS and not i.get("optionnel"))[:120]
        desc = f'{r["titre"]} ({main})'
    return f"{desc}. {STYLE}"

def seed_for(s):
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h

done = 0
for r in todo:
    t = time.time()
    try:
        g = torch.Generator().manual_seed(seed_for(r["id"]))
        img = pipe(prompt=prompt_for(r), num_inference_steps=4, guidance_scale=8.0,
                   width=640, height=448, generator=g).images[0]
        img.save(out / f'{r["id"]}.webp', "WEBP", quality=80, method=6)
        done += 1
        print(f"ok {r['id']} ({time.time() - t:.1f}s)", flush=True)
    except Exception:
        print(f"ERREUR {r['id']}", flush=True)
        traceback.print_exc()
print(f"shard {args.shard}: {done}/{len(todo)} photo(s) créée(s)")
