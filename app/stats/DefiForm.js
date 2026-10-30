"use client";
import { useState } from "react";

export default function DefiForm({ defi, options }) {
  const [d, setD] = useState(defi);
  const [f, setF] = useState({ cle: defi.cle, titre: defi.choisi ? defi.titre : "", accroche: defi.choisi ? defi.accroche : "" });
  const [msg, setMsg] = useState("");

  async function save(body) {
    setMsg("");
    const r = await fetch("/api/admin/defi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const x = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(x.error || "Erreur.");
    setD(x);
    setMsg(body.auto ? "Retour au choix automatique." : "Défi enregistré pour cette semaine.");
  }

  return (
    <div className="defi-admin">
      <p className="muted small">Cette semaine : <strong>{d.titre}</strong> ({d.nom}, {d.n} recettes) · {d.choisi ? "choisi par toi" : "choisi automatiquement"}. Il change tout seul chaque lundi.</p>
      <form onSubmit={(e) => { e.preventDefault(); save(f); }} className="acc-form">
        <label className="field">Ingrédient à sauver
          <select value={f.cle} onChange={(e) => setF({ ...f, cle: e.target.value })}>
            {options.map((o) => <option key={o.cle} value={o.cle}>{o.nom} ({o.n})</option>)}
          </select>
        </label>
        <label className="field">Titre <small>(facultatif)</small>
          <input value={f.titre} maxLength={60} placeholder="ex. Sauve ton pain rassis" onChange={(e) => setF({ ...f, titre: e.target.value })} />
        </label>
        <label className="field">Petite phrase <small>(facultatif)</small>
          <input value={f.accroche} maxLength={200} onChange={(e) => setF({ ...f, accroche: e.target.value })} />
        </label>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn small" type="submit">Choisir pour cette semaine</button>
          {d.choisi && <button className="link" type="button" onClick={() => save({ auto: true })}>Revenir à l'automatique</button>}
        </div>
        {msg && <p className="status ok-msg">{msg}</p>}
      </form>
    </div>
  );
}
