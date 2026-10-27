// Cookies signés : un identifiant anonyme pour compter les essais gratuits,
// et un cookie "abonné" qui contient l'identifiant client Stripe.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies, headers } from "next/headers";

const ANON = "olf_id";
const PRO = "olf_pro";
const YEAR = 60 * 60 * 24 * 365;

// Clé de signature des cookies : SESSION_SECRET si elle est définie, sinon une clé
// générée automatiquement au premier lancement et gardée dans le fichier .session-secret.
let cachedSecret = null;
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (cachedSecret) return cachedSecret;
  const file = path.join(process.cwd(), ".session-secret");
  try {
    cachedSecret = fs.readFileSync(file, "utf8").trim();
  } catch {}
  if (!cachedSecret || cachedSecret.length < 32) {
    cachedSecret = crypto.randomBytes(32).toString("hex");
    try { fs.writeFileSync(file, cachedSecret, { mode: 0o600 }); } catch (e) { console.warn("[session] impossible d'enregistrer .session-secret", e?.message); }
  }
  return cachedSecret;
}

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: YEAR,
};

/** Identifiant anonyme du visiteur (créé au besoin). */
export async function visitorId() {
  const jar = await cookies();
  const existing = verify(jar.get(ANON)?.value);
  if (existing?.id) return existing.id;
  const id = crypto.randomUUID();
  jar.set(ANON, sign({ id }), cookieOpts);
  return id;
}

/** Adresse IP du visiteur (sert à limiter les abus quand on efface ses cookies). */
export async function visitorIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : h.get("x-real-ip")) || "local";
  return crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 24);
}

export async function proCustomerId() {
  const jar = await cookies();
  return verify(jar.get(PRO)?.value)?.cid || null;
}

export async function setProCustomer(cid) {
  const jar = await cookies();
  jar.set(PRO, sign({ cid }), cookieOpts);
}

export async function clearPro() {
  const jar = await cookies();
  jar.delete(PRO);
}
