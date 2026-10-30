import { ingredientPages, capital } from "@/lib/carnet-server";
import { familyOf } from "@/data/colors";
import { Ico } from "@/app/components/bits";
import { SiteHeader, SiteFooter } from "@/app/components/Site";

export const metadata = {
  title: "Que faire avec… ? Idées de recettes par ingrédient – Fricette",
  description: "Un reste de courgette, du riz, des œufs ? Trouve des recettes anti-gaspi classées par ingrédient, avec les quantités.",
  alternates: { canonical: "/avec" },
};

export default function AvecIndex() {
  const list = ingredientPages();
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Idées par ingrédient</span></p>
        <h1>Que faire avec… ?</h1>
        <p className="lead">Choisis l'ingrédient qui traîne dans ton frigo : voici toutes les recettes du carnet pour l'utiliser. Voir aussi les <a href="/idees">idées par thème</a> (rapide, petit budget, restes…) et le <a href="/saison">calendrier de saison</a>.</p>
        <div className="ing-index">
          {list.map((p) => (
            <a key={p.cle} href={`/avec/${p.slug}`} className="ing-pill">
              <Ico fam={familyOf(p.cle)} rot={0} />
              <span>{capital(p.nom)}</span>
              <small>{p.n}</small>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
