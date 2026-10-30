"use client";
import { useState } from "react";

export default function ConcoursAdmin({ months, lot: lot0, actif: actif0 }) {
  const [on, setOn] = useState(actif0);
  const [lot, setLot] = useState(lot0);
  const [win, setWin] = useState(Object.fromEntries(months.map((m) => [m.key, m.winner])));
  const [msg, setMsg] = useState("");
  const post = (body) => fetch("/api/admin/concours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  async function saveLot(e) {
    e.preventDefault();
    const r = await post({ lot });
    setMsg(r.ok ? "Lot enregistré." : "Erreur.");
  }
  async function toggle(v) {
    const r = await post({ actif: v });
    if (r.ok) setOn(v);
  }
  async function choose(key, id) {
    const r = await post({ mois: key, photo: id });
    if (r.ok) setWin((w) => ({ ...w, [key]: id }));
  }

  return (
    <section style={{ marginTop: 36 }} id="concours">
      <h2>🏆 Concours photo du mois</h2>
      <label className="switch" style={{ margin: "8px 0 4px" }}>
        <input type="checkbox" checked={on} onChange={(e) => toggle(e.target.checked)} />
        <span className="track" aria-hidden="true" />
        <strong>{on ? "Concours activé" : "Concours désactivé"}</strong>
      </label>
      <p className="muted small" style={{ marginTop: 0 }}>{on
        ? "Le concours est visible sur le site (page Concours, bandeau sur « Vos réalisations », mention dans le formulaire photo)."
        : "Rien n'apparaît sur le site. La page Concours indique « Pas de concours en ce moment ». Choisis d'abord le lot ci-dessous, puis active."}</p>
      <p className="muted small">Toutes les photos publiées pendant un mois participent. Au début du mois suivant, choisis la gagnante ici : elle s'affiche sur la page <a href="/concours">Concours</a>. Préviens la personne par e-mail (adresse visible dans la liste « En ligne » ci-dessus).</p>
      <form onSubmit={saveLot} className="acc-form" style={{ maxWidth: 520 }}>
        <label className="field">Lot à gagner (affiché sur le site : « … gagne <em>ton texte</em> »)
          <input value={lot} maxLength={140} onChange={(e) => setLot(e.target.value)} />
        </label>
        <button className="btn small" type="submit">Enregistrer le lot</button>
        {msg && <p className="status ok-msg">{msg}</p>}
      </form>
      {months.map((m) => (
        <div key={m.key} style={{ marginTop: 22 }}>
          <h3>{m.label} · {m.photos.length} participation{m.photos.length > 1 ? "s" : ""}</h3>
          {m.photos.length === 0 ? <p className="muted">Aucune photo publiée ce mois-là.</p> : (
            <ul className="gal">
              {m.photos.map((p) => (
                <li key={p.id} className={win[m.key] === p.id ? "win" : ""}>
                  <img src={`/api/realisations/${p.id}/image`} alt="" loading="lazy" />
                  <div className="gal-txt"><a href={`/recette/${p.recipe_id}#photos`}>{p.titre}</a><small>{p.prenom || "sans prénom"} · {p.email || ""}</small></div>
                  <div className="gal-act">
                    {win[m.key] === p.id
                      ? <><strong>🏆 Gagnante</strong><button className="link" type="button" onClick={() => choose(m.key, "")}>Annuler</button></>
                      : <button className="ghost small" type="button" onClick={() => choose(m.key, p.id)}>Choisir comme gagnante</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
