import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { pageGet } from "@/lib/db";
import { welcomeContent } from "@/lib/welcome";
import EmailEditor from "./EmailEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-mails – Fricette", robots: { index: false } };

export default async function AdminEmails() {
  const admin = await currentAdmin();
  if (!admin) {
    const user = await currentUser();
    return (
      <>
        <SiteHeader />
        <main className="in listing">
          <h1>E-mails</h1>
          <p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : <>Connecte-toi d'abord : <a href="/?connexion=1">se connecter</a>.</>}</p>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader />
      <main className="in listing admin-edit">
        <p className="crumbs"><a href="/stats">Statistiques</a> › <span>E-mail de bienvenue</span></p>
        <h1>E-mail de bienvenue</h1>
        <p className="lead">Envoyé automatiquement, une seule fois, à chaque personne qui crée un compte.</p>
        <EmailEditor initial={welcomeContent()} custom={!!pageGet("email-bienvenue")} email={admin.email} />
      </main>
    </>
  );
}
