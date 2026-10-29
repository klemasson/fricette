"use client";
// Partie vivante de la page d'une recette : nombre de personnes, comparaison avec ton frigo, favoris.
import { useEffect, useMemo, useState } from "react";
import RecipeBody from "@/app/components/RecipeBody";
import { pick } from "@/lib/match";
import { getList, getFavorites, setFavorite, loadLocal } from "@/lib/client";

export default function RecipeClient({ raw }) {
  const [personnes, setPersonnes] = useState(raw.portions);
  const [fridge, setFridge] = useState([]);
  const [favs, setFavs] = useState([]);

  useEffect(() => {
    const local = loadLocal("olf-frigo", null);
    if (Array.isArray(local)) setFridge(local);
    getList("frigo").then((f) => Array.isArray(f) && setFridge(f));
    getFavorites().then(setFavs);
    if (new URLSearchParams(window.location.search).has("imprimer")) setTimeout(() => window.print(), 900);
  }, []);

  const compare = fridge.length > 0;
  const r = useMemo(
    () => pick([raw], [raw.id], fridge, { personnes, basiques: true, placard: true })[0],
    [raw, fridge, personnes]
  );

  async function toggleFav(id) {
    const on = !favs.includes(id);
    setFavs((f) => (on ? [id, ...f] : f.filter((x) => x !== id)));
    try { setFavs(await setFavorite(id, on)); } catch { setFavs(favs); }
  }

  const controls = (
    <label className="chip select">
      <span className="sr">Nombre de personnes</span>
      <select value={personnes} onChange={(e) => setPersonnes(Number(e.target.value))} aria-label="Nombre de personnes">
        {[...new Set([1, 2, 3, 4, 6, 8, raw.portions])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>Pour {n}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <RecipeBody r={r} compare={compare} fav={favs.includes(raw.id)} onFav={toggleFav} controls={controls} titleTag="h1" />
      {compare && <p className="note">Comparé avec <a href="/#frigo">ton frigo</a> ({fridge.length} ingrédient{fridge.length > 1 ? "s" : ""}).</p>}
    </>
  );
}
