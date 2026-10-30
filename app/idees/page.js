import { collections } from "@/lib/collections";
import { SiteHeader, SiteFooter } from "@/app/components/Site";

export const metadata = {
  title: "Idées de recettes : rapides, petit budget, restes… – Fricette",
  description: "Recettes en 15 minutes, petit budget, avec 3 ingrédients, que faire avec des restes de pâtes, de riz ou de raclette : toutes nos sélections anti-gaspi.",
  alternates: { canonical: "/idees" },
};

export default function Idees() {
  const list = collections();
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Idées de recettes</span></p>
        <h1>Idées de recettes</h1>
        <p className="lead">Des sélections toutes prêtes, selon ton temps, ton budget, ton régime ou tes restes. Pour partir de ce qu'il y a dans ton frigo, utilise <a href="/#frigo">Mon frigo</a> ; pour un ingrédient précis, <a href="/avec">Que faire avec…</a>.</p>
        <div className="coll-index">
          {list.map((c) => (
            <a key={c.slug} href={`/idees/${c.slug}`} className="coll-card">
              <span className="coll-imgs">{c.recettes.filter((r) => r.photo).slice(0, 3).map((r) => <img key={r.id} src={r.photo} alt="" loading="lazy" />)}</span>
              <strong>{c.titre}</strong>
              <small>{c.recettes.length} recettes</small>
            </a>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 18 }}>Toutes les photos de recettes sont générées par IA.</p>
      </main>
      <SiteFooter />
    </>
  );
}
