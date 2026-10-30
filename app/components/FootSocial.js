// Bas de page : réseaux sociaux et bouton « Une idée ? Un souci ? ».
import Feedback from "./Feedback";

export const INSTAGRAM = "https://www.instagram.com/fricette.ch/";
export const TIKTOK = "https://www.tiktok.com/@fricette.ch";

export default function FootSocial() {
  return (
    <div className="in foot-social">
      <span className="foot-net">
        <span>Suis-nous :</span>
        <a href={INSTAGRAM} target="_blank" rel="noopener me">Instagram</a>
        <a href={TIKTOK} target="_blank" rel="noopener me">TikTok</a>
        <span className="muted">@fricette.ch</span>
      </span>
      <Feedback />
    </div>
  );
}
