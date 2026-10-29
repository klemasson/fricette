import { SiteHeader, SiteFooter } from "@/app/components/Site";
import CompteClient from "./CompteClient";

export const metadata = { title: "Mon compte – Fricette", robots: { index: false } };

export default function Compte() {
  return (
    <>
      <SiteHeader />
      <main className="in listing acc-page">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Mon compte</span></p>
        <h1>Mon compte</h1>
        <CompteClient />
      </main>
      <SiteFooter />
    </>
  );
}
