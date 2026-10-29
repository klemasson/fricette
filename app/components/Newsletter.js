"use client";
import { useState } from "react";

export default function Newsletter({ compact = false, email: initial = "" }) {
  const [email, setEmail] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json().catch(() => ({}));
      setMsg({ text: r.ok ? d.message : d.error || "Une erreur est survenue.", err: !r.ok });
    } catch {
      setMsg({ text: "Connexion perdue.", err: true });
    }
    setBusy(false);
  }
  return (
    <form className={"news" + (compact ? " compact" : "")} onSubmit={submit}>
      {!compact && <strong>5 idées de saison, chaque lundi</strong>}
      {!compact && <span className="muted">Un e-mail par semaine, désinscription en un clic.</span>}
      {!(msg && !msg.err) && (
        <div className="news-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.ch" aria-label="Adresse e-mail pour la newsletter" />
          <button className="btn small" type="submit" disabled={busy}>S'inscrire</button>
        </div>
      )}
      {msg && <span className={msg.err ? "news-err" : "news-ok"} role="status">{msg.text}</span>}
    </form>
  );
}
