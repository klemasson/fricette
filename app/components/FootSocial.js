"use client";
// Bas de page : réseaux sociaux et bouton « Une idée ? Un souci ? ».
import Feedback from "./Feedback";
import { useFeatures } from "@/lib/features-client";

export const INSTAGRAM = "https://www.instagram.com/fricette.ch/";
export const TIKTOK = "https://www.tiktok.com/@fricette.ch";

export default function FootSocial() {
  const f = useFeatures();
  if (!f.reseaux && !f.feedback) return null;
  return (
    <div className="in foot-social">
      {f.reseaux ? <span className="foot-net">
        <span>Suis-nous :</span>
        <a href={INSTAGRAM} target="_blank" rel="noopener me">Instagram</a>
        <a href={TIKTOK} target="_blank" rel="noopener me">TikTok</a>
        <span className="muted">@fricette.ch</span>
      </span> : <span />}
      {f.feedback && <Feedback />}
    </div>
  );
}
