"use client";
import { iconSvg } from "@/lib/art";

export function Ico({ fam, rot = -10 }) {
  return <span className="ico" dangerouslySetInnerHTML={{ __html: iconSvg(fam || "gris", rot) }} />;
}

export function Heart({ on }) {
  return (
    <svg className={"heart" + (on ? " on" : "")} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}

export function FavButton({ on, onClick, label = true }) {
  return (
    <button type="button" className={"fav" + (on ? " on" : "") + (label ? " labelled" : "")} aria-pressed={!!on}
      aria-label={on ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}>
      <Heart on={on} />{label && <span>{on ? "Dans mes favoris" : "Ajouter aux favoris"}</span>}
    </button>
  );
}

/** Petite icône de liste de courses (panier). */
export function Basket() {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 9zM8.5 9 12 4l3.5 5" />
    </svg>
  );
}

/** Note moyenne compacte : ★ 4,5 (12) */
export function StarAvg({ v }) {
  if (!v) return null;
  return <span className="star-avg" title={`${v[1]} avis`}>★ {String(v[0]).replace(".", ",")} <small>({v[1]})</small></span>;
}
