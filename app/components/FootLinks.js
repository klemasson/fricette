"use client";
// Liens du bas de page (ceux des fonctions désactivées sont cachés).
import { useFeatures } from "@/lib/features-client";

export default function FootLinks() {
  const f = useFeatures();
  return (
    <span className="foot-links">
      <a href="/avec">Idées par ingrédient</a>
      <a href="/idees">Idées de recettes</a>
      <a href="/saison">Calendrier de saison</a>
      {f.defi && <a href="/defi">Défi de la semaine</a>}
      {f.photos && <a href="/realisations">Vos réalisations</a>}
      <a href="/gestes">Gestes en vidéo</a>
      <a href="/planning">Planning</a>
      <a href="/courses">Liste de courses</a>
      <a href="/conditions">Conditions</a>
    </span>
  );
}
