// Allergènes principaux, déduits des ingrédients de chaque recette (clés du vocabulaire et noms).
// C'est une aide : les produits du commerce (bouillon, pâtes, sauces…) peuvent en contenir d'autres.
const LAIT = ["lait", "creme", "yaourt", "fromage_blanc", "mascarpone", "ricotta", "fromage_rape", "gruyere", "emmental", "comte", "parmesan", "mozzarella", "feta", "chevre", "raclette", "reblochon", "camembert", "bleu", "fromage_frais", "beurre"];

export const ALLERGENS = [
  { key: "gluten", label: "gluten", test: (r) => !r.regimes.includes("sans_gluten") },
  { key: "lait", label: "lait", test: (r, g) => g.some((i) => LAIT.includes(i.cle)) },
  { key: "oeufs", label: "œufs", test: (r, g) => g.some((i) => ["oeuf", "mayonnaise"].includes(i.cle) || /\bœufs?\b|\boeufs?\b|jaunes? d|blancs? d/i.test(i.nom)) },
  { key: "fruits-coque", label: "fruits à coque", test: (r, g) => g.some((i) => ["noix", "amande", "noisette", "pignon", "pesto"].includes(i.cle) || /noix de cajou|pistache|amande|noisette/i.test(i.nom)) },
  { key: "arachides", label: "arachides", test: (r, g) => g.some((i) => i.cle === "cacahuete" || /arachide|cacahu/i.test(i.nom)) },
  { key: "poisson", label: "poisson", test: (r, g) => g.some((i) => ["saumon", "saumon_fume", "poisson_blanc", "thon", "sardine", "nuoc_mam", "surimi"].includes(i.cle) || /anchois/i.test(i.nom)) },
  { key: "crustaces", label: "crustacés et mollusques", test: (r, g) => g.some((i) => ["crevette", "moule", "surimi"].includes(i.cle)) },
  { key: "soja", label: "soja", test: (r, g) => g.some((i) => ["tofu", "sauce_soja"].includes(i.cle) || /soja|edamame/i.test(i.nom)) },
  { key: "sesame", label: "sésame", test: (r, g) => g.some((i) => i.cle === "tahini" || /s[ée]same/i.test(i.nom)) },
  { key: "celeri", label: "céleri", test: (r, g) => g.some((i) => i.cle === "celeri") },
  { key: "moutarde", label: "moutarde", test: (r, g) => g.some((i) => ["moutarde", "mayonnaise"].includes(i.cle)) },
];

/** Allergènes d'une recette (ingrédients facultatifs non comptés). */
export function allergensOf(r) {
  const g = r.ingredients.filter((i) => !i.optionnel);
  return ALLERGENS.filter((a) => a.test(r, g)).map((a) => a.key);
}

export const allergenLabel = (k) => ALLERGENS.find((a) => a.key === k)?.label || k;
