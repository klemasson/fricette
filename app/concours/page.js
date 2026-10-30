// Concours photo du mois.
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { entries, lot, monthKey, monthLabel, prevMonth, winner, pastWinners } from "@/lib/concours";
import { getRecipe } from "@/lib/carnet-server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Concours photo du mois – Fricette",
  description: "Cuisine une recette anti-gaspi, partage la photo de ton plat sur Fricette et tente de gagner le concours du mois.",
  alternates: { canonical: "/concours" },
};

const Photo = ({ p, big }) => {
  const r = getRecipe(p.recipe_id);
  return (
    <li className={big ? "win" : ""}>
      <a href={`/recette/${p.recipe_id}#photos`}><img src={`/api/realisations/${p.id}/image`} alt={p.texte || `Réalisation : ${r?.titre || ""}`} loading="lazy" /></a>
      <div className="gal-txt">
        <a href={`/recette/${p.recipe_id}#photos`}>{r?.titre || "Recette"}</a>
        {p.texte && <span>« {p.texte} »</span>}
        <small>{p.prenom || "Un·e cuisinier·ère"}</small>
      </div>
    </li>
  );
};

export default function Concours() {
  const now = monthKey();
  const list = entries(now);
  const last = prevMonth(now);
  const lastWinner = winner(last);
  const past = pastWinners(12).filter((w) => w.mois !== last);
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <p className="crumbs"><a href="/realisations">Vos réalisations</a> › <span>Concours photo</span></p>
        <p className="kicker">Concours photo du mois</p>
        <h1>Ton plat anti-gaspi peut gagner 🏆</h1>
        <p className="lead">Chaque mois, la plus belle photo de plat partagée sur Fricette gagne <strong>{lot()}</strong>. Participation gratuite.</p>

        <ol className="steps-mini concours-steps">
          <li><b>1</b><span><strong>Cuisine</strong>une recette Fricette avec ce qui traîne dans ton frigo</span></li>
          <li><b>2</b><span><strong>Photographie</strong>ton plat et touche « 📸 Ma photo » sur la recette</span></li>
          <li><b>3</b><span><strong>Croise les doigts</strong>la photo gagnante est annoncée au début du mois suivant</span></li>
        </ol>

        {lastWinner && (
          <section style={{ marginTop: 28 }}>
            <h2>🏆 Gagnant·e de {monthLabel(last)}</h2>
            <ul className="gal"><Photo p={lastWinner} big /></ul>
          </section>
        )}

        <section style={{ marginTop: 28 }}>
          <h2>Les participations de {monthLabel(now)} <small className="muted">· {list.length}</small></h2>
          {list.length === 0
            ? <p className="muted">Pas encore de photo ce mois-ci… La tienne sera peut-être la seule ! <a href="/">Trouver une recette →</a></p>
            : <ul className="gal">{list.map((p) => <Photo key={p.id} p={p} />)}</ul>}
        </section>

        {past.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2>Les gagnant·es précédent·es</h2>
            <ul className="gal">{past.map((w) => <Photo key={w.mois} p={{ ...w, texte: `${monthLabel(w.mois)}${w.texte ? " · " + w.texte : ""}` }} />)}</ul>
          </section>
        )}

        <section className="legal-mini" style={{ marginTop: 32 }}>
          <h2>Règlement en bref</h2>
          <ul>
            <li>Participation gratuite et sans obligation d'achat, avec un compte Fricette gratuit. Ouvert aux personnes majeures résidant en Suisse (les mineurs avec l'accord d'un parent).</li>
            <li>Toutes les photos de plats publiées sur Fricette pendant le mois participent automatiquement. Elles doivent montrer une recette du site, cuisinée par la personne qui l'envoie.</li>
            <li>L'équipe de Fricette choisit la gagnante au début du mois suivant, selon l'envie que donne le plat, la créativité et l'esprit anti-gaspi.</li>
            <li>La personne gagnante est prévenue à l'adresse e-mail de son compte. Sans réponse dans les 30 jours, le lot est remis en jeu. Le lot n'est pas échangeable contre de l'argent.</li>
            <li>La photo gagnante et le prénom indiqué peuvent être montrés sur le site et sur les comptes Instagram et TikTok de Fricette.</li>
          </ul>
          <p className="muted small">Détails complets dans les <a href="/conditions#concours">Conditions</a>.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
