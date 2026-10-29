// Envoi d'e-mails via la boîte Infomaniak de Fricette (SMTP).
// Le mot de passe de bonjour@fricette.ch est lu, à chaque envoi, dans l'un de ces endroits :
//   1. le fichier ~/fricette-data/smtp-password (méthode recommandée, voir le guide)
//   2. la variable SMTP_PASSWORD_B64 (base64) ou SMTP_PASSWORD dans .env.local
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import nodemailer from "nodemailer";

const USER = process.env.SMTP_USER || "bonjour@fricette.ch";

function passwordFiles() {
  const dirs = [process.env.DATA_DIR, path.join(os.homedir() || "", "fricette-data"), path.join(process.cwd(), ".data")].filter(Boolean);
  return dirs.map((d) => path.join(d, "smtp-password"));
}

function smtpPassword() {
  for (const f of passwordFiles()) {
    try {
      const p = fs.readFileSync(f, "utf8").replace(/\r?\n$/, "");
      if (p) return p;
    } catch {}
  }
  if (process.env.SMTP_PASSWORD_B64) return Buffer.from(process.env.SMTP_PASSWORD_B64, "base64").toString("utf8");
  return process.env.SMTP_PASSWORD || "";
}

/** Diagnostic (sans le mot de passe) : où le site cherche, et ce qu'il trouve. */
export function mailDiagnostic() {
  return {
    home: os.homedir(),
    cwd: process.cwd(),
    files: passwordFiles().map((f) => ({ path: f, exists: fs.existsSync(f) })),
    env: !!(process.env.SMTP_PASSWORD_B64 || process.env.SMTP_PASSWORD),
  };
}

export function mailEnabled() {
  return !!smtpPassword();
}

let transport = null;
let transportPass = null;
function getTransport() {
  const pass = smtpPassword();
  if (!transport || pass !== transportPass) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.infomaniak.com",
      port,
      secure: port === 465,
      auth: { user: USER, pass },
    });
    transportPass = pass;
  }
  return transport;
}

export async function sendMail({ to, subject, text, html, headers }) {
  if (!mailEnabled()) throw new Error("Envoi d'e-mails non configuré (mot de passe SMTP introuvable)");
  await getTransport().sendMail({ from: `Fricette <${USER}>`, to, subject, text, html, headers });
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://fricette.ch").replace(/\/$/, "");
}
