// Notifications sur le téléphone (Web Push) : défi du lundi et produits à finir.
// Les clés VAPID sont créées automatiquement au premier usage et gardées dans ~/fricette-data/vapid.json.
import fs from "node:fs";
import webpush from "web-push";
import { dataPath, getDb } from "./db";
import { daysLeft } from "./match";

let ready = false;
function table() {
  if (ready) return;
  getDb().exec(`CREATE TABLE IF NOT EXISTS push_subs (
    endpoint TEXT PRIMARY KEY, json TEXT NOT NULL, user_id INTEGER, defi INTEGER NOT NULL DEFAULT 1,
    dates INTEGER NOT NULL DEFAULT 1, created INTEGER NOT NULL)`);
  ready = true;
}

let keys = null;
export function vapid() {
  if (keys) return keys;
  const f = dataPath("vapid.json");
  try { keys = JSON.parse(fs.readFileSync(f, "utf8")); } catch {}
  if (!keys?.publicKey) {
    keys = webpush.generateVAPIDKeys();
    fs.writeFileSync(f, JSON.stringify(keys), { mode: 0o600 });
  }
  webpush.setVapidDetails("mailto:bonjour@fricette.ch", keys.publicKey, keys.privateKey);
  return keys;
}

export function saveSub(sub, userId, prefs = {}) {
  table();
  getDb().prepare(`INSERT INTO push_subs (endpoint, json, user_id, defi, dates, created) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET json = excluded.json, user_id = COALESCE(excluded.user_id, push_subs.user_id), defi = excluded.defi, dates = excluded.dates`)
    .run(sub.endpoint, JSON.stringify(sub), userId ?? null, prefs.defi === false ? 0 : 1, prefs.dates === false ? 0 : 1, Date.now());
}
export function removeSub(endpoint) { table(); getDb().prepare("DELETE FROM push_subs WHERE endpoint = ?").run(endpoint); }
export function subsDeleteUser(userId) { table(); getDb().prepare("DELETE FROM push_subs WHERE user_id = ?").run(userId); }
export function pushCount() { table(); return getDb().prepare("SELECT COUNT(*) AS n FROM push_subs").get().n; }

/** Envoie une notification ; supprime l'abonnement s'il n'existe plus. */
export async function send(row, payload) {
  vapid();
  try {
    await webpush.sendNotification(JSON.parse(row.json), JSON.stringify(payload), { TTL: 6 * 3600 });
    return true;
  } catch (e) {
    if (e?.statusCode === 404 || e?.statusCode === 410) removeSub(row.endpoint);
    else console.error("[push]", e?.statusCode || "", e?.message);
    return false;
  }
}

export async function pushDefi(defi) {
  table();
  let n = 0;
  for (const row of getDb().prepare("SELECT * FROM push_subs WHERE defi = 1").all()) {
    if (await send(row, { title: "🏆 Nouveau défi anti-gaspi", body: `Cette semaine : ${defi.titre}. ${defi.n} recettes pour relever le défi !`, url: "/defi" })) n++;
  }
  return n;
}

export async function pushDates() {
  table();
  let n = 0;
  const rows = getDb().prepare(`SELECT s.*, d.value AS frigo FROM push_subs s JOIN user_data d ON d.user_id = s.user_id AND d.kind = 'frigo' WHERE s.dates = 1 AND s.user_id IS NOT NULL`).all();
  for (const row of rows) {
    let frigo = [];
    try { frigo = JSON.parse(row.frigo); } catch { continue; }
    const soon = frigo.filter((it) => { const d = daysLeft(it.exp); return d != null && d >= 0 && d <= 1; }).map((it) => it.nom);
    if (!soon.length) continue;
    if (await send(row, { title: "⏰ À finir aujourd'hui ou demain", body: `${soon.slice(0, 4).join(", ")}${soon.length > 4 ? "…" : ""} : on te trouve une recette ?`, url: "/#frigo" })) n++;
  }
  return n;
}
