import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { Ico } from "@/app/components/bits";

export const metadata = {
  title: "Conditions et confidentialité – Fricette",
  description: "Qui édite Fricette, comment fonctionne le service et ce que nous faisons (et ne faisons pas) de tes données.",
  alternates: { canonical: "/conditions" },
};

const BREF = [
  ["vert", "Gratuit, sans publicité"],
  ["jaune", "Aucun traceur publicitaire, aucun cookie de mesure"],
  ["bleu", "Données hébergées en Suisse"],
  ["rouge", "Ton compte se supprime en un clic"],
];

// Ce texte n'est pas un avis juridique : à faire relire si le service évolue (abonnement, etc.).
export default function Conditions() {
  return (
    <>
      <SiteHeader />
      <main className="in legal">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Conditions et confidentialité</span></p>
        <h1>Conditions et confidentialité</h1>
        <p className="lead">Ce qu'il faut savoir sur Fricette, en clair. Mise à jour : octobre 2026.</p>

        <div className="legal-grid">
          <aside className="legal-bref" aria-label="En bref">
            <div className="label">En bref</div>
            <ul>
              {BREF.map(([f, t]) => <li key={t}><Ico fam={f} rot={0} />{t}</li>)}
            </ul>
            <p className="muted small">Une question ? <a href="mailto:bonjour@fricette.ch">bonjour@fricette.ch</a></p>
          </aside>

          <div className="legal-body">
            <section>
              <h2>Éditeur du site</h2>
              <address>
                Kevin Lemasson<br />
                Rue du Grand Clos 101c<br />
                1913 Saillon, Suisse<br />
                <a href="mailto:bonjour@fricette.ch">bonjour@fricette.ch</a>
              </address>
              <p>Hébergement : Infomaniak Network SA, Genève, Suisse.</p>
            </section>

            <section>
              <h2>Le service</h2>
              <p>
                Fricette propose des idées de recettes à partir des ingrédients que tu indiques, tirées de son propre carnet
                de recettes. Les recettes sont des suggestions : vérifie toujours les temps de cuisson, la fraîcheur des
                produits et les allergènes. Les photos des recettes sont générées par IA et servent d'illustration : ton plat
                ne ressemblera pas forcément exactement à l'image. Le service ne remplace pas l'avis d'un professionnel de
                santé ou de nutrition.
              </p>
              <p>
                Les informations des produits scannés (nom, quantité) viennent de la base libre{" "}
                <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>.
              </p>
            </section>

            <section>
              <h2>Gratuité</h2>
              <p>Fricette est gratuit, sans publicité. Créer un compte est facultatif.</p>
            </section>

            <section>
              <h2>Données personnelles</h2>
              <h3>Sans compte</h3>
              <ul>
                <li>Ton frigo, tes favoris et ta liste de courses sont enregistrés uniquement dans ton navigateur.</li>
                <li>La recherche de recettes se fait directement dans ton navigateur.</li>
                <li>Un cookie technique anonyme sert à retenir la note que tu donnes aux recettes.</li>
              </ul>
              <h3>Avec un compte</h3>
              <ul>
                <li>Nous enregistrons ton adresse e-mail, ton mot de passe sous forme chiffrée (nous ne pouvons pas le lire), tes favoris, tes notes, ton frigo et ta liste de courses, sur notre hébergement en Suisse, pour les retrouver sur tous tes appareils.</li>
                <li>Un cookie de connexion te garde connecté·e pendant 6 mois.</li>
                <li>Ton adresse e-mail sert uniquement à te connecter et à t'envoyer, si tu le demandes, un lien pour changer de mot de passe. Elle n'est jamais transmise à des tiers ni utilisée pour de la publicité.</li>
                <li>Tu peux supprimer ton compte et toutes ces données à tout moment, en bas de la page d'accueil (« Supprimer mon compte »).</li>
              </ul>
              <h3>Statistiques</h3>
              <ul>
                <li>Pour améliorer le carnet, nous comptons de façon anonyme les pages vues, les recettes ouvertes et les ingrédients ajoutés au frigo (par exemple « courgette : 120 fois aujourd'hui »).</li>
                <li>Ces chiffres ne sont reliés à personne : aucun cookie de mesure, aucune adresse IP enregistrée, et l'empreinte qui sert à compter les visiteurs uniques change chaque jour.</li>
                <li>Aucune publicité, aucun traceur publicitaire.</li>
              </ul>
              <p>Pour toute demande concernant tes données (consultation, correction, suppression) : <a href="mailto:bonjour@fricette.ch">bonjour@fricette.ch</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
