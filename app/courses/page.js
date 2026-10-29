import { SiteHeader, SiteFooter } from "@/app/components/Site";
import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "Ma liste de courses – Fricette",
  robots: { index: false },
};

export default function CoursesPage() {
  return (
    <>
      <SiteHeader />
      <main className="in listing courses-page">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Liste de courses</span></p>
        <h1>Ma liste de courses</h1>
        <CoursesClient />
      </main>
      <SiteFooter />
    </>
  );
}
