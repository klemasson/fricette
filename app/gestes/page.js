import { GESTES } from "@/data/gestes";
import { videos } from "@/lib/videos";
import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { Player } from "@/app/components/Gestes";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Les gestes de base en vidéo – Fricette",
  description: "Émincer un oignon, ciseler des herbes, monter des blancs en neige… Les gestes de cuisine de base expliqués en courtes vidéos.",
  alternates: { canonical: "/gestes" },
};

export default async function GestesPage() {
  const v = await videos();
  const list = GESTES.filter((g) => v[g.key]?.ok);
  const hidden = GESTES.filter((g) => v[g.key] && !v[g.key].ok);
  return (
    <>
      <SiteHeader />
      <main className="in listing gestes-page">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Gestes en vidéo</span></p>
        <h1>Les gestes de base</h1>
        <p className="lead">Les techniques qui reviennent dans les recettes, en courtes vidéos. En mode cuisine, Fricette te propose la bonne vidéo au bon moment.</p>
        <div className="gestes-grid">
          {list.map((g) => (
            <section key={g.key} id={g.key} className="geste-card">
              <h2>{g.label}</h2>
              <Player id={v[g.key].id} title={v[g.key].titre} />
              <p className="muted small">{v[g.key].titre}{v[g.key].chaine ? ` · ${v[g.key].chaine}` : ""}</p>
            </section>
          ))}
        </div>
        {hidden.length > 0 && <p className="muted small">Vidéos indisponibles masquées : {hidden.map((g) => g.label).join(", ")}.</p>}
        <p className="muted small">Vidéos hébergées par YouTube et lues en mode « sans cookies », propriété de leurs auteurs.</p>
      </main>
      <SiteFooter />
    </>
  );
}
