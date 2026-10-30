"use client";
// Bilan anti-gaspi : recettes cuisinées et aliments sauvés (estimation).
import { useEffect, useState } from "react";
import { getList, loadLocal, bilan } from "@/lib/client";

const kg = (g) => (g >= 1000 ? `${(g / 1000).toFixed(1).replace(".", ",")} kg` : `${Math.round(g)} g`);

export default function Bilan({ compact = false }) {
  const [list, setL] = useState(null);
  useEffect(() => {
    setL(loadLocal("frc-cuisine", []));
    getList("cuisine").then(setL);
    const on = (e) => setL(e.detail);
    window.addEventListener("frc:cuisine", on);
    return () => window.removeEventListener("frc:cuisine", on);
  }, []);
  if (!list) return null;
  const b = bilan(list);
  if (compact) {
    if (!b.n) return null;
    return (
      <a className="bilan-strip" href="/compte#bilan">
        <span aria-hidden="true">🌱</span>
        {b.mois.n
          ? <>Ce mois-ci : <strong>{kg(b.mois.g)}</strong> d'aliments sauvés (≈ {b.mois.chf} CHF) · {b.mois.n} recette{b.mois.n > 1 ? "s" : ""}</>
          : <>Depuis le début : <strong>{kg(b.g)}</strong> d'aliments sauvés (≈ {b.chf} CHF)</>}
      </a>
    );
  }
  return (
    <section className="acc-card" id="bilan">
      <h2>Mon bilan anti-gaspi</h2>
      {b.n === 0 ? (
        <p className="muted">Quand tu cuisines une recette, appuie sur « Je l'ai cuisinée » : Fricette calcule ce que tu as sauvé de la poubelle.</p>
      ) : (
        <>
          <div className="bilan-grid">
            <div><strong>{kg(b.mois.g)}</strong><span>sauvés ce mois-ci</span></div>
            <div><strong>≈ {b.mois.chf} CHF</strong><span>économisés ce mois-ci</span></div>
            <div><strong>{b.n}</strong><span>recette{b.n > 1 ? "s" : ""} cuisinée{b.n > 1 ? "s" : ""} au total</span></div>
            <div><strong>{kg(b.g)} · ≈ {b.chf} CHF</strong><span>sauvés depuis le début</span></div>
          </div>
          <p className="muted small">Estimation à partir des ingrédients de ton frigo utilisés dans les recettes, avec des prix moyens suisses par aliment.</p>
          {list.length > 0 && (
            <ul className="bilan-last">
              {list.slice(-5).reverse().map((x, k) => (
                <li key={k}><a href={x.id ? `/recette/${x.id}` : "#"}>{x.titre}</a><span>{x.date.split("-").reverse().join(".")} · {kg(x.g)}</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
