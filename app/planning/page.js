import { SiteHeader, SiteFooter } from "@/app/components/Site";
import PlanningClient from "./PlanningClient";

export const metadata = { title: "Planning de la semaine – Fricette", robots: { index: false } };

export default function Planning() {
  return (
    <>
      <SiteHeader />
      <main className="in listing planning-page">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Planning</span></p>
        <h1>Planning de la semaine</h1>
        <PlanningClient />
      </main>
      <SiteFooter />
    </>
  );
}
