// Offre payante : état et liste de ce qu'il faudra pour l'activer (rien n'est visible pour les visiteurs).
import { billingEnabled } from "@/lib/billing";
import { AI_ENABLED } from "@/lib/ai";

const ok = (b) => (b ? "✅" : "⬜️");

export default function Offre() {
  const ai = !!process.env.ANTHROPIC_API_KEY && AI_ENABLED;
  const pay = billingEnabled;
  return (
    <div className="offre">
      <p><strong>État : {ai && pay ? "activée" : "désactivée"}</strong> {ai && pay ? "" : "· les visiteurs ne voient rien de l'offre payante."}</p>
      <p className="muted small">Déjà prêt dans le code : l'abonnement mensuel (paiement par carte avec Stripe, résiliation en un clic), la photo du frigo analysée par IA, les recettes sur mesure, et les limites gratuites / abonné·e.</p>
      <ul className="offre-list">
        <li>{ok(ai)} <strong>Clé de l'IA</strong> : variable <code>ANTHROPIC_API_KEY</code> (compte sur console.anthropic.com, paiement à l'usage). Coût indicatif : quelques centimes par photo ou recette.</li>
        <li>{ok(!!process.env.STRIPE_SECRET_KEY)} <strong>Compte Stripe</strong> : variable <code>STRIPE_SECRET_KEY</code> (stripe.com, compte suisse, vérification d'identité).</li>
        <li>{ok(!!process.env.STRIPE_PRICE_ID)} <strong>Prix de l'abonnement</strong> : créé dans Stripe, variable <code>STRIPE_PRICE_ID</code>. Texte affiché : <code>PRICE_LABEL</code> (actuellement « {process.env.PRICE_LABEL || "4,90 CHF / mois"} »).</li>
        <li>⬜️ <strong>Conditions de vente</strong> à ajouter à la page Conditions (prix, résiliation, remboursement). Je pourrai te les rédiger.</li>
        <li>⬜️ <strong>Statut</strong> : vérifier avec un·e fiduciaire s'il faut s'inscrire comme indépendant·e (revenus) ; la TVA n'est obligatoire qu'au-delà de 100 000 CHF de chiffre d'affaires par an.</li>
      </ul>
      <p className="muted small">Les variables se règlent chez Infomaniak, dans les paramètres du site Node.js, puis « Construire ». Ne m'envoie jamais ces clés : colle-les directement chez Infomaniak.</p>
    </div>
  );
}
