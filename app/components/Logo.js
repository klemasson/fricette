import { ICON_SVG, TOMATO_SVG } from "@/lib/brand";

export default function Logo() {
  return (
    <a className="logo" href="/" aria-label="Fricette, accueil">
      <span className="logo-ico" dangerouslySetInnerHTML={{ __html: ICON_SVG() }} />
      <span className="logo-word" aria-hidden="true">fr<span className="logo-i">ı<span className="logo-dot" dangerouslySetInnerHTML={{ __html: TOMATO_SVG }} /></span>cette</span>
    </a>
  );
}
