"use client";
import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function EmailEditor({ initial, custom, email }) {
  const [v, setV] = useState({ sujet: initial.sujet, texte: initial.texte });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function send(body, okText) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur");
      setMsg({ ok: true, text: okText });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  }

  return (
    <div className="editor">
      <div className="editor-help">
        <strong>Comment écrire</strong>
        <span><code>### Titre</code> petit titre · <code>**gras**</code> · <code>- texte</code> liste · <code>[texte du lien](/defi)</code> lien vers une page du site · une ligne vide sépare les paragraphes.</span>
      </div>
      <label className="field">Objet de l'e-mail
        <input value={v.sujet} maxLength={150} onChange={(e) => setV({ ...v, sujet: e.target.value })} />
      </label>
      <div className="editor-cols">
        <label className="field">Texte
          <textarea rows={26} value={v.texte} onChange={(e) => setV({ ...v, texte: e.target.value })} spellCheck />
        </label>
        <div className="field">Aperçu
          <div className="legal-body editor-preview mail-preview">
            <p className="muted small" style={{ margin: "0 0 10px" }}><strong>Objet :</strong> {v.sujet}</p>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(v.texte) }} />
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="cta" type="button" disabled={busy} onClick={() => send({ value: v }, "Enregistré ! Les prochains inscrits recevront ce texte.")}>Enregistrer</button>
        <button className="ghost" type="button" disabled={busy} onClick={() => send({ value: v, test: true }, `Enregistré et envoyé en test à ${email}.`)}>M'envoyer un test</button>
        {custom && <button className="link" type="button" disabled={busy} onClick={() => { if (window.confirm("Revenir au texte d'origine ? Tes modifications seront perdues.")) send({ reset: true }, "Texte d'origine rétabli. Recharge la page pour le voir ici."); }}>Revenir au texte d'origine</button>}
      </div>
      {msg && <p className={"status " + (msg.ok ? "ok-msg" : "err")}>{msg.text}</p>}
    </div>
  );
}
