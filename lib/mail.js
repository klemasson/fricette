// Envoi d'e-mails via la boîte Infomaniak de Fricette (SMTP).
// Seul le mot de passe est à fournir, dans .env.local sur l'hébergement :
//   SMTP_PASSWORD_B64=…   (mot de passe encodé en base64, voir le guide)
// ou SMTP_PASSWORD=…      (si le mot de passe ne contient ni $ ni # ni guillemets)
import nodemailer from "nodemailer";

const USER = process.env.SMTP_USER || "bonjour@fricette.ch";
const PASS = process.env.SMTP_PASSWORD_B64
  ? Buffer.from(process.env.SMTP_PASSWORD_B64, "base64").toString("utf8")
  : process.env.SMTP_PASSWORD || "";

export const MAIL_ENABLED = !!PASS;

let transport = null;
function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.infomaniak.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: USER, pass: PASS },
    });
  }
  return transport;
}

export async function sendMail({ to, subject, text, html }) {
  if (!MAIL_ENABLED) throw new Error("Envoi d'e-mails non configuré (SMTP_PASSWORD manquant)");
  await getTransport().sendMail({ from: `Fricette <${USER}>`, to, subject, text, html });
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://fricette.ch").replace(/\/$/, "");
}
