"use client";
// Mes badges anti-gaspi (page Mon compte).
import { useEffect, useState } from "react";
import { getList, loadLocal } from "@/lib/client";
import { badges } from "@/lib/badges";

export default function Badges() {
  const [list, setL] = useState(null);
  const [extra, setExtra] = useState({});
  const [all, setAll] = useState(false);
  useEffect(() => {
    setL(loadLocal("frc-cuisine", []));
    getList("cuisine").then(setL);
    getList("prefs").then((p) => setExtra({ photo: !!p?.photo }));
    const on = (e) => setL(e.detail);
    window.addEventListener("frc:cuisine", on);
    return () => window.removeEventListener("frc:cuisine", on);
  }, []);
  if (!list) return null;
  const b = badges(list, extra);
  const ok = b.filter((x) => x.ok);
  const next = b.filter((x) => !x.ok).sort((a, c) => c.progres - a.progres);
  const shown = all ? next : next.slice(0, 4);
  return (
    <section className="acc-card" id="badges">
      <h2>Mes badges <small className="muted">{ok.length} / {b.length}</small></h2>
      {ok.length > 0 ? (
        <ul className="badges">
          {ok.map((x) => <li key={x.id} className="on" title={x.comment}><span className="b-emo">{x.emoji}</span><strong>{x.nom}</strong></li>)}
        </ul>
      ) : <p className="muted">Aucun badge pour l'instant. Cuisine une recette et appuie sur « Je l'ai cuisinée » pour décrocher le premier !</p>}
      {next.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 14 }}>Prochains badges</div>
          <ul className="badges next">
            {shown.map((x) => (
              <li key={x.id}>
                <span className="b-emo">{x.emoji}</span>
                <span><strong>{x.nom}</strong><small>{x.comment}</small>
                  <span className="b-bar"><span style={{ width: `${Math.round(x.progres * 100)}%` }} /></span></span>
              </li>
            ))}
          </ul>
          {next.length > 4 && <button type="button" className="link small" onClick={() => setAll((v) => !v)}>{all ? "Voir moins" : `Voir les ${next.length} badges à gagner`}</button>}
        </>
      )}
    </section>
  );
}
