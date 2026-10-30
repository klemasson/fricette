"use client";
// « Astuces des membres » : variantes, remplacements, conseils, sous chaque recette.
import { useEffect, useState } from "react";

const when = (t) => new Date(t).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" });

export default function Astuces({ recipeId }) {
  const [list, setList] = useState(null);
  const [logged, setLogged] = useState(false);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ texte: "", prenom: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function load() {
    try {
      const d = await fetch(`/api/astuces?recette=${encodeURIComponent(recipeId)}`, { cache: "no-store" }).then((r) => r.json());
      setList(d.astuces || []);
      setLogged(!!d.user);
    } catch { setList([]); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recipeId]);
  useEffect(() => { try { const p = localStorage.getItem("frc-prenom"); if (p) setF((x) => ({ ...x, prenom: p })); } catch {} }, []);

  async function send(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/astuces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recette: recipeId, ...f }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "L'envoi n'a pas marché.");
      try { localStorage.setItem("frc-prenom", f.prenom); } catch {}
      setF((x) => ({ ...x, texte: "" }));
      setOpen(false);
      setMsg({ text: d.attente ? "Merci ! 💡 Ton astuce apparaîtra ici dès qu'elle aura été relue." : "Astuce publiée !" });
      load();
    } catch (err) { setMsg({ err: true, text: err.message }); }
    finally { setBusy(false); }
  }

  async function act(t, action) {
    if (action === "supprimer") {
      if (!window.confirm("Supprimer cette astuce ?")) return;
      await fetch(`/api/astuces/${t.id}`, { method: "DELETE" });
      return load();
    }
    await fetch(`/api/astuces/${t.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setMsg({ text: "Merci, nous allons relire cette astuce." });
  }

  const items = list || [];
  return (
    <section className="tips" aria-labelledby={`tips-${recipeId}`}>
      <div className="real-head">
        <h3 id={`tips-${recipeId}`}>💡 Astuces des membres{items.filter((t) => !t.attente).length ? <small> · {items.filter((t) => !t.attente).length}</small> : null}</h3>
        {!open && (logged
          ? <button type="button" className="chip" onClick={() => { setOpen(true); setMsg(null); }}>Donner mon astuce</button>
          : <a className="chip" href="/?connexion=1" onClick={() => { try { sessionStorage.setItem("frc-after-login", `/recette/${recipeId}#photos`); } catch {} }}>Donner mon astuce</a>)}
      </div>
      {list && items.length === 0 && !open && <p className="muted small">Tu as changé un ingrédient, ajouté une épice, trouvé un raccourci ? Partage-le avec les autres.</p>}
      {items.length > 0 && (
        <ul className="tips-list">
          {items.map((t) => (
            <li key={t.id} className={t.attente ? "wait" : ""}>
              <p>{t.texte}</p>
              <div className="tips-meta">
                <span><strong>{t.prenom || "Un·e membre"}</strong> · {when(t.created)}{t.attente && " · en attente de relecture"}</span>
                <span className="real-acts">
                  {t.mine && <button type="button" className="link" onClick={() => act(t, "supprimer")}>Supprimer</button>}
                  {!t.attente && !t.mine && <button type="button" className="link" onClick={() => act(t, "signaler")}>Signaler</button>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <form className="tips-form" onSubmit={send}>
          <label className="field">Ton astuce
            <textarea required rows={3} minLength={10} maxLength={400} value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} placeholder="ex. J'ai remplacé la crème par du yaourt grec, encore meilleur !" />
          </label>
          <label className="field">Ton prénom <small>(facultatif)</small>
            <input value={f.prenom} maxLength={30} onChange={(e) => setF({ ...f, prenom: e.target.value })} placeholder="ex. Léa" />
          </label>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer mon astuce"}</button>
            <button className="link" type="button" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </form>
      )}
      {msg && <p className={"status " + (msg.err ? "err" : "ok-msg")} role="status">{msg.text}</p>}
    </section>
  );
}
