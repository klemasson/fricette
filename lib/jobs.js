// Tâches automatiques, lancées avec le serveur (voir instrumentation.js) :
// - chaque matin vers 8 h : rappel par e-mail des produits à finir (comptes qui l'ont demandé) ;
// - chaque lundi vers 9 h : la newsletter « 5 idées de saison » ;
// - chaque dimanche vers 4 h : la sauvegarde de la base envoyée par e-mail aux administrateurs.
import { suggest, daysLeft } from "./match";
import { carnet } from "./carnet-server";
import { daily } from "./season";
import { currentDefi } from "./defi";
import { reminderUsers, reminderSent, markReminder, kvGet, kvSet, newsletterList, backupNow } from "./db";
import { sendMail, mailEnabled, siteUrl } from "./mail";
import { getDb } from "./db";
import { isAdminEmail } from "./admin";
import fs from "node:fs";
import zlib from "node:zlib";
import { pushDefi, pushDates } from "./push";
import { welcomeContent, welcomeHtml } from "./welcome";

const zurich = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "short", hour12: false })
    .formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24, weekday: parts.weekday };
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const wrap = (inner) => `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16181d;max-width:560px">${inner}<p style="color:#6a6d74;font-size:13px;margin-top:28px">Fricette · ton frigo est plein d'idées · <a href="${siteUrl()}" style="color:#6a6d74">fricette.ch</a></p></div>`;
const recipeHtml = (r) => `<a href="${siteUrl()}/recette/${r.id}" style="display:block;text-decoration:none;color:#16181d;margin:0 0 14px">${r.photo ? `<img src="${siteUrl()}${r.photo}" width="560" style="width:100%;max-width:560px;border-radius:14px;display:block" alt="">` : ""}<strong style="display:block;font-size:17px;margin-top:6px">${esc(r.titre)}</strong><span style="color:#6a6d74;font-size:14px">${r.temps} min · ${esc(r.difficulte)}</span></a>`;

export async function runReminders(day) {
  let sent = 0;
  for (const u of reminderUsers()) {
    if (reminderSent(u.id, day)) continue;
    let frigo = [], prefs = {};
    try { frigo = JSON.parse(u.frigo); prefs = JSON.parse(u.prefs); } catch { continue; }
    const soon = frigo.filter((it) => { const d = daysLeft(it.exp); return d != null && d >= 0 && d <= 1; });
    if (!soon.length) continue;
    const found = suggest(carnet(), frigo, { personnes: prefs.personnes || 2, basiques: prefs.placard !== false, placard: prefs.placard !== false, regime: prefs.regime || "", sans: prefs.sans || [] });
    const ideas = found.results.filter((r) => r.urgent?.length).slice(0, 3);
    const list = soon.map((it) => `<li><strong>${esc(it.nom)}</strong> : ${daysLeft(it.exp) === 0 ? "aujourd'hui" : "demain"}</li>`).join("");
    const html = wrap(`<p>Bonjour,</p><p>Dans ton frigo, à finir vite :</p><ul>${list}</ul>${ideas.length ? `<p>Quelques idées pour ne rien jeter :</p>${ideas.map(recipeHtml).join("")}` : ""}<p><a href="${siteUrl()}/#frigo" style="color:#f2552c;font-weight:bold">Ouvrir mon frigo</a></p><p style="color:#6a6d74;font-size:13px">Tu reçois ce rappel parce que tu l'as activé. Pour l'arrêter : <a href="${siteUrl()}/compte" style="color:#6a6d74">Mon compte</a>.</p>`);
    try {
      await sendMail({ to: u.email, subject: `⏰ À finir : ${soon.map((it) => it.nom).join(", ")}`, html, text: `À finir : ${soon.map((it) => it.nom).join(", ")}. ${siteUrl()}/#frigo` });
      markReminder(u.id, day);
      sent++;
    } catch (e) {
      console.error("[rappels]", e?.message);
    }
  }
  return sent;
}

export async function runNewsletter(day) {
  const { today, seasonal, month } = daily(carnet(), new Date(day + "T12:00:00"));
  const five = [today, ...seasonal.filter((r) => r.photo)].filter(Boolean).slice(0, 5);
  let sent = 0;
  let defiHtml = "";
  try {
    const d = currentDefi(new Date(day + "T12:00:00"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    defiHtml = `<div style="background:#fff1c2;border-radius:14px;padding:14px 16px;margin:0 0 20px"><p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#a56700">🏆 Défi anti-gaspi de la semaine</p><p style="margin:4px 0;font-size:18px;font-weight:bold">${esc(d.titre)}</p>${d.accroche ? `<p style="margin:0 0 8px;color:#16181d">${esc(d.accroche)}</p>` : ""}<a href="${siteUrl()}/avec/${d.slug}" style="color:#f2552c;font-weight:bold">Voir les ${d.n} recettes →</a></div>`;
  } catch {}
  for (const s of newsletterList()) {
    const unsub = `${siteUrl()}/api/newsletter/desinscription?t=${s.token}`;
    const html = wrap(`<p style="font-size:22px;font-weight:bold;margin:0 0 6px">5 idées de saison</p><p style="color:#6a6d74;margin:0 0 20px">Ce qui est bon en ${month}, et ce qui traîne sûrement dans ton frigo.</p>${defiHtml}${five.map(recipeHtml).join("")}<p><a href="${siteUrl()}/#frigo" style="color:#f2552c;font-weight:bold">Voir ce que je peux cuisiner avec mon frigo →</a></p><p style="color:#6a6d74;font-size:13px">Tu reçois cet e-mail car tu t'es inscrit·e sur fricette.ch. <a href="${unsub}" style="color:#6a6d74">Se désinscrire</a></p>`);
    try {
      await sendMail({ to: s.email, subject: `5 idées de saison pour cette semaine`, html, text: five.map((r) => `${r.titre} – ${siteUrl()}/recette/${r.id}`).join("\n") + `\n\nSe désinscrire : ${unsub}`, headers: { "List-Unsubscribe": `<${unsub}>` } });
      sent++;
    } catch (e) {
      console.error("[newsletter]", e?.message);
    }
    await new Promise((r) => setTimeout(r, 400)); // doucement avec le serveur d'e-mails
  }
  return sent;
}

/** E-mail de bienvenue après la création d'un compte (texte modifiable sur /admin/emails). */
export async function sendWelcome(email) {
  if (!mailEnabled()) return;
  const { sujet, texte } = welcomeContent();
  const html = wrap(`${welcomeHtml(texte, siteUrl())}<p style="color:#6a6d74;font-size:13px;margin-top:20px">Tu reçois cet e-mail une seule fois, parce que tu viens de créer ton compte Fricette.</p>`);
  const text = texte.replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, (_, t, u) => `${t} ${siteUrl()}${u}`).replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1 $2").replace(/[#*]/g, "");
  await sendMail({ to: email, subject: sujet, html, text });
}

/** Sauvegarde hebdomadaire envoyée par e-mail aux administrateurs (copie hors du serveur). */
export async function mailBackup() {
  const to = getDb().prepare("SELECT email FROM users").all().map((x) => x.email).filter(isAdminEmail);
  if (!to.length) return 0;
  const file = backupNow("fricette-hebdo.db");
  const gz = zlib.gzipSync(fs.readFileSync(file));
  fs.rmSync(file, { force: true });
  if (gz.length > 18 * 1024 * 1024) { console.error("[sauvegarde] trop lourde pour un e-mail"); return 0; }
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" });
  await sendMail({
    to: to.join(","),
    subject: `🗄️ Sauvegarde Fricette du ${day.split("-").reverse().join(".")}`,
    text: `Bonjour,\n\nVoici la sauvegarde hebdomadaire de la base de Fricette (comptes, favoris, listes, notes, astuces, newsletter), en pièce jointe.\nGarde cet e-mail : en cas de gros problème avec l'hébergement, cette copie permet de tout restaurer.\n\nLes photos des réalisations ne sont pas incluses (elles restent sur le serveur, dans ~/fricette-data/realisations).\n\nFricette`,
    attachments: [{ filename: `fricette-${day}.db.gz`, content: gz }],
  });
  return gz.length;
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const { day, hour, weekday } = zurich();
    // Sauvegarde de la base, chaque nuit dès 3 h (et au premier démarrage du jour).
    if (hour >= 3 && kvGet("sauvegarde") !== day) {
      kvSet("sauvegarde", day);
      try { console.log(`[sauvegarde] ${backupNow()}`); } catch (e) { console.error("[sauvegarde]", e?.message); }
    }
    // Notifications sur le téléphone (ne dépendent pas des e-mails)
    if (hour >= 8 && kvGet("push-dates") !== day) {
      kvSet("push-dates", day);
      try { const n = await pushDates(); if (n) console.log(`[push] ${n} rappel(s) de dates`); } catch (e) { console.error("[push dates]", e?.message); }
    }
    if (weekday === "Mon" && hour >= 9 && kvGet("push-defi") !== day) {
      kvSet("push-defi", day);
      try { const n = await pushDefi(currentDefi()); console.log(`[push] défi envoyé à ${n} appareil(s)`); } catch (e) { console.error("[push défi]", e?.message); }
    }
    if (!mailEnabled()) return;
    if (weekday === "Sun" && hour >= 4 && kvGet("sauvegarde-mail") !== day) {
      kvSet("sauvegarde-mail", day);
      try { const n = await mailBackup(); if (n) console.log(`[sauvegarde] envoyée par e-mail (${Math.round(n / 1024)} Ko)`); } catch (e) { console.error("[sauvegarde e-mail]", e?.message); }
    }
    if (hour >= 8 && kvGet("rappels") !== day) {
      kvSet("rappels", day);
      const n = await runReminders(day);
      if (n) console.log(`[rappels] ${n} e-mail(s) envoyé(s)`);
    }
    if (weekday === "Mon" && hour >= 9 && kvGet("newsletter") !== day) {
      kvSet("newsletter", day);
      const n = await runNewsletter(day);
      console.log(`[newsletter] ${n} e-mail(s) envoyé(s)`);
    }
  } catch (e) {
    console.error("[tâches]", e?.message);
  } finally {
    running = false;
  }
}

export function startJobs() {
  if (globalThis.__frcJobs) return;
  globalThis.__frcJobs = setInterval(tick, 10 * 60 * 1000);
  setTimeout(tick, 60 * 1000);
}
