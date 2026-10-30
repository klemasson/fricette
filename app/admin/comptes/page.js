// Liste des comptes créés (administrateurs). Les mots de passe ne sont jamais affichés (ils sont chiffrés).
import { SiteHeader } from "@/app/components/Site";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/auth";
import { usersOverview } from "@/lib/db";
import Comptes from "./Comptes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comptes – Fricette", robots: { index: false } };

export default async function AdminComptes() {
  const admin = await currentAdmin();
  if (!admin) {
    const user = await currentUser();
    return (
      <>
        <SiteHeader />
        <main className="in listing">
          <h1>Comptes</h1>
          <p className="lead">Cette page est réservée à l'équipe de Fricette. {user ? "Ton compte n'a pas accès." : <>Connecte-toi d'abord : <a href="/?connexion=1">se connecter</a>.</>}</p>
        </main>
      </>
    );
  }
  const list = usersOverview();
  const day = 86400000, now = Date.now();
  const kpi = {
    total: list.length,
    week: list.filter((u) => now - u.created < 7 * day).length,
    month: list.filter((u) => now - u.created < 30 * day).length,
    actifs: list.filter((u) => u.active && now - u.active < 7 * day).length,
  };
  return (
    <>
      <SiteHeader />
      <main className="in listing stats">
        <p className="crumbs"><a href="/stats">Statistiques</a> › <span>Comptes</span></p>
        <h1 style={{ marginBottom: 18 }}>Comptes</h1>
        <div className="st-kpis">
          <div><strong>{kpi.total}</strong><span>comptes au total</span></div>
          <div><strong>{kpi.week}</strong><span>créés cette semaine</span></div>
          <div><strong>{kpi.month}</strong><span>créés ces 30 jours</span></div>
          <div><strong>{kpi.actifs}</strong><span>actifs ces 7 jours</span></div>
        </div>
        <Comptes list={list} />
        <p className="muted small" style={{ marginTop: 18 }}>
          Ces adresses servent uniquement à faire fonctionner les comptes. Comme l'indiquent les Conditions, tu ne peux pas les utiliser pour envoyer de la publicité :
          seuls les inscrits à la newsletter ont accepté de recevoir des e-mails.
        </p>
      </main>
    </>
  );
}
