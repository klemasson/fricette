// Pages thématiques (/idees/...) : des sélections de recettes qui répondent à des recherches fréquentes.
import { BASICS } from "./vocab";

const PLACARD = new Set(["oignon", "echalote", "ail", "herbes_provence", "cumin", "curry", "paprika", "muscade", "cannelle", "piment_poudre", "curcuma", "bouillon", "moutarde", "concentre_tomate", "sauce_soja", "miel", "vanille", "levure", "chapelure", "cacao", "eau", ...BASICS]);
const CHER = new Set(["boeuf", "agneau", "canard", "veau", "saumon", "saumon_fume", "crevette", "poisson_blanc", "thon_frais", "pignon", "noix_cajou", "parmesan", "mascarpone", "chevre", "vin_blanc", "vin_rouge", "fruits_rouges", "avocat", "asperge"]);
const main = (r) => r.ingredients.filter((g) => !g.optionnel && !PLACARD.has(g.cle));
const has = (r, ...keys) => r.ingredients.some((g) => !g.optionnel && keys.includes(g.cle));
const cat = (r, ...c) => c.includes(r.categorie);
const four = (r) => r.etapes.some((e) => /\bfour\b/i.test(e));

export const COLLECTIONS = [
  { slug: "recettes-15-minutes", titre: "Recettes en 15 minutes", h1: "Prêt en 15 minutes", intro: "Pour les soirs où on a faim tout de suite : des recettes prêtes en un quart d'heure, avec ce qu'il y a dans le frigo.", test: (r) => r.temps <= 15 },
  { slug: "repas-rapides-30-minutes", titre: "Repas rapides en 30 minutes", h1: "Repas en 30 minutes maximum", intro: "De vrais plats, prêts en une demi-heure ou moins. Idéal pour la semaine.", test: (r) => r.temps <= 30 && cat(r, "plat") },
  { slug: "recettes-faciles-du-soir", titre: "Recettes faciles pour le soir", h1: "Faciles, pour ce soir", intro: "Des plats simples, sans technique compliquée, pour cuisiner sans réfléchir après une longue journée.", test: (r) => r.difficulte === "facile" && r.temps <= 40 && cat(r, "plat") },
  { slug: "recettes-3-ingredients", titre: "Recettes avec 3 ingrédients", h1: "3 ingrédients, pas plus", intro: "Peu de courses, peu de vaisselle : ces recettes demandent 3 ingrédients au plus, sans compter le placard (sel, huile, épices, oignon, ail…).", test: (r) => main(r).length <= 3 && main(r).length >= 1 },
  { slug: "recettes-petit-budget", titre: "Recettes petit budget", h1: "Petit budget, grand plat", intro: "Des plats économiques, à base d'ingrédients simples et bon marché : légumes, œufs, légumineuses, pâtes, riz…", test: (r) => cat(r, "plat", "soupe") && !r.ingredients.some((g) => CHER.has(g.cle)) && main(r).length <= 6 },
  { slug: "recettes-au-four", titre: "Recettes au four", h1: "Au four", intro: "Gratins, rôtis, plaques et tartes : on prépare, on enfourne, et le four fait le reste.", test: (r) => four(r) && cat(r, "plat", "accompagnement") },
  { slug: "recettes-vegetariennes", titre: "Recettes végétariennes", h1: "Végétarien", intro: "Sans viande ni poisson, et pleines de saveurs : des recettes végétariennes pour finir légumes, œufs et fromages.", test: (r) => r.regimes.includes("vegetarien") && cat(r, "plat", "soupe", "salade") },
  { slug: "recettes-vegan", titre: "Recettes vegan", h1: "Vegan", intro: "Sans aucun produit animal : des recettes 100 % végétales et anti-gaspi.", test: (r) => r.regimes.includes("vegan") },
  { slug: "recettes-sans-gluten", titre: "Recettes sans gluten", h1: "Sans gluten", intro: "Des recettes naturellement sans gluten. Vérifie toujours les étiquettes des produits utilisés.", test: (r) => r.regimes.includes("sans_gluten") && cat(r, "plat", "soupe", "salade", "dessert") },
  { slug: "recettes-sans-lactose", titre: "Recettes sans lactose", h1: "Sans lactose", intro: "Sans lait, crème ni fromage : des idées pour cuisiner sans lactose. Vérifie toujours les étiquettes.", test: (r) => r.regimes.includes("sans_lactose") && cat(r, "plat", "soupe", "salade", "dessert") },
  { slug: "que-faire-avec-des-restes-de-pates", titre: "Que faire avec des restes de pâtes ?", h1: "Restes de pâtes", intro: "Des pâtes en trop ? Gratins, frittatas, salades : elles reprennent vie en un rien de temps.", test: (r) => has(r, "pates", "pates_lasagne", "gnocchi") },
  { slug: "que-faire-avec-des-restes-de-riz", titre: "Que faire avec des restes de riz ?", h1: "Restes de riz", intro: "Le riz de la veille est parfait pour le riz sauté, les galettes ou les soupes.", test: (r) => has(r, "riz", "riz_risotto") },
  { slug: "que-faire-avec-du-pain-rassis", titre: "Que faire avec du pain rassis ?", h1: "Pain rassis", intro: "Pain perdu, croûtons, panzanella, croques : le pain dur est un ingrédient, pas un déchet.", test: (r) => has(r, "pain", "pain_mie", "chapelure") },
  { slug: "que-faire-avec-des-restes-de-poulet", titre: "Que faire avec des restes de poulet ?", h1: "Restes de poulet", intro: "Un reste de poulet rôti ? Salades, wraps, currys et soupes, il y a de quoi faire.", test: (r) => has(r, "poulet") },
  { slug: "que-faire-avec-des-restes-de-raclette", titre: "Que faire avec des restes de raclette ?", h1: "Restes de raclette", intro: "Fromage et pommes de terre en trop après la raclette ? Voici de quoi les finir avec gourmandise.", test: (r) => has(r, "raclette") || (has(r, "pomme_de_terre") && has(r, "gruyere", "fromage_rape") && cat(r, "plat")) },
  { slug: "soupes-anti-gaspi", titre: "Soupes anti-gaspi", h1: "Soupes", intro: "La soupe, championne du anti-gaspi : tous les légumes un peu fatigués y trouvent leur place.", test: (r) => cat(r, "soupe") },
  { slug: "salades-composees", titre: "Salades composées", h1: "Salades", intro: "Des salades complètes, pour un repas léger ou un lunch à emporter.", test: (r) => cat(r, "salade") },
  { slug: "desserts-anti-gaspi", titre: "Desserts anti-gaspi", h1: "Desserts et goûters", intro: "Fruits trop mûrs, pain sec, fond de lait ou de yaourt : ils font les meilleurs desserts.", test: (r) => cat(r, "dessert", "gouter") },
  { slug: "petit-dejeuner", titre: "Idées de petit-déjeuner", h1: "Petit-déjeuner et brunch", intro: "Pour bien commencer la journée avec ce qu'il y a dans la cuisine.", test: (r) => cat(r, "petit-dejeuner") },
  { slug: "aperitif", titre: "Idées pour l'apéro", h1: "Apéro", intro: "Des bouchées et tartinades vite faites avec les restes du frigo.", test: (r) => cat(r, "apero") },
];
