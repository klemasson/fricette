"use client";
import { useEffect, useRef, useState } from "react";
import { getCourses, coursesOp, loadLocal, me, sharedId, startShared, joinShared, leaveShared } from "@/lib/client";

export default function CoursesClient() {
  const [list, setL] = useState(null);
  const [user, setUser] = useState(null);
  const [shared, setShared] = useState(null);
  const [invite, setInvite] = useState(null); // id d'une liste reçue par lien
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [link, setLink] = useState("");
  const busy = useRef(false);

  const refresh = async () => { if (!busy.current) setL(await getCourses()); };

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const inv = qs.get("liste");
    setL(loadLocal("frc-courses", []));
    me().then((d) => setUser(d.user || null));
    setShared(sharedId());
    if (inv && /^[A-Za-z0-9_-]{16,40}$/.test(inv) && inv !== sharedId()) setInvite(inv);
    refresh();
    const on = (e) => setL(e.detail);
    window.addEventListener("frc:courses", on);
    return () => window.removeEventListener("frc:courses", on);
  }, []);

  // Liste partagée : on se met à jour toutes les 5 secondes (et en revenant sur l'onglet).
  useEffect(() => {
    if (!shared) return;
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), 5000);
    const vis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [shared]);

  async function op(o) {
    busy.current = true;
    try { setL(await coursesOp(o)); } finally { busy.current = false; }
  }

  function add(e) {
    e.preventDefault();
    const names = name.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    op({ op: "add", items: names.map((n) => ({ key: n.toLowerCase() + "|perso", nom: n, quantite: "", recette: "", recetteId: "", done: false })) });
    setName("");
  }

  async function sendText() {
    const text = groups(list.filter((x) => !x.done))
      .map(([g, items]) => `${g}\n` + items.map((x) => `– ${x.nom}${x.quantite ? ` (${x.quantite})` : ""}`).join("\n"))
      .join("\n\n");
    if (navigator.share) { try { await navigator.share({ title: "Liste de courses", text }); return; } catch (e) { if (e?.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(text); setMsg("Liste copiée : colle-la dans un message."); } catch { setMsg("Impossible de copier la liste."); }
  }

  async function shareFamily() {
    try {
      const url = shared ? `${location.origin}/courses?liste=${shared}` : await startShared();
      setShared(sharedId());
      setLink(url);
      if (navigator.share) { try { await navigator.share({ title: "Notre liste de courses Fricette", text: "Voici notre liste de courses commune :", url }); return; } catch (e) { if (e?.name === "AbortError") return; } }
      try { await navigator.clipboard.writeText(url); setMsg("Lien copié ! Envoie-le à ta famille."); } catch {}
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function accept() {
    const items = await joinShared(invite, true);
    setShared(invite); setInvite(null); setL(items);
    window.history.replaceState(null, "", "/courses");
    setMsg("Tu as rejoint la liste commune. Tout ce que vous cochez se met à jour chez chacun.");
  }

  async function leave() {
    await leaveShared(true);
    setShared(null); setLink("");
    setMsg("Tu as quitté la liste commune : tu gardes une copie sur cet appareil.");
  }

  if (!list) return <p className="empty">Chargement…</p>;
  const left = list.filter((x) => !x.done).length;

  return (
    <div className="courses">
      {invite && (
        <div className="invite">
          <strong>On t'a partagé une liste de courses</strong>
          <span>En la rejoignant, vous verrez tous les mêmes articles et ce que chacun coche, en direct.{list.length ? " Tes articles actuels y seront ajoutés." : ""}</span>
          <div className="actions" style={{ marginTop: 4 }}>
            <button className="cta small" type="button" onClick={accept}>Rejoindre la liste</button>
            <button className="link" type="button" onClick={() => { setInvite(null); window.history.replaceState(null, "", "/courses"); }}>Non merci</button>
          </div>
        </div>
      )}

      <p className="lead">
        {list.length === 0
          ? "Ta liste est vide. Ouvre une recette et appuie sur « Ajouter à mes courses » : les ingrédients qui te manquent arrivent ici."
          : `${left} article${left > 1 ? "s" : ""} à acheter${list.length - left ? `, ${list.length - left} déjà dans le panier` : ""}.`}
        {" "}
        <span className="muted">
          {shared ? "👨‍👩‍👧 Liste commune : elle se met à jour chez tous ceux qui ont le lien."
            : user ? "Synchronisée avec ton compte." : <>Enregistrée sur cet appareil. <a href="/?connexion=1">Connecte-toi</a> pour la retrouver sur ton téléphone.</>}
        </span>
      </p>

      <form className="addrow simple" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ajouter un article (ex. lait, pain)" aria-label="Article à ajouter" />
        <button className="btn" type="submit">Ajouter</button>
      </form>

      {groups(list).map(([g, items, id]) => (
        <section key={g} className="c-group">
          <h2>{id ? <a href={`/recette/${id}`}>{g}</a> : g}</h2>
          <ul>
            {items.map((x) => (
              <li key={x.key} className={x.done ? "done" : ""}>
                <label>
                  <input type="checkbox" checked={!!x.done} onChange={() => op({ op: "toggle", key: x.key, done: !x.done })} />
                  <span className="c-name">{x.nom}</span>
                  {x.quantite && <span className="q">{x.quantite}</span>}
                </label>
                <button type="button" className="x" onClick={() => op({ op: "remove", key: x.key })} aria-label={`Retirer ${x.nom}`}>×</button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="actions">
        {list.length > 0 && <button className="cta" type="button" onClick={sendText}>Envoyer la liste</button>}
        <button className="ghost" type="button" onClick={shareFamily}>👨‍👩‍👧 {shared ? "Inviter quelqu'un" : "Partager avec ma famille"}</button>
        {list.some((x) => x.done) && <button className="ghost" type="button" onClick={() => op({ op: "clearDone" })}>Retirer les articles cochés</button>}
        {list.length > 0 && <button className="link" type="button" onClick={() => { if (window.confirm("Effacer toute la liste de courses ?")) op({ op: "clear" }); }}>Tout effacer</button>}
      </div>
      {link && <p className="share-link">Lien de la liste commune : <input readOnly value={link} onFocus={(e) => e.target.select()} /></p>}
      {shared && <p className="muted small">Toute personne qui a le lien peut voir et modifier cette liste. <button className="link" type="button" onClick={leave}>Quitter la liste commune</button></p>}
      <div className="toast" role="status">{msg}</div>
    </div>
  );
}

/** Regroupe par recette ; les articles ajoutés à la main vont dans « Divers ». */
function groups(list) {
  const map = new Map();
  for (const x of list) {
    const g = x.recette || "Divers";
    if (!map.has(g)) map.set(g, [g, [], x.recetteId]);
    map.get(g)[1].push(x);
  }
  return [...map.values()];
}
