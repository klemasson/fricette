// Fruits et légumes de saison en Suisse, mois par mois (clés du vocabulaire).
const HIVER = ["chou", "poireau", "endive", "carotte", "navet", "celeri", "betterave", "courge", "chou_bruxelles", "pomme", "poire", "orange", "kiwi", "pomme_de_terre"];
export const SEASON = {
  1: HIVER, 2: HIVER,
  3: ["poireau", "endive", "carotte", "epinard", "radis", "chou", "pomme", "celeri", "betterave", "oignon_nouveau"],
  4: ["asperge", "radis", "epinard", "oignon_nouveau", "salade", "carotte", "poireau", "petit_pois"],
  5: ["asperge", "radis", "epinard", "petit_pois", "fraise", "oignon_nouveau", "salade", "courgette"],
  6: ["fraise", "courgette", "petit_pois", "concombre", "haricot_vert", "abricot", "cerise", "salade", "tomate_cerise", "fruits_rouges"],
  7: ["tomate", "tomate_cerise", "courgette", "aubergine", "poivron", "concombre", "haricot_vert", "peche", "abricot", "fruits_rouges", "mais"],
  8: ["tomate", "tomate_cerise", "courgette", "aubergine", "poivron", "concombre", "haricot_vert", "peche", "prune", "fruits_rouges", "mais"],
  9: ["tomate", "aubergine", "poivron", "courgette", "prune", "figue", "pomme", "poire", "champignon", "courge", "mais", "haricot_vert"],
  10: ["courge", "champignon", "pomme", "poire", "chou", "poireau", "patate_douce", "betterave", "chou_fleur", "brocoli", "celeri", "fenouil", "prune"],
  11: ["courge", "champignon", "poireau", "chou", "chou_fleur", "chou_bruxelles", "endive", "pomme", "poire", "celeri", "navet", "carotte", "brocoli"],
  12: ["courge", "poireau", "chou", "chou_bruxelles", "endive", "pomme", "poire", "orange", "kiwi", "celeri", "carotte", "navet"],
};
export const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** La recette du jour et quelques idées de saison, toujours les mêmes pour une date donnée. */
export function daily(carnet, date = new Date()) {
  const month = date.getMonth() + 1;
  const keys = new Set(SEASON[month]);
  const day = date.toISOString().slice(0, 10);
  const seasonal = carnet.filter((r) => r.ingredients.some((g) => keys.has(g.cle) && !g.optionnel));
  const plats = seasonal.filter((r) => r.categorie === "plat" && r.photo);
  const pool = plats.length ? plats : carnet;
  const today = pool[hash(day) % pool.length];
  const shuffled = seasonal
    .filter((r) => r.id !== today?.id)
    .map((r) => [hash(day + r.id), r])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
  return { today, seasonal: shuffled, month: MONTHS[month - 1] };
}
