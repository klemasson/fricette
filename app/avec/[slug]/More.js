"use client";
// Affiche les recettes par paquets de 24 : la page s'ouvre vite, même pour « œufs » (245 recettes).
import { useState } from "react";

export default function More({ total, step = 24, children }) {
  const [n, setN] = useState(step);
  const items = Array.isArray(children) ? children : [children];
  return (
    <>
      <div className="grid">{items.slice(0, n)}</div>
      {n < total && (
        <div className="more-row">
          <button type="button" className="ghost" onClick={() => setN((x) => x + step)}>Voir {Math.min(step, total - n)} recettes de plus</button>
          <span className="muted small">{n} sur {total}</span>
        </div>
      )}
    </>
  );
}
