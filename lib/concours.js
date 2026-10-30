// Concours photo du mois : toutes les photos publiées pendant le mois participent ;
// l'équipe choisit la gagnante au début du mois suivant.
import { kvGet, kvSet, photosBetween, photoGet } from "./db";

export const DEFAULT_LOT = "un petit panier de produits locaux du Valais";
const tz = "Europe/Zurich";

export function monthKey(d = new Date()) {
  return d.toLocaleDateString("sv-SE", { timeZone: tz }).slice(0, 7);
}
export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("fr-CH", { month: "long", year: "numeric", timeZone: "UTC" });
}
export function prevMonth(key, n = 1) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - n, 15));
  return d.toISOString().slice(0, 7);
}
function bounds(key) {
  const [y, m] = key.split("-").map(Number);
  // Bornes approximatives en heure suisse (UTC+1/+2) : on prend minuit UTC-2 h pour ne rater aucune photo du 1er.
  return [Date.UTC(y, m - 1, 1) - 2 * 3600000, Date.UTC(y, m, 1) - 2 * 3600000];
}

export function entries(key) {
  const [a, b] = bounds(key);
  return photosBetween(a, b);
}
/** Le concours est éteint par défaut : l'administrateur l'allume depuis /admin/photos. */
export function actif() {
  return kvGet("concours:actif") === "1";
}
export function setActif(on) {
  kvSet("concours:actif", on ? "1" : "0");
}
export function lot() {
  return kvGet("concours:lot") || DEFAULT_LOT;
}
export function setLot(text) {
  kvSet("concours:lot", text || "");
}
export function winner(key) {
  const id = kvGet("concours:" + key);
  if (!id) return null;
  const p = photoGet(id);
  return p && p.status === "ok" ? { ...p } : null;
}
export function setWinner(key, photoId) {
  kvSet("concours:" + key, photoId || "");
}
/** Gagnants des derniers mois (du plus récent au plus ancien). */
export function pastWinners(n = 12) {
  const out = [];
  const now = monthKey();
  for (let i = 1; i <= n; i++) {
    const k = prevMonth(now, i);
    const w = winner(k);
    if (w) out.push({ mois: k, ...w });
  }
  return out;
}
