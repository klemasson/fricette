// Petit stockage clé/valeur : Upstash Redis en production,
// mémoire du serveur en local quand Upstash n'est pas configuré.
import { Redis } from "@upstash/redis";

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

if (!hasRedis && process.env.NODE_ENV === "production") {
  console.warn(
    "[store] Upstash Redis n'est pas configuré : les compteurs seront remis à zéro à chaque redémarrage."
  );
}

const mem = globalThis.__olfMem || (globalThis.__olfMem = new Map());

function memGet(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp && e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.v;
}

export async function incr(key, ttlSeconds) {
  if (redis) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, ttlSeconds);
    return n;
  }
  const n = (Number(memGet(key)) || 0) + 1;
  const prev = mem.get(key);
  mem.set(key, { v: n, exp: prev?.exp || Date.now() + ttlSeconds * 1000 });
  return n;
}

export async function decr(key) {
  if (redis) return redis.decr(key);
  const e = mem.get(key);
  if (e) e.v = Math.max(0, Number(e.v) - 1);
  return e ? e.v : 0;
}

export async function get(key) {
  if (redis) return redis.get(key);
  return memGet(key);
}

export async function set(key, value, ttlSeconds) {
  if (redis) return redis.set(key, value, { ex: ttlSeconds });
  mem.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
}
