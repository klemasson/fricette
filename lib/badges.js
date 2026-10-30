// Badges anti-gaspi, calculés à partir de l'historique « Je l'ai cuisinée » (et de quelques réglages).
// Tout est calculé dans le navigateur : rien de plus n'est enregistré.

const weekOf = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d.toISOString().slice(0, 10);
};
const withIng = (list, ...keys) => list.filter((x) => (x.k || []).some((k) => keys.includes(k))).length;
const kg = (list) => list.reduce((s, x) => s + (x.g || 0), 0) / 1000;
const chf = (list) => list.reduce((s, x) => s + (x.chf ?? ((x.g || 0) / 1000) * 8), 0);
function bestWeek(list) {
  const m = {};
  for (const x of list) if (x.date) m[weekOf(x.date)] = (m[weekOf(x.date)] || 0) + 1;
  return Math.max(0, ...Object.values(m));
}
function weeksInRow(list) {
  const weeks = [...new Set(list.filter((x) => x.date).map((x) => weekOf(x.date)))].sort();
  let best = 0, cur = 0, prev = null;
  for (const w of weeks) {
    cur = prev && (new Date(w) - new Date(prev)) / 86400000 === 7 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = w;
  }
  return best;
}

// [id, emoji, nom, comment l'obtenir, valeur actuelle (list, extra), objectif]
export const BADGES = [
  ["premier", "🍳", "Premier plat", "Cuisiner une première recette", (l) => l.length, 1],
  ["cinq", "🥄", "Ça mijote", "Cuisiner 5 recettes", (l) => l.length, 5],
  ["dix", "👩‍🍳", "Cuistot anti-gaspi", "Cuisiner 10 recettes", (l) => l.length, 10],
  ["vingtcinq", "🔪", "Chef de la maison", "Cuisiner 25 recettes", (l) => l.length, 25],
  ["cinquante", "👑", "Légende du frigo", "Cuisiner 50 recettes", (l) => l.length, 50],
  ["kg1", "🌱", "Premier kilo", "Sauver 1 kg d'aliments", (l) => kg(l), 1],
  ["kg5", "🌿", "5 kilos sauvés", "Sauver 5 kg d'aliments", (l) => kg(l), 5],
  ["kg20", "🌳", "Forêt anti-gaspi", "Sauver 20 kg d'aliments", (l) => kg(l), 20],
  ["chf50", "💰", "50 francs", "Économiser environ 50 CHF", (l) => chf(l), 50],
  ["chf200", "🏦", "Tirelire pleine", "Économiser environ 200 CHF", (l) => chf(l), 200],
  ["pain", "🥖", "Sauveur de pain", "Cuisiner 3 recettes avec du pain", (l) => withIng(l, "pain", "pain_mie"), 3],
  ["banane", "🍌", "Ami des bananes", "Cuisiner 2 recettes avec des bananes", (l) => withIng(l, "banane"), 2],
  ["riz", "🍚", "Riz d'hier", "Cuisiner 3 recettes avec du riz", (l) => withIng(l, "riz", "riz_risotto"), 3],
  ["legumes", "🥕", "Fan de légumes", "Cuisiner 10 recettes avec carottes, courgettes, poireaux ou choux", (l) => withIng(l, "carotte", "courgette", "poireau", "chou", "chou_fleur", "brocoli", "epinard"), 10],
  ["semaine", "🔥", "Semaine à fond", "Cuisiner 5 recettes dans la même semaine", (l) => bestWeek(l), 5],
  ["regulier", "📅", "Fidèle au poste", "Cuisiner au moins une recette 4 semaines d'affilée", (l) => weeksInRow(l), 4],
  ["defi", "🏆", "Défi relevé", "Cuisiner une recette du défi de la semaine", (l) => l.filter((x) => x.defi).length, 1],
  ["defi5", "🥇", "Pro des défis", "Relever 5 défis de la semaine", (l) => new Set(l.filter((x) => x.defi).map((x) => x.defi)).size, 5],
  ["photo", "📸", "Photographe", "Partager la photo d'un plat", (l, e) => (e.photo ? 1 : 0), 1],
];

/** Liste des badges avec leur état : { id, emoji, nom, comment, ok, progres (0-1), valeur, objectif } */
export function badges(list = [], extra = {}) {
  return BADGES.map(([id, emoji, nom, comment, f, goal]) => {
    const v = f(list, extra);
    return { id, emoji, nom, comment, ok: v >= goal, progres: Math.min(1, v / goal), valeur: v, objectif: goal };
  });
}

/** Badges débloqués entre deux états de l'historique. */
export function newBadges(before, after, extra = {}) {
  const was = new Set(badges(before, extra).filter((b) => b.ok).map((b) => b.id));
  return badges(after, extra).filter((b) => b.ok && !was.has(b.id));
}
