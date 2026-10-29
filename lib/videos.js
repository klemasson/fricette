// Vidéos des gestes : on vérifie auprès de YouTube (oEmbed) que chaque vidéo existe encore et
// accepte d'être intégrée. Celles qui ne passent pas sont masquées automatiquement.
import VIDEOS from "@/data/videos.json";

let cache = globalThis.__frcVideos || null;
const DAY = 24 * 3600 * 1000;

async function check(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`, { signal: AbortSignal.timeout(6000) });
    if (r.status === 401 || r.status === 403 || r.status === 404) return { ok: false };
    if (!r.ok) return { ok: true, unchecked: true };
    const j = await r.json();
    return { ok: true, title: j.title, channel: j.author_name };
  } catch {
    return { ok: true, unchecked: true }; // YouTube injoignable : on ne masque rien
  }
}

/** { clé: { id, titre, chaine, ok, unchecked } } */
export async function videos() {
  if (cache && Date.now() - cache.t < DAY) return cache.v;
  const entries = await Promise.all(Object.entries(VIDEOS).map(async ([k, v]) => {
    const c = await check(v.id);
    return [k, { id: v.id, titre: c.title || v.titre, chaine: c.channel || "", ok: c.ok, unchecked: !!c.unchecked }];
  }));
  const v = Object.fromEntries(entries);
  cache = globalThis.__frcVideos = { t: Date.now(), v };
  return v;
}
