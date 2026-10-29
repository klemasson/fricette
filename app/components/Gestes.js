"use client";
// Boutons « Voir le geste » sous une étape, avec la vidéo qui s'ouvre sur place.
import { useEffect, useState } from "react";
import { gestesOf } from "@/data/gestes";

let promise = null;
export function useVideos() {
  const [v, setV] = useState({});
  useEffect(() => {
    promise ||= fetch("/api/gestes").then((r) => r.json()).then((d) => d.videos || {}).catch(() => ({}));
    let alive = true;
    promise.then((x) => alive && setV(x));
    return () => { alive = false; };
  }, []);
  return v;
}

export function Player({ id, title }) {
  return (
    <div className="player">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`}
        title={title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
      />
    </div>
  );
}

export default function Gestes({ step, videos, big = false }) {
  const [open, setOpen] = useState(null);
  const list = gestesOf(step, videos);
  useEffect(() => setOpen(null), [step]);
  if (!list.length) return null;
  return (
    <div className={"gestes" + (big ? " big" : "")}>
      <div className="gestes-btns">
        {list.map((g) => (
          <button key={g.key} type="button" className={"geste-btn" + (open === g.key ? " on" : "")} onClick={() => setOpen(open === g.key ? null : g.key)} aria-expanded={open === g.key}>
            <span aria-hidden="true">{open === g.key ? "■" : "▶"}</span> {big ? (open === g.key ? "Fermer la vidéo" : `Voir le geste : ${g.label.toLowerCase()}`) : g.label}
          </button>
        ))}
      </div>
      {open && <Player id={videos[open].id} title={videos[open].titre} />}
    </div>
  );
}
