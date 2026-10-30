import { notFound } from "next/navigation";
import { collections, collection } from "@/lib/collections";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import LinkCard from "@/app/components/LinkCard";

export const dynamicParams = false;
export function generateStaticParams() {
  return collections().map((c) => ({ slug: c.slug }));
}

const MAX = 48;

export async function generateMetadata({ params }) {
  const c = collection((await params).slug);
  if (!c) return {};
  return {
    title: `${c.titre} : ${c.recettes.length} idées anti-gaspi – Fricette`,
    description: `${c.intro} ${c.recettes.length} recettes avec les quantités.`.slice(0, 300),
    alternates: { canonical: `/idees/${c.slug}` },
  };
}

export default async function CollectionPage({ params }) {
  const c = collection((await params).slug);
  if (!c) notFound();
  const shown = c.recettes.slice(0, MAX);
  const others = collections().filter((x) => x.slug !== c.slug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.titre,
    itemListElement: shown.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `https://fricette.ch/recette/${r.id}` })),
  };
  return (
    <>
      <SiteHeader />
      <main>
        <div className="in listing">
          <p className="crumbs"><a href="/">Accueil</a> › <a href="/idees">Idées de recettes</a> › <span>{c.titre}</span></p>
          <h1>{c.h1}</h1>
          <p className="lead">{c.intro}</p>
          <p className="muted small">{c.recettes.length} recettes{c.recettes.length > MAX ? `, voici les ${MAX} premières` : ""}. Pour voir celles que tu peux faire avec ce que tu as, <a href="/#frigo">remplis ton frigo</a>.</p>
        </div>
        <section className="recipes" aria-label={c.titre}>
          <div className="in">
            <div className="grid">{shown.map((r) => <LinkCard key={r.id} r={r} />)}</div>
          </div>
        </section>
        <div className="in listing">
          <div className="tagline">
            <span>Autres idées :</span>
            {others.map((o) => <a key={o.slug} className="f" href={`/idees/${o.slug}`}>{o.titre}</a>)}
          </div>
        </div>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
