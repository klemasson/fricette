export const metadata = { title: "Conditions et confidentialité – Fricette" };

// Modèle à compléter et à faire relire : ce texte n'est pas un avis juridique.
export default function Conditions() {
  return (
    <main className="in legal">
      <p><a href="/">← Retour aux recettes</a></p>
      <h1>Conditions et confidentialité</h1>

      <h2>Éditeur du site</h2>
      <p>Kevin Lemasson<br />Rue du Grand Clos 101c<br />1913 Saillon, Suisse<br />Contact : <a href="mailto:bonjour@fricette.ch">bonjour@fricette.ch</a></p>

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
        <li>La liste de ton frigo et ta liste de courses sont enregistrées dans ton navigateur. Si tu es connecté·e à un compte, elles sont aussi enregistrées sur ton compte pour te suivre sur tous tes appareils.</li>
        <li>La recherche de recettes se fait directement dans ton navigateur.</li>
        <li>Pour améliorer le carnet, nous comptons de façon anonyme les pages vues, les recettes ouvertes et les ingrédients ajoutés au frigo (par exemple « courgette : 120 fois aujourd'hui »). Ces chiffres ne sont reliés à personne : aucun cookie de mesure, aucune adresse IP enregistrée, et l'empreinte qui sert à compter les visiteurs uniques change chaque jour.</li>
        <li>Un cookie technique anonyme sert à retenir la note que tu donnes aux recettes.</li>
        <li>Si tu crées un compte, nous enregistrons ton adresse e-mail, ton mot de passe sous forme chiffrée (nous ne pouvons pas le lire), tes recettes favorites, tes notes, ton frigo et ta liste de courses, sur notre hébergement en Suisse (Infomaniak). Un cookie de connexion te garde connecté·e pendant 6 mois.</li>
        <li>Tu peux supprimer ton compte et toutes ces données à tout moment, en bas de la page d'accueil (« Supprimer mon compte »).</li>
        <li>Ton adresse e-mail sert uniquement à te connecter et à t'envoyer, si tu le demandes, un lien pour changer de mot de passe. Elle n'est jamais transmise à des tiers ni utilisée pour de la publicité.</li>
        <li>Aucune publicité, aucun traceur publicitaire.</li>
      </ul>
      <p>Pour toute demande concernant tes données : bonjour@fricette.ch.</p>
    </main>
  );
}
