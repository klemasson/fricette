// Galerie publique : les dernières photos de plats partagées par la communauté.
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { photosLatest, photosTopRecipes } from "@/lib/db";
import { getRecipe } from "@/lib/carnet-server";
import { lot } from "@/lib/concours";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vos réalisations – Fricette",
  description: "Les plats cuisinés par la communauté Fricette avec les restes de leur frigo.",
  alternates: { canonical: "/realisations" },
};

export default function Realisations() {
  const top = photosTopRecipes(10).map((t) => ({ ...t, r: getRecipe(t.recipe_id) })).filter((t) => t.r);
  const list = photosLatest(60).map((p) => ({ ...p, titre: getRecipe(p.recipe_id)?.titre })).filter((p) => p.titre);
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <h1>Vos réalisations 📸</h1>
        <p className="lead">Les plats cuisinés par la communauté avec ce qu'il restait dans le frigo. Tu as fait une recette ? Ouvre-la et touche « Partager ma photo ».</p>
        <div className="concours-band">
          <span>🏆 <strong>Concours photo du mois</strong> : la plus belle photo gagne {lot()}.</span>
          <a href="/concours">Participer →</a>
        </div>
        {top.length >= 2 && (
          <section className="top-photos">
            <h2>Les plus cuisinées par la communauté</h2>
            <ol>
              {top.map((t, i) => (
                <li key={t.recipe_id}>
                  <a href={`/recette/${t.recipe_id}#photos`}>
                    <span className="tp-rank">{i + 1}</span>
                    {t.r.photo ? <img src={t.r.photo} alt="" loading="lazy" /> : <span className="tp-ph" />}
                    <span className="tp-name">{t.r.titre}</span>
                    <span className="tp-n">📸 {t.n}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
        {list.length > 0 && top.length >= 2 && <h2 style={{ marginTop: 32 }}>Dernières photos</h2>}
        {list.length === 0 ? (
          <p className="muted" style={{ marginTop: 24 }}>Pas encore de photo… À toi d'ouvrir le bal ! <a href="/">Trouver une recette →</a></p>
        ) : (
          <ul className="gal">
            {list.map((p) => (
              <li key={p.id}>
                <a href={`/recette/${p.recipe_id}#photos`}><img src={`/api/realisations/${p.id}/image`} alt={p.texte || `Réalisation : ${p.titre}`} loading="lazy" /></a>
                <div className="gal-txt">
                  <a href={`/recette/${p.recipe_id}#photos`}>{p.titre}</a>
                  {p.texte && <span>« {p.texte} »</span>}
                  <small>{p.prenom || "Un·e cuisinier·ère"}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
