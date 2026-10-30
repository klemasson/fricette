// Calendrier des fruits et légumes de saison en Suisse.
import { CALENDRIER, LEGUMES, FRUITS } from "@/data/calendrier";
import { MONTHS, daily } from "@/lib/season";
import { carnet, ingredientPages } from "@/lib/carnet-server";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import LinkCard from "@/app/components/LinkCard";

export const revalidate = 86400;
export const metadata = {
  title: "Calendrier des fruits et légumes de saison en Suisse – Fricette",
  description: "Quels fruits et légumes sont de saison en Suisse ce mois-ci ? Le calendrier mois par mois, avec des recettes anti-gaspi pour chacun.",
  alternates: { canonical: "/saison" },
};

function Items({ keys, table, pages }) {
  return (
    <ul className="cal-items">
      {keys.map((k) => {
        const [nom, cle, imp] = table[k];
        const p = pages.get(cle);
        return <li key={k} className={imp ? "imp" : ""}>{p ? <a href={`/avec/${p.slug}`}>{nom}</a> : nom}</li>;
      })}
    </ul>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function Month({ k, now, pages }) {
  return (
    <section id={`mois-${k}`} className={"cal-month" + (now ? " now" : "")}>
      <h2>{cap(MONTHS[k - 1])}{now && <small> · ce mois-ci</small>}</h2>
      <div className="cal-cols">
        <div><div className="label">🥕 Légumes</div><Items keys={CALENDRIER[k].legumes} table={LEGUMES} pages={pages} /></div>
        <div><div className="label">🍎 Fruits</div><Items keys={CALENDRIER[k].fruits} table={FRUITS} pages={pages} /></div>
      </div>
    </section>
  );
}

export default function Saison() {
  const now = new Date();
  const m = Number(now.toLocaleDateString("en-CA", { timeZone: "Europe/Zurich", month: "numeric" }));
  const pages = new Map(ingredientPages().map((p) => [p.cle, p]));
  const idees = daily(carnet(), now).seasonal.filter((r) => r.photo).slice(0, 8);
  const order = Array.from({ length: 12 }, (_, i) => ((m - 1 + i) % 12) + 1);
  return (
    <>
      <SiteHeader />
      <main>
        <div className="in listing">
          <p className="crumbs"><a href="/">Accueil</a> › <span>Calendrier de saison</span></p>
          <h1>Fruits et légumes de saison en Suisse</h1>
          <p className="lead">Manger de saison, c'est meilleur, moins cher et plus local. Voici ce qu'on trouve au marché, mois par mois. Touche un produit pour voir les recettes qui l'utilisent.</p>
          <nav className="cal-nav" aria-label="Mois">
            {order.map((k) => <a key={k} href={`#mois-${k}`} className={"f" + (k === m ? " on" : "")}>{MONTHS[k - 1]}</a>)}
          </nav>
          <Month k={m} now pages={pages} />
        </div>
        {idees.length > 0 && (
          <section className="recipes" aria-label="Recettes de saison">
            <div className="in">
              <div className="sec"><h2>Recettes de saison en {MONTHS[m - 1]}</h2></div>
              <div className="grid">{idees.map((r) => <LinkCard key={r.id} r={r} />)}</div>
            </div>
          </section>
        )}
        <div className="in listing">
          {order.slice(1).map((k) => <Month key={k} k={k} pages={pages} />)}
          <p className="muted small" style={{ marginTop: 20 }}>Calendrier indicatif pour la production suisse (plein champ ou conservation). Les dates varient selon la météo et les régions.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
