"use client";
import { useState } from "react";

const KINDS = { idee: "💡 Idée", souci: "🐞 Souci", autre: "💬 Message" };
const when = (t) => new Date(t).toLocaleString("fr-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Messages({ initial }) {
  const [list, setList] = useState(initial);
  async function act(m, body) {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, ...body }) });
    setList((l) => (body.supprimer ? l.filter((x) => x.id !== m.id) : l.map((x) => (x.id === m.id ? { ...x, lu: body.lu ? 1 : 0 } : x))));
  }
  if (!list.length) return <p className="muted">Aucun message pour l'instant.</p>;
  return (
    <ul className="fb-list">
      {list.map((m) => (
        <li key={m.id} className={m.lu ? "lu" : ""}>
          <div className="fb-top"><strong>{KINDS[m.kind] || "💬"}</strong><small>{when(m.created)}{m.page ? ` · ${m.page}` : ""}</small></div>
          <p>{m.message}</p>
          <div className="fb-act">
            {m.email ? <a href={`mailto:${m.email}?subject=${encodeURIComponent("Ton message sur Fricette")}`}>Répondre à {m.email}</a> : <small className="muted">Sans adresse e-mail</small>}
            <button className="link" type="button" onClick={() => act(m, { lu: !m.lu })}>{m.lu ? "Marquer non lu" : "Marquer comme lu"}</button>
            <button className="link" type="button" onClick={() => window.confirm("Supprimer ce message ?") && act(m, { supprimer: true })}>Supprimer</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
