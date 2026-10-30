// Prix indicatifs au kilo (ou au litre) en Suisse, en CHF, pour estimer l'argent économisé
// quand on cuisine ce qui allait être jeté. Ordre de grandeur seulement (grandes surfaces, 2026).
export const PRIX_KG = {
  boeuf: 32, boeuf_hache: 20, veau: 45, agneau: 38, porc: 18, poulet: 22, canard: 35, lardons: 22, jambon: 32, jambon_cru: 50,
  saucisse: 18, chorizo: 32, saumon: 40, saumon_fume: 60, poisson_blanc: 32, crevette: 40, thon: 16,
  gruyere: 22, raclette: 22, parmesan: 32, mozzarella: 15, feta: 18, chevre: 26, fromage_rape: 18, fromage_frais: 12,
  ricotta: 14, mascarpone: 14, creme: 8, lait: 1.7, lait_coco: 6, yaourt: 4, beurre: 14, oeuf: 9,
  champignon: 12, fruits_rouges: 16, avocat: 10, asperge: 14, epinard: 10, salade: 8, brocoli: 6, chou_fleur: 5,
  tomate: 5, tomate_cerise: 8, courgette: 5, aubergine: 6, poivron: 7, concombre: 4, haricot_vert: 9, petit_pois: 6,
  carotte: 2.5, pomme_de_terre: 2.5, patate_douce: 5, oignon: 2.5, poireau: 5, chou: 3, courge: 4, celeri: 4, betterave: 4,
  pomme: 4, poire: 4.5, banane: 3.5, orange: 3.5, citron: 4, peche: 6, abricot: 7,
  pain: 5, pain_mie: 6, pates: 3, riz: 4, semoule: 3, quinoa: 9, lentille: 5, pois_chiche: 5, tofu: 14, chocolat: 15, noix: 20,
};
export const PRIX_DEFAUT = 7;
export const prixKg = (cle) => PRIX_KG[cle] ?? PRIX_DEFAUT;
