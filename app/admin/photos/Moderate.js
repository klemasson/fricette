"use client";
import { useState } from "react";

const when = (t) => new Date(t).toLocaleString("fr-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Moderate({ pending: p0, online: o0 }) {
  const [pending, setPending] = useState(p0);
  const [online, setOnline] = useState(o0);
  const [busy, setBusy] = useState("");

  async function act(x, action) {
    if (action === "supprimer" && !window.confirm("Supprimer définitivement cette photo ?")) return;
    setBusy(x.id);
    const r = await fetch(`/api/realisations/${x.id}`, action === "supprimer"
      ? { method: "DELETE" }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy("");
    if (!r.ok) return window.alert("Ça n'a pas marché. Recharge la page.");
    setPending((l) => l.filter((y) => y.id !== x.id));
    setOnline((l) => l.filter((y) => y.id !== x.id));
    if (action === "valider") setOnline((l) => [{ ...x, reports: 0 }, ...l]);
    if (action === "masquer") setPending((l) => [x, ...l]);
  }

  const Card = ({ x, children }) => (
    <li>
      <a href={`/api/realisations/${x.id}/image`} target="_blank" rel="noreferrer"><img src={`/api/realisations/${x.id}/image`} alt="" loading="lazy" /></a>
      <div className="gal-txt">
        <a href={`/recette/${x.recipe}#photos`}>{x.titre}</a>
        {x.texte && <span>« {x.texte} »</span>}
        <small>{x.prenom || "sans prénom"} · {x.email || "compte supprimé"} · {when(x.created)}</small>
        {x.reports > 0 && <small className="flag">⚠ signalée {x.reports} fois</small>}
      </div>
      <div className="gal-act">{children}</div>
    </li>
  );

  return (
    <>
      <h2 style={{ marginTop: 28 }}>À valider ({pending.length})</h2>
      {pending.length === 0 ? <p className="muted">Rien à valider. 🎉</p> : (
        <ul className="gal">
          {pending.map((x) => (
            <Card key={x.id} x={x}>
              <button className="btn small" type="button" disabled={busy === x.id} onClick={() => act(x, "valider")}>✓ Publier</button>
              <button className="ghost small" type="button" disabled={busy === x.id} onClick={() => act(x, "supprimer")}>Supprimer</button>
            </Card>
          ))}
        </ul>
      )}
      <h2 style={{ marginTop: 36 }}>En ligne ({online.length})</h2>
      {online.length === 0 ? <p className="muted">Aucune photo publiée pour l'instant.</p> : (
        <ul className="gal">
          {online.map((x) => (
            <Card key={x.id} x={x}>
              <button className="ghost small" type="button" disabled={busy === x.id} onClick={() => act(x, "masquer")}>Masquer</button>
              <button className="ghost small" type="button" disabled={busy === x.id} onClick={() => act(x, "supprimer")}>Supprimer</button>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
