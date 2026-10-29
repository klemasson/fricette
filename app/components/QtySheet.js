"use client";
// Fenêtre pour préciser un ingrédient du frigo : quantité (avec − / +), unité, date limite.
import { useEffect, useRef, useState } from "react";

const UNITS_MAIN = ["pièce", "g", "kg", "ml", "l", "tranche", "pot", "boîte"];
const UNITS_MORE = ["cl", "botte", "gousse", "c. à s.", "c. à c."];
const STEP = { g: 50, ml: 50, kg: 0.5, l: 0.5, cl: 10 };
const iso = (plus) => { const d = new Date(); d.setDate(d.getDate() + plus); return d.toLocaleDateString("sv-SE"); };
const EXP = [["Aucune", null], ["Aujourd'hui", 0], ["Demain", 1], ["3 jours", 3], ["1 semaine", 7]];

export default function QtySheet({ item, defaultUnit, onSave, onRemove, onClose }) {
  const [qte, setQte] = useState(item.qte ?? "");
  const [unite, setUnite] = useState(item.unite || defaultUnit || "pièce");
  const [exp, setExp] = useState(item.exp || "");
  const [more, setMore] = useState(UNITS_MORE.includes(item.unite));
  const box = useRef(null);

  useEffect(() => {
    box.current?.showModal?.();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const step = STEP[unite] || 1;
  const num = qte === "" ? 0 : Number(qte);
  const bump = (d) => setQte(String(Math.max(0, Math.round((num + d * step) * 100) / 100)));
  const save = () => { onSave({ qte: qte === "" ? null : Number(qte), unite: qte === "" ? "" : unite, exp: exp || undefined }); };

  return (
    <dialog className="qty-sheet" ref={box} onClose={onClose} onClick={(e) => { if (e.target === box.current) box.current.close(); }}>
      <form method="dialog" className="qty-body" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="qty-head">
          <strong>{item.nom}</strong>
          <button type="button" className="x" onClick={() => box.current.close()} aria-label="Fermer">×</button>
        </div>

        <div className="qty-label">Combien en as-tu ?</div>
        <div className="stepper">
          <button type="button" onClick={() => bump(-1)} aria-label="Moins">−</button>
          <input type="number" inputMode="decimal" min="0" step="any" value={qte} placeholder="?" onChange={(e) => setQte(e.target.value)} aria-label="Quantité" />
          <button type="button" onClick={() => bump(1)} aria-label="Plus">+</button>
        </div>
        <div className="unit-chips" role="group" aria-label="Unité">
          {(more ? [...UNITS_MAIN, ...UNITS_MORE] : UNITS_MAIN).map((u) => (
            <button key={u} type="button" aria-pressed={unite === u} onClick={() => setUnite(u)}>{u}</button>
          ))}
          {!more && <button type="button" className="more" onClick={() => setMore(true)}>autre…</button>}
        </div>
        <p className="qty-help">Laisse vide si tu ne sais pas : Fricette fera sans.</p>

        <div className="qty-label">À finir avant</div>
        <div className="unit-chips" role="group" aria-label="Date limite">
          {EXP.map(([l, d]) => {
            const v = d == null ? "" : iso(d);
            return <button key={l} type="button" aria-pressed={exp === v} onClick={() => setExp(v)}>{l}</button>;
          })}
          <label className="date-pick">
            <span>{exp && !EXP.some(([, d]) => d != null && iso(d) === exp) ? exp.split("-").reverse().join(".") : "Autre date"}</span>
            <input type="date" value={exp} min={iso(-2)} onChange={(e) => setExp(e.target.value)} aria-label="Choisir une date" />
          </label>
        </div>

        <div className="qty-actions">
          <button type="button" className="link danger-link" onClick={onRemove}>Retirer du frigo</button>
          <button type="submit" className="cta">OK</button>
        </div>
      </form>
    </dialog>
  );
}
