// Le défi anti-gaspi de la semaine : explication, recettes, et « défi relevé » si on a cuisiné une recette du défi.
import { currentDefi } from "@/lib/defi";
import { recipesWith, capital } from "@/lib/carnet-server";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import LinkCard from "@/app/components/LinkCard";
import DefiStatus from "./DefiStatus";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Le défi anti-gaspi de la semaine – Fricette",
  description: "Chaque semaine, un ingrédient à sauver de la poubelle. Cuisine une recette avant dimanche et décroche ton badge.",
  alternates: { canonical: "/defi" },
};

function daysLeft() {
  const wd = new Date().toLocaleDateString("en-US", { timeZone: "Europe/Zurich", weekday: "short" });
  const i = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  return 6 - i; // 0 = dimanche
}

export default function Defi() {
  const d = currentDefi();
  const list = recipesWith(d.cle);
  const left = daysLeft();
  return (
    <>
      <SiteHeader />
      <main>
        <div className="in listing">
          <p className="crumbs"><a href="/">Accueil</a> › <span>Défi de la semaine</span></p>
          <p className="kicker">🏆 Défi anti-gaspi de la semaine</p>
          <h1>{d.titre}</h1>
          <p className="lead">{d.accroche || `Cette semaine, on sauve ${d.nom} de la poubelle.`} {left === 0 ? "Dernier jour : le défi se termine ce soir." : `Il te reste ${left + 1} jours, jusqu'à dimanche soir.`}</p>

          <ol className="defi-how">
            <li><b>1</b><span><strong>Choisis une recette</strong>parmi les {list.length} ci-dessous (ingrédient du défi : {d.nom}).</span></li>
            <li><b>2</b><span><strong>Cuisine-la</strong>avant dimanche soir, avec ce qui traîne dans ton frigo.</span></li>
            <li><b>3</b><span><strong>Appuie sur « ✓ Je l'ai cuisinée »</strong>le bouton se trouve sous le titre de la recette. Le défi est relevé et tu gagnes le badge 🏆 « Défi relevé ».</span></li>
          </ol>
          <DefiStatus semaine={d.semaine} />
          <p className="muted small">Un nouveau défi commence chaque lundi. Avec un compte gratuit, tes défis et tes badges sont gardés sur tous tes appareils.</p>
        </div>
        <section className="recipes" aria-label={`Recettes avec ${d.nom}`}>
          <div className="in">
            <div className="sec"><h2>Les recettes du défi</h2><span>{list.length} recettes avec {d.nom}</span></div>
            <div className="grid">{list.map((r) => <LinkCard key={r.id} r={r} />)}</div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
