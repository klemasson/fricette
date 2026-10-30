"use client";
import { useEffect, useState } from "react";
import { getList, loadLocal } from "@/lib/client";

/** Affiche « Défi relevé » si une recette du défi de cette semaine a été cuisinée. */
export default function DefiStatus({ semaine }) {
  const [done, setDone] = useState(null);
  useEffect(() => {
    const check = (l) => setDone((Array.isArray(l) ? l : []).filter((x) => x.defi === semaine));
    check(loadLocal("frc-cuisine", []));
    getList("cuisine").then(check);
  }, [semaine]);
  if (!done) return null;
  return done.length ? (
    <p className="defi-status ok">✓ <strong>Défi relevé !</strong> Tu as cuisiné {done.map((x) => x.titre).join(", ")}. Bravo 🌱</p>
  ) : (
    <p className="defi-status">Pas encore relevé cette semaine. À toi de jouer !</p>
  );
}
