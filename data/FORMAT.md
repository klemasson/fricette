# Format d'une recette du carnet

Chaque fichier `data/parts/*.json` est un tableau JSON de recettes :

```json
{
  "titre": "Frittata courgette et feta",
  "categorie": "plat",
  "temps": 25,
  "difficulte": "facile",
  "portions": 2,
  "regimes": ["vegetarien", "sans_gluten", "sans_porc", "sans_alcool"],
  "ingredients": [
    { "cle": "oeuf", "nom": "œufs", "qte": 4, "unite": "pièce" },
    { "cle": "courgette", "nom": "courgette", "qte": 200, "unite": "g" },
    { "cle": "feta", "nom": "feta", "qte": 100, "unite": "g" },
    { "cle": "huile_olive", "nom": "huile d'olive", "qte": 1, "unite": "c. à s." },
    { "cle": "menthe", "nom": "menthe fraîche", "qte": null, "unite": "", "optionnel": true }
  ],
  "etapes": [
    "Préchauffer le four en mode grill à 220 °C.",
    "…"
  ],
  "astuce": "Une phrase utile (conservation, variante, anti-gaspi)."
}
```

Règles :
- `cle` : UNIQUEMENT une clé de `data/vocab.js` (premier élément de chaque ligne). Le sel, le poivre, l'huile, la farine, le sucre, le beurre, le vinaigre et l'eau ont aussi des clés (`sel`, `poivre`, `huile`, `huile_olive`, `farine`, `sucre`, `beurre`, `vinaigre`, `eau`).
- `nom` : le nom affiché, en français naturel (peut être plus précis que la clé : « cabillaud » pour `poisson_blanc`, « spaghetti » pour `pates`).
- `unite` : une de `""`, `pièce`, `g`, `kg`, `ml`, `cl`, `l`, `tranche`, `botte`, `boîte`, `pot`, `c. à s.`, `c. à c.`, `pincée`, `gousse`. Pour les légumes et viandes, préférer `g` (ou `pièce` pour œufs, oignons, citrons, gousses d'ail…). `qte: null` et `unite: ""` pour « sel, poivre » ou « quelques feuilles ».
- `optionnel: true` pour la garniture ou les herbes non indispensables.
- `regimes` : tags qui S'APPLIQUENT à la recette parmi `vegetarien`, `vegan`, `sans_gluten`, `sans_lactose`, `sans_porc`, `sans_alcool`. Une recette vegan est aussi `vegetarien`. Attention : pâtes, pain, farine, chapelure, bière, sauce soja (sauf tamari) contiennent du gluten.
- `categorie` : `plat`, `entree`, `soupe`, `salade`, `accompagnement`, `dessert`, `petit-dejeuner`, `gouter`, `apero`.
- `difficulte` : `facile`, `moyen` ou `difficile`. `temps` en minutes, entier, temps total réaliste.
- Étapes : 3 à 7 phrases claires, à l'infinitif, températures en °C, temps de cuisson précis.
- Ingrédients du quotidien, faciles à trouver en Suisse romande / France. Recettes ORIGINALES, rédigées par toi.
