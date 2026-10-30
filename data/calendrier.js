// Calendrier des fruits et légumes de saison en Suisse (récolte locale ou conservation de la récolte suisse).
// [nom affiché, clé du carnet (pour les liens), importé ?]
const L = {
  carotte: ["carottes", "carotte"], celeri: ["céleri", "celeri"], chou: ["choux (blanc, rouge, frisé)", "chou"], bruxelles: ["choux de Bruxelles", "chou_bruxelles"],
  endive: ["endives", "endive"], poireau: ["poireaux", "poireau"], pdt: ["pommes de terre", "pomme_de_terre"], betterave: ["betteraves", "betterave"],
  courge: ["courges", "courge"], navet: ["navets", "navet"], oignon: ["oignons", "oignon"], panais: ["panais", "panais"], rampon: ["rampon (mâche)", "mache"],
  topinambour: ["topinambours", "topinambour"], epinard: ["épinards", "epinard"], asperge: ["asperges", "asperge"], radis: ["radis", "radis"],
  salade: ["salades", "salade"], oignon_nouveau: ["oignons nouveaux", "oignon_nouveau"], petit_pois: ["petits pois", "petit_pois"], chou_rave: ["choux-raves", "chou_rave"],
  courgette: ["courgettes", "courgette"], concombre: ["concombres", "concombre"], haricot: ["haricots verts", "haricot_vert"], fenouil: ["fenouil", "fenouil"],
  tomate: ["tomates", "tomate"], aubergine: ["aubergines", "aubergine"], poivron: ["poivrons", "poivron"], brocoli: ["brocolis", "brocoli"],
  chou_fleur: ["choux-fleurs", "chou_fleur"], mais: ["maïs", "mais"], champignon: ["champignons", "champignon"], ail_ours: ["ail des ours", "ail_ours"],
  cardon: ["cardons", "cardon"], chou_chinois: ["chou chinois", "chou_chinois"],
};
const F = {
  pomme: ["pommes", "pomme"], poire: ["poires", "poire"], rhubarbe: ["rhubarbe", "rhubarbe"], fraise: ["fraises", "fraise"], cerise: ["cerises", "cerise"],
  framboise: ["framboises", "fruits_rouges"], groseille: ["groseilles", "fruits_rouges"], myrtille: ["myrtilles", "fruits_rouges"], mure: ["mûres", "fruits_rouges"],
  abricot: ["abricots du Valais", "abricot"], peche: ["pêches", "peche"], prune: ["prunes et pruneaux", "prune"], melon: ["melons", "melon"],
  raisin: ["raisin", "raisin"], figue: ["figues", "figue"], coing: ["coings", "coing"], chataigne: ["châtaignes", "chataigne"], noix: ["noix", "noix"],
  agrumes: ["agrumes (importés)", "orange", true], kiwi: ["kiwis (importés)", "kiwi", true],
};
const HIVER_L = ["carotte", "celeri", "chou", "bruxelles", "endive", "poireau", "pdt", "betterave", "courge", "navet", "oignon", "panais", "rampon", "topinambour", "chou_chinois"];
export const CALENDRIER = {
  1: { legumes: HIVER_L, fruits: ["pomme", "poire", "agrumes", "kiwi"] },
  2: { legumes: HIVER_L, fruits: ["pomme", "poire", "agrumes", "kiwi"] },
  3: { legumes: ["carotte", "celeri", "chou", "endive", "poireau", "pdt", "betterave", "oignon", "panais", "rampon", "epinard", "radis", "ail_ours"], fruits: ["pomme", "poire", "agrumes"] },
  4: { legumes: ["asperge", "epinard", "radis", "salade", "oignon_nouveau", "rampon", "poireau", "carotte", "pdt", "ail_ours"], fruits: ["rhubarbe", "pomme"] },
  5: { legumes: ["asperge", "epinard", "radis", "salade", "oignon_nouveau", "chou_rave", "petit_pois", "fenouil", "courgette"], fruits: ["fraise", "rhubarbe"] },
  6: { legumes: ["courgette", "concombre", "petit_pois", "haricot", "chou_rave", "fenouil", "salade", "radis", "carotte", "chou_fleur", "brocoli", "tomate"], fruits: ["fraise", "cerise", "framboise", "groseille", "rhubarbe", "abricot"] },
  7: { legumes: ["tomate", "courgette", "aubergine", "poivron", "concombre", "haricot", "fenouil", "brocoli", "chou_fleur", "mais", "salade", "carotte", "betterave", "pdt"], fruits: ["abricot", "cerise", "framboise", "myrtille", "groseille", "mure", "peche", "melon"] },
  8: { legumes: ["tomate", "courgette", "aubergine", "poivron", "concombre", "haricot", "fenouil", "brocoli", "chou_fleur", "mais", "salade", "carotte", "betterave", "pdt"], fruits: ["abricot", "peche", "prune", "myrtille", "mure", "framboise", "melon", "poire", "pomme"] },
  9: { legumes: ["tomate", "poivron", "aubergine", "courgette", "haricot", "mais", "brocoli", "chou_fleur", "fenouil", "courge", "poireau", "champignon", "carotte", "celeri", "betterave", "pdt"], fruits: ["pomme", "poire", "prune", "raisin", "figue", "coing", "mure"] },
  10: { legumes: ["courge", "poireau", "chou", "chou_fleur", "brocoli", "fenouil", "celeri", "carotte", "betterave", "panais", "epinard", "champignon", "rampon", "endive", "pdt", "topinambour"], fruits: ["pomme", "poire", "raisin", "coing", "chataigne", "noix"] },
  11: { legumes: ["courge", "poireau", "chou", "bruxelles", "endive", "celeri", "carotte", "betterave", "panais", "navet", "rampon", "pdt", "topinambour", "cardon", "chou_chinois"], fruits: ["pomme", "poire", "coing", "chataigne", "noix", "kiwi"] },
  12: { legumes: ["courge", "poireau", "chou", "bruxelles", "endive", "celeri", "carotte", "betterave", "panais", "navet", "rampon", "pdt", "cardon"], fruits: ["pomme", "poire", "agrumes", "kiwi", "chataigne"] },
};
export const LEGUMES = L;
export const FRUITS = F;
