// Image verticale 1080 x 1920 (format story Instagram / TikTok) pour partager une recette.
import { ICON_SVG } from "./brand";

const W = 1080, H = 1920;

function loadImg(src) {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error("image"));
    i.src = src;
  });
}

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * r : { titre, temps, difficulte, ingredients }, photo : URL de l'image (recette ou réalisation),
 * kicker : petite ligne au-dessus du titre, by : signature facultative (« par Léa »).
 */
export async function makeStory({ r, photo, kicker = "Recette anti-gaspi", by, ai = false }) {
  const display = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
  const body = '"DM Sans", system-ui, sans-serif';
  try { await Promise.all([document.fonts.load(`800 80px ${display}`), document.fonts.load(`500 40px ${body}`)]); } catch {}

  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff6ef";
  ctx.fillRect(0, 0, W, H);

  // Photo : grande, arrondie, en haut (dans la zone visible des stories).
  const px = 70, py = 230, pw = W - 140, ph = 940;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 48);
  ctx.clip();
  ctx.fillStyle = "#ffe4da";
  ctx.fillRect(px, py, pw, ph);
  if (photo) {
    try {
      const img = await loadImg(photo);
      const k = Math.max(pw / img.width, ph / img.height);
      const w = img.width * k, h = img.height * k;
      ctx.drawImage(img, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
    } catch {}
  }
  ctx.restore();
  if (ai && photo) {
    // Les photos du carnet sont générées par IA : on le dit aussi sur l'image partagée.
    ctx.font = `600 28px ${body}`;
    const t = "Photo IA", tw = ctx.measureText(t).width;
    roundRect(ctx, px + 24, py + ph - 72, tw + 36, 48, 24);
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(t, px + 42, py + ph - 47);
    ctx.textBaseline = "alphabetic";
  }

  // Logo en haut.
  try {
    const logo = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(ICON_SVG().replace("<svg ", '<svg width="200" height="200" ')));
    ctx.drawImage(logo, 70, 92, 96, 96);
  } catch {}
  ctx.fillStyle = "#16181d";
  ctx.font = `800 64px ${display}`;
  ctx.textBaseline = "middle";
  ctx.fillText("fricette", 180, 142);

  // Texte.
  ctx.textBaseline = "alphabetic";
  let y = py + ph + 100;
  ctx.fillStyle = "#f2552c";
  ctx.font = `700 34px ${body}`;
  ctx.fillText(kicker.toUpperCase(), 70, y);
  y += 30;
  ctx.fillStyle = "#16181d";
  ctx.font = `800 82px ${display}`;
  for (const line of wrap(ctx, r.titre, W - 140, 3)) { y += 88; ctx.fillText(line, 70, y); }

  const meta = [r.temps && `${r.temps} min`, r.difficulte, by && `par ${by}`].filter(Boolean).join("  ·  ");
  if (meta) {
    y += 70;
    ctx.fillStyle = "#6a6d74";
    ctx.font = `500 40px ${body}`;
    ctx.fillText(meta, 70, y);
  }

  // Pied : l'adresse du site, bien visible.
  roundRect(ctx, 70, H - 250, W - 140, 130, 65);
  ctx.fillStyle = "#16181d";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `700 46px ${body}`;
  ctx.fillText("La recette sur fricette.ch", W / 2, H - 170);
  ctx.textAlign = "left";

  return new Promise((ok) => c.toBlob(ok, "image/png"));
}

/** Partage l'image (feuille de partage du téléphone) ou la télécharge sur ordinateur. */
export async function shareStory(opts) {
  const blob = await makeStory(opts);
  const name = `fricette-${(opts.r.id || "recette").slice(0, 40)}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: opts.r.titre });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancel";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return "downloaded";
}
