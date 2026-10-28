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
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipe_id TEXT NOT NULL,
      created INTEGER NOT NULL,
      PRIMARY KEY (user_id, recipe_id)
    );
  `);
  globalThis.__fricetteDb = db;
  return db;
}

export function findUserByEmail(email) {
  return getDb().prepare("SELECT id, email, pass FROM users WHERE email = ?").get(email) || null;
}

export function findUserById(id) {
  return getDb().prepare("SELECT id, email FROM users WHERE id = ?").get(id) || null;
}

export function createUser(email, pass) {
  const r = getDb().prepare("INSERT INTO users (email, pass, created) VALUES (?, ?, ?)").run(email, pass, Date.now());
  return Number(r.lastInsertRowid);
}

export function deleteUser(id) {
  const d = getDb();
  d.prepare("DELETE FROM favorites WHERE user_id = ?").run(id);
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
