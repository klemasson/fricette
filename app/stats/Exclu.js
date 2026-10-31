"use client";
import { useState } from "react";

export default function Exclu({ initial }) {
  const [on, setOn] = useState(initial);
  async function set(v) {
    const r = await fetch("/api/admin/exclure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exclu: v }) });
    if (r.ok) setOn(v);
  }
  return (
    <div className="exclu">
      <p><strong>{on ? "✓ Cet appareil n'est pas compté dans les statistiques." : "Cet appareil est compté dans les statistiques."}</strong></p>
      <p className="muted small">Tes visites ne sont jamais comptées quand tu es connecté·e avec ton compte. Un appareil sur lequel tu t'es connecté·e une fois reste exclu, même après déconnexion. Pour exclure un autre téléphone ou ordinateur, connecte-toi dessus une fois.</p>
      {on
        ? <button className="link" type="button" onClick={() => set(false)}>Compter à nouveau cet appareil</button>
        : <button className="btn small" type="button" onClick={() => set(true)}>Ne plus compter cet appareil</button>}
    </div>
  );
}
