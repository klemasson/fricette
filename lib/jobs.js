// Tâches automatiques, lancées avec le serveur (voir instrumentation.js) :
// - chaque matin vers 8 h : rappel par e-mail des produits à finir (comptes qui l'ont demandé) ;
// - chaque lundi vers 9 h : la newsletter « 5 idées de saison ».
import { suggest, daysLeft } from "./match";
import { carnet } from "./carnet-server";
import { daily } from "./season";
import { reminderUsers, reminderSent, markReminder, kvGet, kvSet, newsletterList } from "./db";
import { sendMail, mailEnabled, siteUrl } from "./mail";

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
  for (const s of newsletterList()) {
    const unsub = `${siteUrl()}/api/newsletter/desinscription?t=${s.token}`;
    const html = wrap(`<p style="font-size:22px;font-weight:bold;margin:0 0 6px">5 idées de saison</p><p style="color:#6a6d74;margin:0 0 20px">Ce qui est bon en ${month}, et ce qui traîne sûrement dans ton frigo.</p>${five.map(recipeHtml).join("")}<p><a href="${siteUrl()}/#frigo" style="color:#f2552c;font-weight:bold">Voir ce que je peux cuisiner avec mon frigo →</a></p><p style="color:#6a6d74;font-size:13px">Tu reçois cet e-mail car tu t'es inscrit·e sur fricette.ch. <a href="${unsub}" style="color:#6a6d74">Se désinscrire</a></p>`);
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

let running = false;
async function tick() {
  if (running || !mailEnabled()) return;
  running = true;
  try {
    const { day, hour, weekday } = zurich();
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
