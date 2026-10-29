import { SiteHeader, SiteFooter } from "@/app/components/Site";
import { Ico } from "@/app/components/bits";
import { DEFAULT_CONDITIONS } from "@/data/conditions-default";
import { renderMarkdown } from "@/lib/markdown";
import { pageGet } from "@/lib/db";

export const dynamic = "force-dynamic"; // le texte peut être modifié depuis /admin/conditions

export const metadata = {
  title: "Conditions et confidentialité – Fricette",
  description: "Qui édite Fricette, comment fonctionne le service et ce que nous faisons (et ne faisons pas) de tes données.",
  alternates: { canonical: "/conditions" },
};

const FAMS = ["vert", "jaune", "bleu", "rouge", "orange", "rose"];

export default function Conditions() {
  let c = DEFAULT_CONDITIONS;
  try { c = { ...DEFAULT_CONDITIONS, ...(pageGet("conditions") || {}) }; } catch {}
  const bref = String(c.bref || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <SiteHeader />
      <main className="in legal">
        <p className="crumbs"><a href="/">Accueil</a> › <span>Conditions et confidentialité</span></p>
        <h1>Conditions et confidentialité</h1>
        {c.intro && <p className="lead">{c.intro}</p>}

        <div className="legal-grid">
          <aside className="legal-bref" aria-label="En bref">
            <div className="label">En bref</div>
            <ul>
              {bref.map((t, i) => <li key={i}><Ico fam={FAMS[i % FAMS.length]} rot={0} />{t}</li>)}
            </ul>
            <p className="muted small">Une question ? <a href="mailto:bonjour@fricette.ch">bonjour@fricette.ch</a></p>
          </aside>
          <div className="legal-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.texte) }} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
