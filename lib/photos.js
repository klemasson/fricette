// Photos des réalisations : enregistrement des fichiers et petites vérifications.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataPath, getDb, photosOfUser, photoDelete, kvGet, kvSet } from "./db";
import { isAdminEmail } from "./admin";
import { sendMail, mailEnabled, siteUrl } from "./mail";

export const MAX_BYTES = 3 * 1024 * 1024;

function dir() {
  const d = dataPath("realisations");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Reconnaît le format à partir des premiers octets (on ne fait pas confiance au nom du fichier). */
export function sniff(buf) {
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.toString("hex", 0, 8) === "89504e470d0a1a0a") return "png";
  return null;
}
export const MIME = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

export function newPhotoId() {
  return crypto.randomBytes(9).toString("base64url");
}

export function savePhotoFile(id, ext, buf) {
  fs.writeFileSync(path.join(/* turbopackIgnore: true */ dir(), `${id}.${ext}`), buf);
}

export function readPhotoFile(id) {
  if (!/^[\w-]{8,20}$/.test(id)) return null;
  for (const ext of ["webp", "jpg", "png"]) {
    const f = path.join(/* turbopackIgnore: true */ dir(), `${id}.${ext}`);
    if (fs.existsSync(f)) return { buf: fs.readFileSync(f), type: MIME[ext] };
  }
  return null;
}

export function removePhoto(id) {
  photoDelete(id);
  for (const ext of ["webp", "jpg", "png"]) {
    try { fs.rmSync(path.join(/* turbopackIgnore: true */ dir(), `${id}.${ext}`), { force: true }); } catch {}
  }
}

export function deleteUserPhotos(userId) {
  for (const id of photosOfUser(userId)) removePhoto(id);
}

/** Prévient les administrateurs qu'une photo attend (au plus un e-mail par heure). */
export async function notifyAdmins(recipeTitle) {
  try {
    if (!mailEnabled()) return;
    const last = Number(kvGet("photos:notified") || 0);
    if (Date.now() - last < 3600000) return;
    const to = getDb().prepare("SELECT email FROM users").all().map((u) => u.email).filter(isAdminEmail);
    if (!to.length) return;
    kvSet("photos:notified", Date.now());
    await sendMail({
      to: to.join(","),
      subject: "📸 Nouvelle photo à valider sur Fricette",
      text: `Quelqu'un a partagé une photo de « ${recipeTitle} ».\n\nPour la valider ou la supprimer : ${siteUrl()}/admin/photos\n`,
    });
  } catch (e) {
    console.error("[photos] e-mail aux administrateurs :", e.message);
  }
}
