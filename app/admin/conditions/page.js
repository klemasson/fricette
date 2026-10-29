import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { pageGet } from "@/lib/db";
import { DEFAULT_CONDITIONS } from "@/data/conditions-default";
import Editor from "./Editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modifier les conditions – Fricette", robots: { index: false } };

export default async function EditConditions() {
  const admin = await currentAdmin();
  if (!admin) {
    const user = await currentUser();
    return (
      <>
        <SiteHeader />
        <main className="in listing">
          <h1>Modifier les conditions</h1>
          <p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : <>Connecte-toi d'abord : <a href="/?connexion=1">se connecter</a>.</>}</p>
        </main>
      </>
    );
  }
  const saved = pageGet("conditions");
  return (
    <>
      <SiteHeader />
      <main className="in listing admin-edit">
        <p className="crumbs"><a href="/stats">Statistiques</a> › <span>Modifier les conditions</span></p>
        <h1>Modifier les conditions</h1>
        <Editor initial={{ ...DEFAULT_CONDITIONS, ...(saved || {}) }} custom={!!saved} />
      </main>
    </>
  );
}
