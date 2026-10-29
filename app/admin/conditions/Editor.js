"use client";
import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function Editor({ initial, custom }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function send(body) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: "conditions", ...body }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur");
      setMsg({ ok: true, text: body.reset ? "Texte d'origine rétabli. Recharge la page pour le voir ici." : "Enregistré ! C'est déjà en ligne sur fricette.ch/conditions." });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  }

  return (
    <div className="editor">
      <div className="editor-help">
        <strong>Comment écrire</strong>
        <span><code>## Titre</code> nouvelle section · <code>### Sous-titre</code> · <code>- texte</code> liste à puces · <code>**gras**</code> · <code>[texte du lien](https://…)</code> · une ligne vide sépare les paragraphes.</span>
      </div>
      <label className="field">Phrase d'introduction
        <input value={v.intro} onChange={set("intro")} />
      </label>
      <label className="field">Encadré « En bref » <small>(une ligne = un point)</small>
        <textarea rows={5} value={v.bref} onChange={set("bref")} />
      </label>
      <div className="editor-cols">
        <label className="field">Texte de la page
          <textarea rows={28} value={v.texte} onChange={set("texte")} spellCheck />
        </label>
        <div className="field">Aperçu
          <div className="legal-body editor-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(v.texte) }} />
        </div>
      </div>
      <div className="actions">
        <button className="cta" type="button" disabled={busy} onClick={() => send({ value: v })}>Enregistrer et publier</button>
        <a className="ghost" href="/conditions" target="_blank" rel="noreferrer">Voir la page</a>
        {custom && <button className="link" type="button" disabled={busy} onClick={() => { if (window.confirm("Revenir au texte d'origine ? Tes modifications seront perdues.")) send({ reset: true }); }}>Revenir au texte d'origine</button>}
      </div>
      {msg && <p className={"status " + (msg.ok ? "ok-msg" : "err")}>{msg.text}</p>}
    </div>
  );
}
