import { ICON_SVG } from "@/lib/brand";

export default function Logo() {
  return (
    <a className="logo" href="/" aria-label="Fricette, accueil">
      <span className="logo-ico" dangerouslySetInnerHTML={{ __html: ICON_SVG() }} />
      <span className="logo-word" aria-hidden="true">fricette</span>
    </a>
  );
}
