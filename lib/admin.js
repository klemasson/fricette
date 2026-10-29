// Comptes administrateurs : adresses listées dans le fichier ~/fricette-data/admins.
import fs from "node:fs";
import { currentUser } from "./auth";
import { dataPath } from "./db";

export function admins() {
  try {
    return fs.readFileSync(dataPath("admins"), "utf8").split(/\s+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function currentAdmin() {
  const user = await currentUser();
  return user && admins().includes(user.email.toLowerCase()) ? user : null;
}
