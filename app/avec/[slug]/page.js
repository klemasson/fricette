import { notFound } from "next/navigation";
import { ingredientPages, recipesWith, cleOf, capital } from "@/lib/carnet-server";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import LinkCard from "@/app/components/LinkCard";

export const dynamicParams = false;
export function generateStaticParams() {
  return ingredientPages().map((p) => ({ slug: p.slug }));
}

function find(slug) {
  return ingredientPages().find((p) => p.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const p = find((await params).slug);
  if (!p) return {};
  const n = recipesWith(p.cle).length;
  return {
    title: `${capital(p.nom)} : ${n} idées de recettes anti-gaspi – Fricette`,
    description: `Que faire avec ${p.nom} ? ${n} recettes faciles avec les quantités, pour finir ce qui traîne dans ton frigo.`,
    alternates: { canonical: `/avec/${p.slug}` },
  };
}

const GROUPS = [
  ["Plats", ["plat"]],
  ["Soupes, salades et entrées", ["soupe", "salade", "entree", "accompagnement", "apero"]],
  ["Sucré", ["dessert", "petit-dejeuner", "gouter"]],
];

export default async function AvecPage({ params }) {
  const p = find((await params).slug);
  if (!p) notFound();
  const list = recipesWith(p.cle);
  const others = ingredientPages().filter((x) => x.cle !== p.cle).sort((a, b) => b.n - a.n).slice(0, 14);
  return (
    <>
      <SiteHeader />
      <main>
        <div className="in listing">
          <p className="crumbs"><a href="/">Accueil</a> › <a href="/avec">Idées par ingrédient</a> › <span>{capital(p.nom)}</span></p>
          <p className="kicker">Que faire avec…</p>
          <h1>{capital(p.nom)}</h1>
          <p className="lead">{list.length} recettes du carnet utilisent cet ingrédient. Pour en trouver avec tout ce que tu as, <a href="/#frigo">remplis ton frigo</a>.</p>
        </div>
        {GROUPS.map(([label, cats]) => {
          const rs = list.filter((r) => cats.includes(r.categorie));
          if (!rs.length) return null;
          return (
            <section key={label} className="recipes" aria-label={label}>
              <div className="in">
                <div className="sec"><h2>{label}</h2><span>{rs.length} recette{rs.length > 1 ? "s" : ""}</span></div>
                <div className="grid">{rs.map((r) => <LinkCard key={r.id} r={r} />)}</div>
              </div>
            </section>
          );
        })}
        <div className="in listing">
          <div className="tagline">
            <span>Autres ingrédients :</span>
            {others.map((o) => <a key={o.cle} className="f" href={`/avec/${o.slug}`}>{o.nom}</a>)}
            <a className="f" href="/avec">Tous →</a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
