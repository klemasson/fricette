"use client";
import { useState } from "react";

const when = (t) => new Date(t).toLocaleString("fr-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function TipsAdmin({ pending: p0, online: o0 }) {
  const [pending, setPending] = useState(p0);
  const [online, setOnline] = useState(o0);
  async function act(x, action) {
    if (action === "supprimer" && !window.confirm("Supprimer cette astuce ?")) return;
    const r = await fetch(`/api/astuces/${x.id}`, action === "supprimer" ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!r.ok) return window.alert("Ça n'a pas marché. Recharge la page.");
    setPending((l) => l.filter((y) => y.id !== x.id));
    setOnline((l) => l.filter((y) => y.id !== x.id));
    if (action === "valider") setOnline((l) => [{ ...x, reports: 0 }, ...l]);
    if (action === "masquer") setPending((l) => [x, ...l]);
  }
  const Item = ({ x, children }) => (
    <li>
      <div className="fb-top"><a href={`/recette/${x.recipe}`}><strong>{x.titre}</strong></a><small>{x.prenom || "sans prénom"} · {x.email || "compte supprimé"} · {when(x.created)}</small></div>
      <p>{x.texte}</p>
      {x.reports > 0 && <small className="flag">⚠ signalée {x.reports} fois</small>}
      <div className="fb-act">{children}</div>
    </li>
  );
  return (
    <section style={{ marginTop: 36 }} id="astuces">
      <h2>💡 Astuces à valider ({pending.length})</h2>
      {pending.length === 0 ? <p className="muted">Rien à valider.</p> : (
        <ul className="fb-list">{pending.map((x) => (
          <Item key={x.id} x={x}>
            <button className="btn small" type="button" onClick={() => act(x, "valider")}>✓ Publier</button>
            <button className="link" type="button" onClick={() => act(x, "supprimer")}>Supprimer</button>
          </Item>
        ))}</ul>
      )}
      <h3 style={{ marginTop: 22 }}>Astuces en ligne ({online.length})</h3>
      {online.length === 0 ? <p className="muted">Aucune pour l'instant.</p> : (
        <ul className="fb-list">{online.map((x) => (
          <Item key={x.id} x={x}>
            <button className="link" type="button" onClick={() => act(x, "masquer")}>Masquer</button>
            <button className="link" type="button" onClick={() => act(x, "supprimer")}>Supprimer</button>
          </Item>
        ))}</ul>
      )}
    </section>
  );
}
