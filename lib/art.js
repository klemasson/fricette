// Illustrations géométriques : chaque famille d'aliments a une forme plate et une couleur.
// Elles servent aux jetons du frigo, à la légende et à la petite « nature morte » de chaque recette.

export const FAM = {
  rouge: { c: "#f2552c", k: "circle", l: "tomates & fruits rouges" },
  vert: { c: "#3aa864", k: "pill", l: "légumes verts" },
  jaune: { c: "#f5c518", k: "egg", l: "œufs, pâtes, fromages" },
  orange: { c: "#f39233", k: "tri", l: "carottes & courges" },
  blanc: { c: "#b9c8f5", k: "cube", l: "laitages" },
  rose: { c: "#f59ab8", k: "half", l: "viandes" },
  bleu: { c: "#4b74e6", k: "fish", l: "poissons" },
  beige: { c: "#c7a07a", k: "sq", l: "pain & céréales" },
  violet: { c: "#8e6be8", k: "ring", l: "aubergines & co" },
  gris: { c: "#b4b4b0", k: "dot", l: "autres" },
};

const n = (v) => Number(v).toFixed(1);

export function shapeSvg(fam, x, y, s, rot) {
  const { c, k } = FAM[fam] || FAM.gris;
  const t = `transform="translate(${n(x)} ${n(y)}) rotate(${Math.round(rot)})"`;
  switch (k) {
    case "circle":
      return `<g ${t}><circle r="${n(s / 2)}" fill="${c}"/><ellipse cx="${n(s * 0.08)}" cy="${n(-s * 0.5)}" rx="${n(s * 0.16)}" ry="${n(s * 0.07)}" fill="#3aa864"/></g>`;
    case "pill":
      return `<g ${t}><rect x="${n(-s * 0.75)}" y="${n(-s * 0.22)}" width="${n(s * 1.5)}" height="${n(s * 0.44)}" rx="${n(s * 0.22)}" fill="${c}"/></g>`;
    case "egg":
      return `<g ${t}><ellipse rx="${n(s * 0.48)}" ry="${n(s * 0.4)}" fill="#ffffff" stroke="#000" stroke-opacity=".12" stroke-width="${n(Math.max(1, s * 0.05))}"/><circle cx="${n(s * 0.04)}" r="${n(s * 0.19)}" fill="${c}"/></g>`;
    case "tri":
      return `<g ${t}><path d="M0 ${n(-s * 0.62)} L${n(s * 0.48)} ${n(s * 0.42)} Q0 ${n(s * 0.56)} ${n(-s * 0.48)} ${n(s * 0.42)} Z" fill="${c}"/></g>`;
    case "cube":
      return `<g ${t}><rect x="${n(-s * 0.38)}" y="${n(-s * 0.38)}" width="${n(s * 0.76)}" height="${n(s * 0.76)}" rx="${n(s * 0.12)}" fill="${c}"/></g>`;
    case "half":
      return `<g ${t}><path d="M${n(-s * 0.52)} ${n(s * 0.12)} A${n(s * 0.52)} ${n(s * 0.52)} 0 0 1 ${n(s * 0.52)} ${n(s * 0.12)} Z" fill="${c}"/></g>`;
    case "fish":
      return `<g ${t}><path d="M${n(-s * 0.6)} 0 Q0 ${n(-s * 0.48)} ${n(s * 0.38)} 0 Q0 ${n(s * 0.48)} ${n(-s * 0.6)} 0 Z M${n(s * 0.32)} 0 L${n(s * 0.62)} ${n(-s * 0.26)} L${n(s * 0.62)} ${n(s * 0.26)} Z" fill="${c}"/></g>`;
    case "sq":
      return `<g ${t}><rect x="${n(-s * 0.4)}" y="${n(-s * 0.32)}" width="${n(s * 0.8)}" height="${n(s * 0.64)}" rx="${n(s * 0.2)}" fill="${c}"/></g>`;
    case "ring":
      return `<g ${t}><circle r="${n(s * 0.42)}" fill="none" stroke="${c}" stroke-width="${n(s * 0.2)}"/></g>`;
    default:
      return `<g ${t}><circle r="${n(s * 0.3)}" fill="${c}"/></g>`;
  }
}

/** Une petite icône carrée (jetons, légende). */
export function iconSvg(fam, rot = -10) {
  return `<svg viewBox="-14 -14 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${shapeSvg(fam, 0, 0, 18, rot)}</svg>`;
}

function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const PASTELS = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)", "var(--p5)", "var(--p6)"];

/** Nature morte d'une recette : ses ingrédients en formes, sur un fond pastel, toujours la même pour une recette donnée. */
export function artSvg(seed, fams, { w = 320, h = 200, hero = false } = {}) {
  const r = rng(seed);
  const bg = PASTELS[Math.floor(r() * PASTELS.length)];
  let o = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">`;
  o += hero ? `<circle cx="${w / 2}" cy="${h / 2}" r="${n(w * 0.46)}" fill="var(--p3)"/>` : `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  const list = fams.length ? fams.slice(0, 7) : ["gris"];
  const count = list.length;
  const s = hero ? w * 0.2 : h * (count > 5 ? 0.25 : 0.3);
  const cx = w / 2, cy = h / 2;
  list.forEach((f, i) => {
    const a = (i / count) * Math.PI * 2 + r() * 0.5 - Math.PI / 2;
    const d = count === 1 ? 0 : (hero ? w * 0.2 : h * 0.26) * (0.75 + r() * 0.35);
    const x = cx + Math.cos(a) * d * (hero ? 1 : 1.35);
    const y = cy + Math.sin(a) * d;
    o += `<ellipse cx="${n(x)}" cy="${n(y + s * 0.45)}" rx="${n(s * 0.42)}" ry="${n(s * 0.08)}" fill="#000" opacity=".07"/>`;
    o += shapeSvg(f, x, y, s * (0.85 + r() * 0.3), r() * 80 - 40);
  });
  return o + "</svg>";
}
