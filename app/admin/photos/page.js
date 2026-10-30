// Modération des photos des réalisations (administrateurs).
import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { photosByStatus } from "@/lib/db";
import { getRecipe } from "@/lib/carnet-server";
import Moderate from "./Moderate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Photos à valider – Fricette", robots: { index: false } };

const row = (p) => ({ id: p.id, recipe: p.recipe_id, titre: getRecipe(p.recipe_id)?.titre || p.recipe_id, prenom: p.prenom, texte: p.texte, email: p.email, reports: p.reports, created: p.created, status: p.status });

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
        <h1>Photos des réalisations</h1>
        <p className="lead">Les photos envoyées n'apparaissent sur le site qu'une fois validées ici. Une photo signalée 3 fois revient automatiquement dans « À valider ».</p>
        <Moderate pending={photosByStatus("attente").map(row)} online={photosByStatus("ok", 120).map(row)} />
      </main>
    </>
  );
}
