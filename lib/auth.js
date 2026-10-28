// Comptes : e-mail + mot de passe (haché avec scrypt), session dans un cookie signé.
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { sign, verify } from "./session";
import { findUserById } from "./db";

const COOKIE = "frc_user";
const MAX_AGE = 60 * 60 * 24 * 180; // 6 mois

export function normEmail(v) {
  const e = String(v || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200 ? e : null;
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function checkPassword(pw, stored) {
  const [kind, saltHex, hashHex] = String(stored).split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(expected, got);
}

export async function startSession(userId) {
  const jar = await cookies();
  jar.set(COOKIE, sign({ uid: userId, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** L'utilisateur connecté, ou null. */
export async function currentUser() {
  const data = verify((await cookies()).get(COOKIE)?.value);
  if (!data?.uid) return null;
  return findUserById(data.uid);
}

/** Refuse les requêtes envoyées depuis un autre site (protection CSRF). */
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // navigateurs anciens / outils : le cookie SameSite=Lax protège déjà
  try {
    return new URL(origin).host === (h.get("x-forwarded-host") || h.get("host"));
  } catch {
    return false;
  }
}

// Limite les tentatives de connexion (en mémoire) : 10 essais par 15 minutes.
const attempts = globalThis.__frcAttempts || (globalThis.__frcAttempts = new Map());
export function tooManyAttempts(key) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  list.push(now);
  attempts.set(key, list);
  return list.length > 10;
}
