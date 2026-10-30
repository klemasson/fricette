"use client";
// Bouton « Une idée ? Un souci ? » : petit formulaire envoyé à l'équipe.
import { useEffect, useRef, useState } from "react";
import { me } from "@/lib/client";

export default function Feedback({ label = "Une idée ? Un souci ?" }) {
  const dlg = useRef(null);
  const [f, setF] = useState({ kind: "idee", message: "", email: "", site: "" });
  const [state, setState] = useState({ busy: false, err: "", done: false });
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const open = () => openIt();
    window.addEventListener("frc:feedback", open);
    return () => window.removeEventListener("frc:feedback", open);
  });

  function openIt() {
    setState({ busy: false, err: "", done: false });
    me().then((d) => setLogged(!!d.user));
    dlg.current?.showModal();
  }

  async function send(e) {
    e.preventDefault();
    setState({ busy: true, err: "", done: false });
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, page: location.pathname + location.search }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "L'envoi n'a pas marché.");
      setF((x) => ({ ...x, message: "" }));
      setState({ busy: false, err: "", done: true });
    } catch (err) {
      setState({ busy: false, err: err.message, done: false });
    }
  }

  return (
    <>
      <button type="button" className="fb-btn" onClick={openIt}>💬 {label}</button>
      <dialog ref={dlg} className="fb-dlg" onClick={(e) => e.target === dlg.current && dlg.current.close()}>
        {state.done ? (
          <div className="fb-in">
            <h2>Merci ! 🙏</h2>
            <p className="muted">Ton message est bien arrivé. On lit tout, promis.</p>
            <button type="button" className="btn" onClick={() => dlg.current.close()}>Fermer</button>
          </div>
        ) : (
          <form className="fb-in" onSubmit={send}>
            <h2>Une idée ? Un souci ?</h2>
            <p className="muted small">Une recette qui cloche, une fonction qui manque, un bug : dis-nous tout.</p>
            <div className="seg fb-kinds" role="group" aria-label="Type de message">
              {[["idee", "💡 Une idée"], ["souci", "🐞 Un souci"], ["autre", "💬 Autre"]].map(([k, t]) => (
                <button key={k} type="button" aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>{t}</button>
              ))}
            </div>
            <label className="field">Ton message
              <textarea required rows={5} maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder={f.kind === "souci" ? "Qu'est-ce qui ne marche pas ? Sur quelle page ?" : "Raconte…"} />
            </label>
            {!logged && (
              <label className="field">Ton e-mail <small>(facultatif, pour qu'on puisse te répondre)</small>
                <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
              </label>
            )}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} name="site" />
            {state.err && <p className="status err">{state.err}</p>}
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn" type="submit" disabled={state.busy}>{state.busy ? "Envoi…" : "Envoyer"}</button>
              <button className="link" type="button" onClick={() => dlg.current.close()}>Annuler</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
