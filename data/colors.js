// Chaque ingrédient prend la couleur de son aliment (piste visuelle « Marché pop »).
// Familles : rouge, vert, jaune, orange, blanc (laitiers), rose (viandes), bleu (poissons), beige (féculents), violet, gris.

const FAMILIES = {
  rouge: ["tomate", "tomate_cerise", "tomate_concassee", "concentre_tomate", "poivron", "fraise", "fruits_rouges", "cerise", "radis", "piment", "piment_poudre", "chorizo", "paprika", "ketchup", "pomme", "framboise", "betterave", "vin_rouge", "haricot_rouge", "lentille_corail"],
  vert: ["courgette", "epinard", "salade", "concombre", "brocoli", "haricot_vert", "petit_pois", "poireau", "celeri", "chou", "chou_bruxelles", "avocat", "olive", "cornichon", "capre", "asperge", "artichaut", "kiwi", "citron_vert", "persil", "ciboulette", "basilic", "coriandre", "menthe", "aneth", "herbes", "herbes_provence", "pesto", "oignon_nouveau", "fenouil", "endive", "pois_chiche", "lentille"],
  jaune: ["oeuf", "banane", "citron", "mais", "beurre", "ananas", "curry", "curcuma", "moutarde", "miel", "poire", "pomme_de_terre", "gnocchi", "polenta", "pates", "pates_lasagne", "pate_feuilletee", "pate_brisee", "pate_pizza", "comte", "gruyere", "emmental", "raclette", "fromage_rape", "biere", "vin_blanc"],
  orange: ["carotte", "courge", "patate_douce", "orange", "abricot", "peche", "mangue", "saumon", "saumon_fume", "crevette", "cacahuete"],
  blanc: ["lait", "creme", "yaourt", "fromage_blanc", "mascarpone", "ricotta", "parmesan", "mozzarella", "feta", "chevre", "reblochon", "camembert", "bleu", "fromage_frais", "lait_coco", "lait_vegetal", "tofu", "haricot_blanc", "chou_fleur", "navet", "ail", "oignon", "echalote", "noix_coco", "mayonnaise", "tahini", "riz", "riz_risotto", "semoule", "quinoa", "sucre", "farine", "sel", "levure", "levure_boulanger", "gelifiant"],
  rose: ["poulet", "dinde", "boeuf", "boeuf_hache", "porc", "veau", "agneau", "saucisse", "lardons", "jambon", "jambon_cru", "surimi"],
  bleu: ["poisson_blanc", "thon", "sardine", "moule", "nuoc_mam", "eau"],
  beige: ["pain", "pain_mie", "tortilla", "chapelure", "boulgour", "flocon_avoine", "noix", "amande", "noisette", "pignon", "graine", "champignon", "raisin_sec", "cannelle", "muscade", "cumin", "bouillon", "sauce_soja", "chocolat", "cacao", "cafe", "vanille", "confiture", "vinaigre", "huile", "huile_olive", "poivre"],
  violet: ["aubergine", "oignon_rouge", "prune", "figue", "raisin", "myrtille"],
};

const BY_KEY = {};
for (const [fam, keys] of Object.entries(FAMILIES)) for (const k of keys) BY_KEY[k] = fam;

export function familyOf(key) {
  return BY_KEY[key] || "gris";
}
