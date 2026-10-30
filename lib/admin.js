// Comptes administrateurs.
// - Le compte du fondateur est reconnu d'office (son adresse n'apparaît pas en clair dans le code :
//   on compare seulement son empreinte SHA-256).
// - D'autres adresses peuvent être ajoutées dans le fichier ~/fricette-data/admins (une par ligne)
//   ou dans la variable d'environnement ADMIN_EMAILS (séparées par des virgules).
import fs from "node:fs";
import crypto from "node:crypto";
import { currentUser } from "./auth";
import { dataPath } from "./db";

const OWNER_HASHES = ["57ceac6171d4d48de60bcb7235ecdc864809025b56ebda0c98a58c291824374a"];
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

export function admins() {
  let list = [];
  try { list = fs.readFileSync(dataPath("admins"), "utf8").split(/[\s,]+/); } catch {}
  list = list.concat(String(process.env.ADMIN_EMAILS || "").split(/[\s,]+/));
  return list.map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return !!e && (OWNER_HASHES.includes(sha(e)) || admins().includes(e));
}

export async function currentAdmin() {
  const user = await currentUser();
  return user && isAdminEmail(user.email) ? user : null;
}
