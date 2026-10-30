// Galerie publique : les dernières photos de plats partagées par la communauté.
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { photosLatest } from "@/lib/db";
import { getRecipe } from "@/lib/carnet-server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vos réalisations – Fricette",
  description: "Les plats cuisinés par la communauté Fricette avec les restes de leur frigo.",
  alternates: { canonical: "/realisations" },
};

export default function Realisations() {
  const list = photosLatest(60).map((p) => ({ ...p, titre: getRecipe(p.recipe_id)?.titre })).filter((p) => p.titre);
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <h1>Vos réalisations 📸</h1>
        <p className="lead">Les plats cuisinés par la communauté avec ce qu'il restait dans le frigo. Tu as fait une recette ? Ouvre-la et touche « Partager ma photo ».</p>
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
