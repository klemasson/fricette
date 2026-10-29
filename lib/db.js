// Base de données des comptes et des favoris : un simple fichier SQLite sur l'hébergement,
// avec le module SQLite intégré à Node.js (aucun service extérieur, aucune installation).
// Le fichier est rangé HORS du dossier du site (par défaut ~/fricette-data/fricette.db),
// pour qu'il survive aux mises à jour du code.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function dataDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(os.homedir() || path.resolve(process.cwd(), ".."), "fricette-data");
}

let db = globalThis.__fricetteDb;
let usedDir = globalThis.__fricetteDir || null;

/** Chemin d'un fichier dans le dossier de données (à côté de la base). */
export function dataPath(name) {
  if (!usedDir) getDb();
  return path.join(usedDir, name);
}

export function getDb() {
  if (db) return db;
  let dir = dataDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch {
    // Dossier personnel inaccessible : on se replie sur un dossier caché à côté du site.
    dir = path.join(process.cwd(), ".data");
    fs.mkdirSync(dir, { recursive: true });
  }
  usedDir = globalThis.__fricetteDir = dir;
  console.log(`[db] base de données : ${path.join(dir, "fricette.db")}`);
  db = new DatabaseSync(path.join(dir, "fricette.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      pass TEXT NOT NULL,
      created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resets (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipe_id TEXT NOT NULL,
      created INTEGER NOT NULL,
      PRIMARY KEY (user_id, recipe_id)
    );
    -- Liste de courses et frigo d'un compte (texte JSON), pour les retrouver sur tous ses appareils.
    CREATE TABLE IF NOT EXISTS user_data (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      updated INTEGER NOT NULL,
      PRIMARY KEY (user_id, kind)
    );
    -- Notes « je l'ai faite » : un votant = un compte (u:12) ou un visiteur anonyme (v:…).
    CREATE TABLE IF NOT EXISTS ratings (
      voter TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      stars INTEGER NOT NULL,
      created INTEGER NOT NULL,
      PRIMARY KEY (voter, recipe_id)
    );
    -- Statistiques de visite anonymes : aucun cookie, aucune adresse IP enregistrée.
    CREATE TABLE IF NOT EXISTS visits (day TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (day, hash));
    CREATE TABLE IF NOT EXISTS events (
      day TEXT NOT NULL, kind TEXT NOT NULL, value TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, kind, value)
    );
  `);
  // Version de session : augmente à chaque changement de mot de passe, ce qui déconnecte les autres appareils.
  const cols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!cols.includes("session_version")) db.exec("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0");
  globalThis.__fricetteDb = db;
  return db;
}

export function findUserByEmail(email) {
  return getDb().prepare("SELECT id, email, pass, session_version FROM users WHERE email = ?").get(email) || null;
}

export function findUserById(id) {
  return getDb().prepare("SELECT id, email, session_version FROM users WHERE id = ?").get(id) || null;
}

export function createUser(email, pass) {
  const r = getDb().prepare("INSERT INTO users (email, pass, created) VALUES (?, ?, ?)").run(email, pass, Date.now());
  return Number(r.lastInsertRowid);
}

export function deleteUser(id) {
  const d = getDb();
  d.prepare("DELETE FROM favorites WHERE user_id = ?").run(id);
  d.prepare("DELETE FROM user_data WHERE user_id = ?").run(id);
  d.prepare("DELETE FROM ratings WHERE voter = ?").run("u:" + id);
  d.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function listFavorites(userId) {
  return getDb()
    .prepare("SELECT recipe_id FROM favorites WHERE user_id = ? ORDER BY created DESC")
    .all(userId)
    .map((r) => r.recipe_id);
}

export function setFavorite(userId, recipeId, on) {
  const d = getDb();
  if (on) d.prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id, created) VALUES (?, ?, ?)").run(userId, recipeId, Date.now());
  else d.prepare("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?").run(userId, recipeId);
}

// --- Mot de passe oublié : jetons à usage unique, valables 1 heure (on ne garde que leur empreinte) ---
export function createReset(userId, tokenHash) {
  const d = getDb();
  d.prepare("DELETE FROM resets WHERE user_id = ? OR expires < ?").run(userId, Date.now());
  d.prepare("INSERT INTO resets (token_hash, user_id, expires) VALUES (?, ?, ?)").run(tokenHash, userId, Date.now() + 60 * 60 * 1000);
}

export function useReset(tokenHash) {
  const d = getDb();
  const row = d.prepare("SELECT user_id, expires FROM resets WHERE token_hash = ?").get(tokenHash);
  if (!row) return null;
  d.prepare("DELETE FROM resets WHERE token_hash = ?").run(tokenHash);
  return row.expires > Date.now() ? row.user_id : null;
}

export function updatePassword(userId, pass) {
  const d = getDb();
  d.prepare("UPDATE users SET pass = ?, session_version = session_version + 1 WHERE id = ?").run(pass, userId);
  d.prepare("DELETE FROM resets WHERE user_id = ?").run(userId);
}

// --- Données d'un compte : liste de courses, frigo ---
export function getUserData(userId) {
  const out = {};
  for (const r of getDb().prepare("SELECT kind, value FROM user_data WHERE user_id = ?").all(userId)) {
    try { out[r.kind] = JSON.parse(r.value); } catch {}
  }
  return out;
}

export function setUserData(userId, kind, value) {
  getDb()
    .prepare("INSERT INTO user_data (user_id, kind, value, updated) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, kind) DO UPDATE SET value = excluded.value, updated = excluded.updated")
    .run(userId, kind, JSON.stringify(value), Date.now());
}

// --- Notes ---
export function rate(voter, recipeId, stars) {
  const d = getDb();
  if (!stars) d.prepare("DELETE FROM ratings WHERE voter = ? AND recipe_id = ?").run(voter, recipeId);
  else d.prepare("INSERT INTO ratings (voter, recipe_id, stars, created) VALUES (?, ?, ?, ?) ON CONFLICT(voter, recipe_id) DO UPDATE SET stars = excluded.stars, created = excluded.created")
    .run(voter, recipeId, stars, Date.now());
}

/** { idRecette: [moyenne, nombre] } */
export function ratingSummary() {
  const out = {};
  for (const r of getDb().prepare("SELECT recipe_id, AVG(stars) AS a, COUNT(*) AS n FROM ratings GROUP BY recipe_id").all()) {
    out[r.recipe_id] = [Math.round(r.a * 10) / 10, r.n];
  }
  return out;
}

export function myRatings(voters) {
  const out = {};
  const st = getDb().prepare("SELECT recipe_id, stars FROM ratings WHERE voter = ?");
  for (const v of voters) for (const r of st.all(v)) out[r.recipe_id] = r.stars;
  return out;
}

// --- Statistiques ---
export function recordVisit(day, hash) {
  getDb().prepare("INSERT OR IGNORE INTO visits (day, hash) VALUES (?, ?)").run(day, hash);
}

export function recordEvent(day, kind, value) {
  getDb()
    .prepare("INSERT INTO events (day, kind, value, n) VALUES (?, ?, ?, 1) ON CONFLICT(day, kind, value) DO UPDATE SET n = n + 1")
    .run(day, kind, value);
}

export function statsSince(day) {
  const d = getDb();
  return {
    visitors: d.prepare("SELECT day, COUNT(*) AS n FROM visits WHERE day >= ? GROUP BY day ORDER BY day").all(day),
    top: (kind, limit = 20) =>
      d.prepare("SELECT value, SUM(n) AS n FROM events WHERE day >= ? AND kind = ? GROUP BY value ORDER BY n DESC LIMIT ?").all(day, kind, limit),
    users: d.prepare("SELECT COUNT(*) AS n FROM users").get().n,
    newUsers: d.prepare("SELECT COUNT(*) AS n FROM users WHERE created >= ?").get(Date.parse(day)).n,
    topFavs: d.prepare("SELECT recipe_id AS value, COUNT(*) AS n FROM favorites GROUP BY recipe_id ORDER BY n DESC LIMIT 15").all(),
    topRated: d.prepare("SELECT recipe_id AS value, ROUND(AVG(stars), 1) AS a, COUNT(*) AS n FROM ratings GROUP BY recipe_id ORDER BY n DESC, a DESC LIMIT 15").all(),
    lowRated: d.prepare("SELECT recipe_id AS value, ROUND(AVG(stars), 1) AS a, COUNT(*) AS n FROM ratings GROUP BY recipe_id HAVING a <= 2.5 ORDER BY a, n DESC LIMIT 15").all(),
  };
}

export function updateEmail(userId, email) {
  getDb().prepare("UPDATE users SET email = ? WHERE id = ?").run(email, userId);
}

export function userCreated(userId) {
  return getDb().prepare("SELECT created FROM users WHERE id = ?").get(userId)?.created || null;
}
