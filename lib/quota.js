// Compteurs quotidiens, par visiteur (cookie) et par adresse IP.
// La limite par IP est plus large (x4) pour ne pas pénaliser une famille
// ou un bureau qui partage la même connexion, tout en empêchant
// de tricher en effaçant simplement ses cookies.
import { incr, decr, get } from "./store";

const TTL = 60 * 60 * 26; // la clé contient déjà la date
const IP_FACTOR = 4;

function today() {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Zurich" }).format(new Date());
}

export function limits(pro) {
  const n = (v, d) => {
    const x = parseInt(v, 10);
    return Number.isFinite(x) && x >= 0 ? x : d;
  };
  const proCap = n(process.env.PRO_RECIPES_PER_DAY, 60);
  return {
    recipes: pro ? proCap : n(process.env.FREE_RECIPES_PER_DAY, 1),
    photos: pro ? proCap : n(process.env.FREE_PHOTOS_PER_DAY, 1),
  };
}

function buckets(kind, visitor, ip, limit) {
  const d = today();
  return [
    { key: `q:${kind}:${d}:v:${visitor}`, limit },
    { key: `q:${kind}:${d}:ip:${ip}`, limit: limit * IP_FACTOR },
  ];
}

/** Utilisations restantes aujourd'hui. */
export async function remaining(kind, visitor, ip, limit) {
  const bs = buckets(kind, visitor, ip, limit);
  const vals = await Promise.all(bs.map((b) => get(b.key)));
  return Math.max(0, Math.min(...bs.map((b, i) => b.limit - (Number(vals[i]) || 0))));
}

/** Réserve une utilisation. release() la rend si l'appel à Claude échoue. */
export async function consume(kind, visitor, ip, limit) {
  const bs = buckets(kind, visitor, ip, limit);
  const counts = await Promise.all(bs.map((b) => incr(b.key, TTL)));
  const release = () => Promise.all(bs.map((b) => decr(b.key)));
  const left = Math.min(...bs.map((b, i) => b.limit - counts[i]));
  if (left < 0) {
    await release();
    return { ok: false, left: 0, release: async () => {} };
  }
  return { ok: true, left, release };
}
