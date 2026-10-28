export const metadata = { title: "Conditions et confidentialité – Fricette" };

// Modèle à compléter et à faire relire : ce texte n'est pas un avis juridique.
export default function Conditions() {
  return (
    <main className="in legal">
      <p><a href="/">← Retour aux recettes</a></p>
      <h1>Conditions et confidentialité</h1>

      <h2>Éditeur du site</h2>
      <p>[À COMPLÉTER : ton nom ou celui de ton entreprise, adresse postale, e-mail de contact, numéro IDE si tu en as un.]</p>

      <h2>Le service</h2>
      <p>
        Fricette propose des idées de recettes à partir des ingrédients que tu indiques, tirées de
        son propre carnet de recettes. Les recettes sont
        des suggestions : vérifie toujours les temps de cuisson, la fraîcheur des produits et les
        allergènes. Les images des recettes servent d'illustration : ton plat ne ressemblera pas forcément exactement à l'image. Le service ne remplace pas l'avis d'un professionnel de santé ou de nutrition.
      </p>

      <h2>Gratuité</h2>
      <p>Fricette est gratuit, sans inscription ni publicité.</p>

      <h2>Données personnelles</h2>
      <ul>
        <li>La liste de ton frigo est enregistrée uniquement dans ton navigateur.</li>
        <li>La recherche de recettes se fait directement dans ton navigateur : ta liste n'est pas envoyée à nos serveurs.</li>
        <li>Un cookie technique anonyme peut être déposé pour le bon fonctionnement du site.</li>
        <li>Si tu crées un compte, nous enregistrons ton adresse e-mail, ton mot de passe sous forme chiffrée (nous ne pouvons pas le lire) et la liste de tes recettes favorites, sur notre hébergement en Suisse (Infomaniak). Un cookie de connexion te garde connecté·e pendant 6 mois.</li>
        <li>Tu peux supprimer ton compte et tes favoris à tout moment, en bas de la page d'accueil (« Supprimer mon compte »). Sans compte, tes favoris restent uniquement dans ton navigateur.</li>
        <li>Ton adresse e-mail n'est jamais transmise à des tiers ni utilisée pour de la publicité.</li>
        <li>Aucune publicité, aucun traceur publicitaire.</li>
      </ul>
      <p>Pour toute demande concernant tes données : [À COMPLÉTER : e-mail de contact].</p>
    </main>
  );
}
