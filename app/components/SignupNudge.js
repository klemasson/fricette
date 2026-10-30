"use client";
// Invitation douce à créer un compte (jamais obligatoire) :
// après 3 recettes consultées, au premier favori ou après « Je l'ai cuisinée ».
// Seulement pour les visiteurs sans compte, une fois par visite, et plus pendant 14 jours si on la ferme.
import { useEffect, useState } from "react";
import { me } from "@/lib/client";

const TEXTS = {
  vues: ["Ton carnet anti-gaspi t'attend 📒", "Crée ton compte gratuit : ton frigo, tes favoris et ta liste de courses te suivent sur tous tes appareils."],
  favori: ["Ne perds pas tes favoris ❤️", "Pour l'instant, ils ne sont gardés que sur cet appareil. Avec un compte gratuit, tu les retrouves partout."],
  cuisine: ["Bravo pour ce plat ! 🌱", "Crée ton compte gratuit pour garder ton bilan anti-gaspi, gagner des badges et partager la photo de ton plat."],
};
const OFF = "frc-nudge-off";
const VIEWS = "frc-views";
const get = (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } };
const set = (k, v, s = localStorage) => { try { s.setItem(k, v); } catch {} };

/** À appeler depuis les composants : nudge("vue" | "favori" | "cuisine"). */
export function nudge(kind) {
  if (typeof window === "undefined") return;
  if (kind === "vue") {
    const n = Number(get(VIEWS) || 0) + 1;
    set(VIEWS, String(n));
    if (n !== 3 && n !== 10) return;
    kind = "vues";
  }
  // Le composant n'écoute peut-être pas encore (page en cours de chargement) : on garde la demande.
  if (!window.__frcNudgeReady) window.__frcNudgePending = kind;
  else window.dispatchEvent(new CustomEvent("frc:nudge", { detail: kind }));
}

export default function SignupNudge() {
  const [kind, setKind] = useState(null);

  useEffect(() => {
    let wait = null;
    const on = async (e) => {
      if (get("frc-nudge-shown", sessionStorage)) return;
      const off = Number(get(OFF) || 0);
      if (off && Date.now() - off < 14 * 86400000) return;
      const d = await me();
      if (d.user) return;
      set("frc-nudge-shown", "1", sessionStorage);
      // Si une fenêtre est ouverte (recette, mode cuisine), on attend qu'elle se ferme.
      const show = () => {
        if (document.querySelector("dialog[open], .cook, .scan")) return false;
        setKind(e.detail);
        return true;
      };
      clearInterval(wait);
      setTimeout(() => { if (!show()) wait = setInterval(() => show() && clearInterval(wait), 1000); }, 1200);
    };
    window.addEventListener("frc:nudge", on);
    window.__frcNudgeReady = true;
    if (window.__frcNudgePending) { on({ detail: window.__frcNudgePending }); window.__frcNudgePending = null; }
    return () => { window.removeEventListener("frc:nudge", on); window.__frcNudgeReady = false; clearInterval(wait); };
  }, []);

  if (!kind) return null;
  const [title, text] = TEXTS[kind] || TEXTS.vues;
  const close = () => { set(OFF, String(Date.now())); setKind(null); };
  return (
    <div className="nudge" role="dialog" aria-label="Créer un compte gratuit">
      <button type="button" className="nudge-x" onClick={close} aria-label="Fermer">×</button>
      <strong>{title}</strong>
      <p>{text}</p>
      <div className="nudge-act">
        <a className="cta small" href="/?connexion=creer" onClick={() => { try { if (location.pathname !== "/") sessionStorage.setItem("frc-after-login", location.pathname + location.hash); } catch {} }}>Créer mon compte gratuit</a>
        <button type="button" className="link" onClick={close}>Plus tard</button>
      </div>
      <small>Gratuit, sans publicité. Fricette reste utilisable sans compte.</small>
    </div>
  );
}
