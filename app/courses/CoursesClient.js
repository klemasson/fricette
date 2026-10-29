"use client";
import { useEffect, useState } from "react";
import { getList, setList, loadLocal, me, share } from "@/lib/client";

export default function CoursesClient() {
  const [list, setL] = useState(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setL(loadLocal("frc-courses", []));
    getList("courses").then(setL);
    me().then((d) => setUser(d.user || null));
  }, []);

  const save = (next) => { setL(next); setList("courses", next); };
  const toggle = (key) => save(list.map((x) => (x.key === key ? { ...x, done: !x.done } : x)));
  const remove = (key) => save(list.filter((x) => x.key !== key));

  function add(e) {
    e.preventDefault();
    const names = name.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const next = [...list];
    for (const n of names) {
      const key = n.toLowerCase() + "|perso";
      if (!next.some((x) => x.key === key)) next.push({ key, nom: n, quantite: "", recette: "", recetteId: "", done: false });
    }
    save(next);
    setName("");
  }

  async function shareList() {
    const text = groups(list.filter((x) => !x.done))
      .map(([g, items]) => `${g}\n` + items.map((x) => `– ${x.nom}${x.quantite ? ` (${x.quantite})` : ""}`).join("\n"))
      .join("\n\n");
    if (navigator.share) { try { await navigator.share({ title: "Liste de courses", text }); return; } catch (e) { if (e?.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(text); setMsg("Liste copiée : colle-la dans un message."); } catch { setMsg("Impossible de copier la liste."); }
  }

  if (!list) return <p className="empty">Chargement…</p>;
  const left = list.filter((x) => !x.done).length;

  return (
    <div className="courses">
      <p className="lead">
        {list.length === 0
          ? "Ta liste est vide. Ouvre une recette et appuie sur « Ajouter à mes courses » : les ingrédients qui te manquent arrivent ici."
          : `${left} article${left > 1 ? "s" : ""} à acheter${list.length - left ? `, ${list.length - left} déjà dans le panier` : ""}.`}
        {" "}
        <span className="muted">
          {user ? "Synchronisée avec ton compte : elle te suit sur ton téléphone." : <>Enregistrée sur cet appareil. <a href="/">Connecte-toi</a> pour la retrouver sur ton téléphone.</>}
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
                  <input type="checkbox" checked={!!x.done} onChange={() => toggle(x.key)} />
                  <span className="c-name">{x.nom}</span>
                  {x.quantite && <span className="q">{x.quantite}</span>}
                </label>
                <button type="button" className="x" onClick={() => remove(x.key)} aria-label={`Retirer ${x.nom}`}>×</button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {list.length > 0 && (
        <div className="actions">
          <button className="cta" type="button" onClick={shareList}>Envoyer la liste</button>
          {list.some((x) => x.done) && <button className="ghost" type="button" onClick={() => save(list.filter((x) => !x.done))}>Retirer les articles cochés</button>}
          <button className="link" type="button" onClick={() => { if (confirmClear()) save([]); }}>Tout effacer</button>
        </div>
      )}
      <div className="toast" role="status">{msg}</div>
    </div>
  );
}

function confirmClear() {
  return typeof window !== "undefined" && window.confirm("Effacer toute la liste de courses ?");
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
