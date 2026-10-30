// Modération des photos des réalisations (administrateurs).
import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { photosByStatus } from "@/lib/db";
import { getRecipe } from "@/lib/carnet-server";
import Moderate from "./Moderate";
import ConcoursAdmin from "./ConcoursAdmin";
import TipsAdmin from "./TipsAdmin";
import { tipsByStatus } from "@/lib/db";
import { entries, lot, monthKey, monthLabel, prevMonth, winner, actif } from "@/lib/concours";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Photos à valider – Fricette", robots: { index: false } };

const row = (p) => ({ id: p.id, recipe: p.recipe_id, titre: getRecipe(p.recipe_id)?.titre || p.recipe_id, prenom: p.prenom, texte: p.texte, email: p.email, reports: p.reports, created: p.created, status: p.status });

const tipRow = (t) => ({ id: t.id, recipe: t.recipe_id, titre: getRecipe(t.recipe_id)?.titre || t.recipe_id, prenom: t.prenom, texte: t.texte, email: t.email, reports: t.reports, created: t.created });

export default async function AdminPhotos() {
  const admin = await currentAdmin();
  if (!admin) {
    const user = await currentUser();
    return (
      <>
        <SiteHeader />
        <main className="in listing">
          <h1>Photos à valider</h1>
          <p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : <>Connecte-toi d'abord : <a href="/?connexion=1">se connecter</a>.</>}</p>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <p className="crumbs"><a href="/stats">Statistiques</a> › <span>Photos des réalisations</span></p>
        <h1>Photos, astuces et concours</h1>
        <p className="lead">Les photos et astuces envoyées n'apparaissent sur le site qu'une fois validées ici. Ce qui est signalé 3 fois revient automatiquement dans « À valider ».</p>
        <p className="tagline"><a className="f" href="#astuces">Astuces</a><a className="f" href="#concours">Concours du mois</a></p>
        <Moderate pending={photosByStatus("attente").map(row)} online={photosByStatus("ok", 120).map(row)} />
        <TipsAdmin pending={tipsByStatus("attente").map(tipRow)} online={tipsByStatus("ok", 100).map(tipRow)} />
        <ConcoursAdmin actif={actif()} lot={lot()} months={[prevMonth(monthKey()), monthKey()].map((key) => {
          const emails = new Map(getDb().prepare("SELECT id, email FROM users").all().map((u) => [u.id, u.email]));
          return {
            key, label: monthLabel(key), winner: winner(key)?.id || "",
            photos: entries(key).map((p) => ({ id: p.id, recipe_id: p.recipe_id, prenom: p.prenom, email: emails.get(p.user_id) || "", titre: getRecipe(p.recipe_id)?.titre || p.recipe_id })),
          };
        })} />
      </main>
    </>
  );
}
