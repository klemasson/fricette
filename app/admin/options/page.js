import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { features } from "@/lib/features";
import Options from "./Options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Options du site – Fricette", robots: { index: false } };

export default async function AdminOptions() {
  const admin = await currentAdmin();
  if (!admin) {
    const user = await currentUser();
    return (<><SiteHeader /><main className="in listing"><h1>Options du site</h1><p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : <>Connecte-toi d'abord : <a href="/?connexion=1">se connecter</a>.</>}</p></main></>);
  }
  return (
    <>
      <SiteHeader />
      <main className="in listing">
        <p className="crumbs"><a href="/stats">Statistiques</a> › <span>Options du site</span></p>
        <h1>Options du site</h1>
        <p className="lead">Active ou désactive chaque fonction. C'est immédiat : une option coupée disparaît du site (une page déjà ouverte se met à jour au prochain chargement). Rien n'est effacé, tu peux la rallumer quand tu veux.</p>
        <Options initial={features()} />
      </main>
    </>
  );
}
