"use client";
// « Ils l'ont faite » : photos des plats partagées par les visiteurs, sous chaque recette.
import { useEffect, useRef, useState } from "react";
import { shareStory } from "@/lib/story";
import { getList as getUserList, setList as setUserList } from "@/lib/client";

/** Réduit la photo dans le navigateur (1280 px max) : envoi rapide, même depuis un téléphone. */
async function shrink(file) {
  const MAX = 1280;
  let img;
  try {
    img = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Impossible de lire cette photo. Essaie en JPEG."));
      i.src = URL.createObjectURL(file);
    });
  }
  const w0 = img.width || img.naturalWidth, h0 = img.height || img.naturalHeight;
  const k = Math.min(1, MAX / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * k);
  c.height = Math.round(h0 * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const blob = (type, q) => new Promise((ok) => c.toBlob(ok, type, q));
  let b = await blob("image/webp", 0.82);
  if (!b || b.type !== "image/webp") b = await blob("image/jpeg", 0.85); // anciens Safari
  return b;
}

const when = (t) => new Date(t).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" });

export default function Realisations({ recipeId, title, recipe }) {
  const [list, setList] = useState(null);
  const [logged, setLogged] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ file: null, preview: "", prenom: "", texte: "", accord: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [concours, setConcours] = useState(false);
  const input = useRef(null);

  async function load() {
    try {
      const d = await fetch(`/api/realisations?recette=${encodeURIComponent(recipeId)}`, { cache: "no-store" }).then((r) => r.json());
      setList(d.photos || []);
      setLogged(!!d.user);
    } catch { setList([]); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [recipeId]);
  useEffect(() => { fetch("/api/concours").then((r) => r.json()).then((d) => setConcours(!!d.actif)).catch(() => {}); }, []);
  useEffect(() => {
    try { const p = localStorage.getItem("frc-prenom"); if (p) setForm((f) => ({ ...f, prenom: p })); } catch {}
  }, []);
  // Bouton « 📸 Ma photo » en haut de la recette : on descend ici et on ouvre le formulaire.
  useEffect(() => {
    const on = (e) => {
      if (e.detail !== recipeId) return;
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (logged) { setOpen(true); setMsg(null); }
      else setMsg({ text: "Pour partager ta photo, il faut un compte gratuit : touche « Partager ma photo » pour te connecter." });
    };
    window.addEventListener("frc:photo-open", on);
    return () => window.removeEventListener("frc:photo-open", on);
  }, [recipeId, logged]);

  useEffect(() => {
    if (!view) return;
    const k = (e) => e.key === "Escape" && setView(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [view]);

  function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg({ err: true, text: "Choisis une photo." });
    setMsg(null);
    setForm((f) => ({ ...f, file, preview: URL.createObjectURL(file) }));
  }

  async function send(e) {
    e.preventDefault();
    if (!form.file) return setMsg({ err: true, text: "Choisis d'abord une photo." });
    if (!form.accord) return setMsg({ err: true, text: "Coche la case pour confirmer que la photo est la tienne." });
    setBusy(true);
    setMsg(null);
    try {
      const small = await shrink(form.file);
      const fd = new FormData();
      fd.append("photo", small, small.type === "image/webp" ? "photo.webp" : "photo.jpg");
      fd.append("recette", recipeId);
      fd.append("prenom", form.prenom);
      fd.append("texte", form.texte);
      fd.append("accord", "1");
      const r = await fetch("/api/realisations", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "L'envoi n'a pas marché. Réessaie.");
      try { localStorage.setItem("frc-prenom", form.prenom); } catch {}
      try { const p = (await getUserList("prefs")) || {}; if (!p.photo) await setUserList("prefs", { ...p, photo: true }); } catch {} // badge « Photographe »
      setForm((f) => ({ ...f, file: null, preview: "", texte: "", accord: false }));
      setOpen(false);
      setMsg({ text: d.attente ? "Merci ! 🎉 Ta photo apparaîtra ici dès qu'elle aura été vérifiée (en général dans la journée)." : "Photo publiée !" });
      load();
    } catch (err) {
      setMsg({ err: true, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function act(p, action) {
    if (action === "supprimer") {
      if (!window.confirm("Supprimer cette photo ?")) return;
      await fetch(`/api/realisations/${p.id}`, { method: "DELETE" });
      setView(null);
      return load();
    }
    await fetch(`/api/realisations/${p.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setView(null);
    setMsg({ text: "Merci, nous allons regarder cette photo." });
  }

  const photos = list || [];
  return (
    <section className="real" id="photos" aria-labelledby={`real-${recipeId}`}>
      <div className="real-head">
        <h3 id={`real-${recipeId}`}>📸 Ils l'ont faite{photos.filter((p) => !p.attente).length ? <small> · {photos.filter((p) => !p.attente).length}</small> : null}</h3>
        {!open && (logged
          ? <button type="button" className="chip strong" onClick={() => { setOpen(true); setMsg(null); setTimeout(() => input.current?.click(), 50); }}>Partager ma photo</button>
          : <a className="chip strong" href={`/?connexion=1`} onClick={() => { try { sessionStorage.setItem("frc-after-login", `/recette/${recipeId}#photos`); } catch {} }}>Partager ma photo</a>)}
      </div>

      {list && photos.length === 0 && !open && <p className="muted small">Pas encore de photo. Tu l'as cuisinée ? Montre-nous le résultat !{!logged && " (Il faut un compte gratuit.)"}</p>}

      {photos.length > 0 && (
        <ul className="real-grid">
          {photos.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setView(p)} aria-label={`Voir la photo${p.prenom ? " de " + p.prenom : ""}`}>
                <img src={`/api/realisations/${p.id}/image`} alt={p.texte || `Réalisation de ${title}`} loading="lazy" />
                {p.attente && <span className="real-wait">En attente de validation</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form className="real-form" onSubmit={send}>
          <input ref={input} type="file" accept="image/*" onChange={pick} hidden />
          <button type="button" className="real-pick" onClick={() => input.current?.click()}>
            {form.preview ? <img src={form.preview} alt="Aperçu de ta photo" /> : <span>📷 Prendre ou choisir une photo</span>}
          </button>
          <div className="real-fields">
            <label className="field">Ton prénom <small>(facultatif)</small>
              <input value={form.prenom} maxLength={30} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} placeholder="ex. Léa" />
            </label>
            <label className="field">Un mot sur ta version <small>(facultatif)</small>
              <input value={form.texte} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))} placeholder="ex. J'ai ajouté du piment, top !" />
            </label>
            <label className="check">
              <input type="checkbox" checked={form.accord} onChange={(e) => setForm((f) => ({ ...f, accord: e.target.checked }))} />
              <span>C'est ma photo, elle ne montre personne de reconnaissable, et j'accepte qu'elle soit publiée sur Fricette (<a href="/conditions#photos" target="_blank">conditions</a>).</span>
            </label>
            {concours && <p className="muted small" style={{ margin: 0 }}>🏆 Ta photo participe au <a href="/concours" target="_blank">concours du mois</a>.</p>}
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn" type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer ma photo"}</button>
              <button className="link" type="button" onClick={() => { setOpen(false); setMsg(null); }}>Annuler</button>
            </div>
          </div>
        </form>
      )}
      {msg && <p className={"status " + (msg.err ? "err" : "ok-msg")} role="status">{msg.text}</p>}

      {view && (
        <div className="real-view" role="dialog" aria-modal="true" aria-label="Photo d'une réalisation" onClick={() => setView(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={`/api/realisations/${view.id}/image`} alt={view.texte || `Réalisation de ${title}`} />
            <figcaption>
              <span><strong>{view.prenom || "Un·e cuisinier·ère"}</strong> · {when(view.created)}{view.texte && <><br />« {view.texte} »</>}</span>
              <span className="real-acts">
                {view.mine && <button type="button" className="link" onClick={() => act(view, "supprimer")}>Supprimer</button>}
                {!view.attente && recipe && <button type="button" className="link" onClick={() => shareStory({ r: recipe, photo: `/api/realisations/${view.id}/image`, kicker: "Fait maison avec Fricette", by: view.prenom })}>Partager en story</button>}
                {!view.attente && <button type="button" className="link" onClick={() => act(view, "signaler")}>Signaler</button>}
                <button type="button" className="btn small" onClick={() => setView(null)}>Fermer</button>
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
