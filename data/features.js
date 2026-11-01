// Options du site que l'administrateur peut activer ou désactiver (/admin/options).
// [clé, nom, description, groupe, valeur par défaut]
export const FEATURES = [
  ["defi", "Défi de la semaine", "Bandeau sur l'accueil, page Défi, mention sur les recettes, bloc dans la newsletter et notification du lundi.", "Communauté", true],
  ["photos", "Photos des réalisations", "« Ils l'ont faite » sous les recettes, bouton « Ma photo » et page « Vos réalisations ».", "Communauté", true],
  ["astuces", "Astuces des membres", "« Mon astuce » sous chaque recette.", "Communauté", true],
  ["concours", "Concours photo du mois", "Page Concours, bandeau sur « Vos réalisations » et mention dans le formulaire photo.", "Communauté", false],
  ["badges", "Badges anti-gaspi", "Badges dans Mon compte et « Nouveau badge » après « Je l'ai cuisinée ».", "Communauté", true],
  ["scanner", "Scanner de codes-barres", "Bouton scanner dans le frigo.", "Frigo", true],
  ["dictee", "Dictée vocale", "Bouton micro dans le frigo.", "Frigo", true],
  ["story", "Image pour les stories", "Option « Image pour story Instagram / TikTok » dans Partager.", "Partage", true],
  ["reseaux", "Liens Instagram et TikTok", "En bas de toutes les pages.", "Partage", true],
  ["feedback", "Bouton « Une idée ? Un souci ? »", "En bas de toutes les pages.", "Partage", true],
  ["newsletter", "Newsletter du lundi", "Inscription en bas des pages et dans Mon compte, et envoi chaque lundi.", "E-mails et notifications", true],
  ["bienvenue", "E-mail de bienvenue", "Envoyé à chaque nouvel inscrit.", "E-mails et notifications", true],
  ["rappels", "Rappels « produit à finir » par e-mail", "Option dans Mon compte et envoi chaque matin.", "E-mails et notifications", true],
  ["push", "Notifications sur le téléphone", "Défi du lundi et produits à finir.", "E-mails et notifications", true],
  ["invitation", "Invitation à créer un compte", "Petite carte après 3 recettes, au premier favori ou après « Je l'ai cuisinée ».", "Comptes", true],
  ["installer", "Bandeau « Installer l'app »", "Sur l'accueil, à partir de la 2e visite.", "Comptes", true],
];
export const FEATURE_DEFAULTS = Object.fromEntries(FEATURES.map((f) => [f[0], f[4]]));
