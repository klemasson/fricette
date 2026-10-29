// Gestes de base en vidéo : le mode cuisine repère ces gestes dans les étapes et propose la vidéo.
// video : identifiant YouTube (11 caractères), lu en mode « sans cookies » (youtube-nocookie.com).
// Pour changer une vidéo : remplacer l'identifiant (la fin de l'adresse youtube.com/watch?v=…).
export const GESTES = [
  { key: "emincer-oignon", label: "Émincer un oignon", re: /(émincer|hacher|ciseler|couper)[^.;]{0,40}\b(oignons?|échalotes?)\b|\b(oignons?|échalotes?) (émincés?|hachés?|ciselés?)/i },
  { key: "hacher-ail", label: "Hacher l'ail", re: /(hacher|émincer|écraser)[^.;]{0,25}\bail\b|\bail (haché|écrasé|émincé)|gousses? d.ail (hachées?|écrasées?|émincées?)/i },
  { key: "ciseler-herbes", label: "Ciseler des herbes", re: /cisel(er|ée?s?) (le |la |les |l')?(persil|ciboulette|basilic|coriandre|menthe|aneth|herbes)|(persil|ciboulette|basilic|coriandre|menthe|aneth|herbes)( fraîches?)? (ciselée?s?|hachée?s?)/i },
  { key: "tailler-des", label: "Tailler en dés", re: /en (petits |gros )?dés|en brunoise|en cubes/i },
  { key: "julienne", label: "Tailler en julienne", re: /julienne|en bâtonnets|en allumettes/i },
  { key: "rondelles", label: "Couper en rondelles", re: /en (fines )?(rondelles|demi-rondelles|lamelles|tranches fines)/i },
  { key: "eplucher", label: "Éplucher les légumes", re: /\b(éplucher|peler)\b/i },
  { key: "zester", label: "Zester un agrume", re: /\bzest(er|é)|prélever le zeste|râper le zeste/i },
  { key: "suer", label: "Faire suer un oignon", re: /faire (suer|revenir|fondre) (l.|les |la )?(oignons?|échalotes?|poireaux?)/i },
  { key: "saisir", label: "Saisir une viande", re: /\bsaisir\b|saisi(e|s)? (à feu vif|de chaque côté)/i },
  { key: "deglacer", label: "Déglacer", re: /déglac/i },
  { key: "mixer-veloute", label: "Mixer un velouté", re: /\bmixer\b[^.;]{0,40}(soupe|velouté|potage|finement|lisse)|mixer (le tout|la soupe|le velouté)/i },
  { key: "puree", label: "Faire une purée", re: /\b(écraser|réduire) en purée|purée (lisse|maison)|écraser (les )?pommes de terre/i },
  { key: "riz", label: "Cuire le riz", re: /cuire le riz|riz (rincé|cuit à l.eau)|rincer le riz/i },
  { key: "pates", label: "Cuire les pâtes", re: /cuire les (pâtes|spaghetti|penne|tagliatelles|nouilles|macaronis|coquillettes|fusilli)|al dente/i },
  { key: "risotto", label: "Nacrer le riz", re: /nacrer|risotto/i },
  { key: "wok", label: "Faire sauter au wok", re: /\bwok\b|faire sauter (à feu vif|rapidement)/i },
  { key: "rotir-legumes", label: "Rôtir des légumes", re: /\brôtir\b[^.;]{0,60}(four|plaque)|enfourner[^.;]{0,30}(légumes|plaque)/i },
  { key: "poisson-poele", label: "Cuire un poisson à la poêle", re: /(saumon|cabillaud|poisson|filets?)[^.;]{0,50}(côté peau|à la poêle|poêler)/i },
  { key: "cuisson-volaille", label: "Vérifier la cuisson d'une volaille", re: /(poulet|dinde|volaille)[^.]{0,80}(à cœur|plus rosé|jus (qui s.écoule )?(est )?clair)/i },
  { key: "foncer-pate", label: "Foncer un moule à tarte", re: /foncer|étaler la pâte|piquer le fond|abaisser la pâte/i },
  { key: "paner", label: "Paner", re: /\bpaner\b|dans la chapelure|panure/i },
  { key: "caramelisser-oignons", label: "Caraméliser des oignons", re: /(oignons?)[^.;]{0,40}caramélis|caraméliser (les )?oignons/i },
  { key: "lier-sauce", label: "Lier une sauce", re: /\blier\b|maïzena|fécule|épaissir la sauce/i },
  { key: "oeuf-mollet", label: "Cuire un œuf mollet ou dur", re: /œufs? (mollets?|durs?)|écaler/i },
  { key: "vinaigrette", label: "Faire une vinaigrette", re: /vinaigrette|émulsionner/i },
  { key: "blancs-neige", label: "Monter des blancs en neige", re: /en neige|monter les blancs/i },
  { key: "separer-oeufs", label: "Séparer les blancs des jaunes", re: /séparer (les )?(blancs|jaunes|œufs)/i },
  { key: "blanchir-legumes", label: "Blanchir des légumes", re: /blanchir (les |le |la )?(haricots|brocoli|légumes|épinards|chou|petits pois|asperges)|plonger[^.;]{0,30}eau (glacée|froide)/i },
  { key: "bain-marie", label: "Faire fondre au bain-marie", re: /bain-marie/i },
  { key: "bechamel", label: "Faire une béchamel", re: /béchamel|\broux\b/i },
  { key: "omelette", label: "Réussir une omelette", re: /omelette/i },
  { key: "oeufs-brouilles", label: "Réussir des œufs brouillés", re: /œufs brouillés|brouiller/i },
  { key: "petrir", label: "Pétrir une pâte", re: /pétri/i },
  { key: "caramel", label: "Faire un caramel", re: /\bcaramel\b(?! au beurre salé du commerce)/i },
  { key: "cuisson-gateau", label: "Vérifier la cuisson d'un gâteau", re: /(lame|pointe) d.un couteau|cure-dent/i },
  { key: "oeuf-poche", label: "Pocher un œuf", re: /pocher les œufs|œufs? pochés?|pocher (un|l.)œuf/i },
  { key: "cremer-beurre", label: "Travailler le beurre en pommade", re: /beurre (mou|pommade)|en pommade|crémer/i },
];

/** Les gestes repérés dans une étape (2 au maximum), seulement ceux qui ont une vidéo. */
export function gestesOf(step, videos) {
  return GESTES.filter((g) => videos[g.key] && g.re.test(step)).slice(0, 2);
}
