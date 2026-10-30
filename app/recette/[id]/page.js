import { notFound } from "next/navigation";
import { carnet, getRecipe, similar, ingredientLine, ingredientPages, capital } from "@/lib/carnet-server";
import { artSvg } from "@/lib/art";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import RecipeClient from "./RecipeClient";
import LinkCard from "@/app/components/LinkCard";
import { ratingSummary } from "@/lib/db";

export const dynamicParams = false;
// La page est régénérée au plus toutes les heures, pour que la note moyenne (étoiles Google) reste à jour.
export const revalidate = 3600;
export function generateStaticParams() {
  return carnet().map((r) => ({ id: r.id }));
}

const CAT = { plat: "Plat", entree: "Entrée", soupe: "Soupe", salade: "Salade", accompagnement: "Accompagnement", dessert: "Dessert", "petit-dejeuner": "Petit-déjeuner", gouter: "Goûter", apero: "Apéro" };
const DIETS = { vegetarien: "VegetarianDiet", vegan: "VeganDiet", sans_gluten: "GlutenFreeDiet", sans_lactose: "LowLactoseDiet" };
const REG = { vegetarien: "végétarien", vegan: "vegan", sans_gluten: "sans gluten", sans_lactose: "sans lactose" };

function describe(r) {
  const main = r.ingredients.filter((g) => !g.optionnel).slice(0, 4).map((g) => g.nom).join(", ");
  return `${r.titre} : recette ${r.difficulte} en ${r.temps} min pour ${r.portions} personnes, avec ${main}. Quantités, étapes et astuce anti-gaspi.`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const r = getRecipe(id);
  if (!r) return {};
  const description = describe(r);
  return {
    title: `${r.titre} – recette Fricette`,
    description,
    alternates: { canonical: `/recette/${r.id}` },
    openGraph: { title: r.titre, description, type: "article", url: `/recette/${r.id}`, images: r.photo ? [{ url: r.photo, width: 640, height: 448, alt: r.titre }] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RecipePage({ params }) {
  const { id } = await params;
  const r = getRecipe(id);
  if (!r) notFound();
  const more = similar(r, 4);
  const pages = new Set(ingredientPages().map((p) => p.cle));
  const tags = [...new Map(r.ingredients.filter((g) => pages.has(g.cle)).map((g) => [g.cle, g])).values()].slice(0, 5);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.titre,
    description: describe(r),
    image: r.photo ? [`https://fricette.ch${r.photo}`] : undefined,
    author: { "@type": "Organization", name: "Fricette", url: "https://fricette.ch" },
    totalTime: `PT${r.temps}M`,
    recipeYield: `${r.portions} personnes`,
    recipeCategory: CAT[r.categorie],
    recipeIngredient: r.ingredients.map(ingredientLine),
    recipeInstructions: r.etapes.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })),
    suitableForDiet: r.regimes.filter((x) => DIETS[x]).map((x) => `https://schema.org/${DIETS[x]}`),
    keywords: ["anti-gaspi", ...r.ingredients.slice(0, 5).map((g) => g.nom)].join(", "),
  };
  // Note moyenne donnée par les visiteurs (affichée aussi sur la page) : Google peut la montrer en étoiles.
  let note = null;
  try { note = ratingSummary()[r.id] || null; } catch {}
  if (note && note[1] >= 1) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: note[0], ratingCount: note[1], bestRating: 5, worstRating: 1 };
  }

  return (
    <>
      <SiteHeader />
      <main className="recipe-page">
        <div className="in">
          <p className="crumbs">
            <a href="/">Accueil</a> › {tags[0] ? <><a href={`/avec/${tags[0].cle.replace(/_/g, "-")}`}>{capital(tags[0].nom)}</a> › </> : null}<span>{CAT[r.categorie]}</span>
          </p>
          <article className="recipe-card">
            {r.photo
              ? <div className="art"><img src={r.photo} alt={r.titre} width="640" height="448" /><span className="ai-tag">Photo générée par IA</span></div>
              : <div className="art" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, [], { w: 640, h: 300 }) }} />}
            <div className="sheet-body">
              <RecipeClient raw={r} />
              <p className="note">
                {r.regimes.filter((x) => REG[x]).map((x) => REG[x]).join(" · ")}
                
              </p>
            </div>
          </article>

          {tags.length > 0 && (
            <div className="tagline">
              <span>Autres idées avec :</span>
              {tags.map((g) => <a key={g.cle} className="f" href={`/avec/${g.cle.replace(/_/g, "-")}`}>{g.nom}</a>)}
            </div>
          )}
        </div>

        {more.length > 0 && (
          <section className="recipes" aria-label="Dans le même esprit">
            <div className="in">
              <div className="sec"><h2>Dans le même esprit</h2></div>
              <div className="grid">{more.map((x) => <LinkCard key={x.id} r={x} />)}</div>
            </div>
          </section>
        )}
        <section className="cta-band">
          <div className="in">
            <h2>Et toi, qu'est-ce qu'il y a dans ton frigo ?</h2>
            <p>Dis-le à Fricette : elle te trouve parmi {carnet().length} recettes celles que tu peux faire tout de suite.</p>
            <a className="cta" href="/#frigo">Voir ce que je peux cuisiner</a>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
