// Statistiques de Fricette, visibles seulement par les comptes listés dans le fichier
// ~/fricette-data/admins (une adresse e-mail par ligne).
import fs from "node:fs";
import { currentUser } from "@/lib/auth";
import { statsSince, dataPath } from "@/lib/db";
import { getRecipe } from "@/lib/carnet-server";
import { ingredientName } from "@/lib/match";
import { SiteHeader } from "@/app/components/Site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistiques – Fricette", robots: { index: false } };

function admins() {
  try {
    return fs.readFileSync(dataPath("admins"), "utf8").split(/\s+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

const dayStr = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" });
const title = (id) => getRecipe(id)?.titre || id;

function Top({ label, rows, fmt = (v) => v, extra }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="st-box">
      <h2>{label}</h2>
      {rows.length === 0 ? <p className="muted">Rien pour l'instant.</p> : (
        <ol className="st-list">
          {rows.map((r) => (
            <li key={r.value}>
              <span className="st-bar" style={{ width: `${(r.n / max) * 100}%` }} />
              <span className="st-v">{fmt(r.value)}{extra?.(r)}</span>
              <span className="st-n">{r.n}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function Stats({ searchParams }) {
  const user = await currentUser();
  const ok = user && admins().includes(user.email.toLowerCase());
  if (!ok) {
    return (
      <>
        <SiteHeader />
        <main className="in listing">
          <h1>Statistiques</h1>
          <p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : "Connecte-toi d'abord sur la page d'accueil."}</p>
        </main>
      </>
    );
  }
  const days = Math.min(365, Math.max(1, Number((await searchParams)?.jours) || 30));
  const since = dayStr(new Date(Date.now() - (days - 1) * 86400000));
  const s = statsSince(since);
  const total = s.visitors.reduce((a, b) => a + b.n, 0);
  const pages = s.top("page", 15);
  const views = pages.reduce((a, b) => a + b.n, 0);
  const vmax = Math.max(1, ...s.visitors.map((v) => v.n));

  return (
    <>
      <SiteHeader />
      <main className="in listing stats">
        <h1>Statistiques</h1>
        <p className="lead">
          {[7, 30, 90, 365].map((d) => <a key={d} className={"f" + (d === days ? " on" : "")} href={`/stats?jours=${d}`}>{d} jours</a>)}
        </p>
        <div className="st-kpis">
          <div><strong>{total}</strong><span>visiteurs·jour</span></div>
          <div><strong>{views}</strong><span>pages vues (top 15)</span></div>
          <div><strong>{s.users}</strong><span>comptes ({s.newUsers} nouveaux)</span></div>
        </div>
        <section className="st-box wide">
          <h2>Visiteurs par jour</h2>
          <div className="st-days">
            {s.visitors.map((v) => (
              <div key={v.day} title={`${v.day} : ${v.n}`}><span style={{ height: `${(v.n / vmax) * 100}%` }} /><small>{v.day.slice(8)}</small></div>
            ))}
          </div>
        </section>
        <div className="st-grid">
          <Top label="Recettes ouvertes" rows={s.top("open")} fmt={title} />
          <Top label="Ingrédients ajoutés au frigo" rows={s.top("ing")} fmt={ingredientName} />
          <Top label="Ingrédients inconnus du carnet" rows={s.top("unknown")} />
          <Top label="Pages vues" rows={pages} />
          <Top label="Venus de" rows={s.top("ref")} />
          <Top label="Mode cuisine" rows={s.top("cook", 10)} fmt={title} />
          <Top label="Ajouts à la liste de courses" rows={s.top("courses", 10)} fmt={title} />
          <Top label="Partages" rows={s.top("share", 10)} fmt={title} />
          <Top label="Favoris (depuis toujours)" rows={s.topFavs} fmt={title} />
          <Top label="Les plus notées" rows={s.topRated} fmt={title} extra={(r) => ` · ★ ${r.a}`} />
          <Top label="Mal notées : à revoir" rows={s.lowRated} fmt={title} extra={(r) => ` · ★ ${r.a}`} />
        </div>
        <p className="muted small">Comptage anonyme, sans cookie : un « visiteur·jour » est une personne différente un jour donné.</p>
      </main>
    </>
  );
}
