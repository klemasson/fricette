"use client";
import { useState } from "react";
import { FEATURES } from "@/data/features";

export default function Options({ initial }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState("");
  async function toggle(k, v) {
    setF((x) => ({ ...x, [k]: v })); setSaving(k);
    const r = await fetch("/api/admin/features", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [k]: v }) });
    if (r.ok) setF(await r.json()); else setF((x) => ({ ...x, [k]: !v }));
    setSaving("");
  }
  const groups = [...new Set(FEATURES.map((x) => x[3]))];
  return (
    <div className="opts">
      {groups.map((g) => (
        <section key={g} className="st-box wide">
          <h2>{g}</h2>
          <ul className="opt-list">
            {FEATURES.filter((x) => x[3] === g).map(([k, nom, desc]) => (
              <li key={k}>
                <label className="switch">
                  <input type="checkbox" checked={!!f[k]} disabled={saving === k} onChange={(e) => toggle(k, e.target.checked)} />
                  <span className="track" aria-hidden="true" />
                  <span><strong>{nom}</strong> <span className={"opt-st " + (f[k] ? "on" : "")}>{f[k] ? "activé" : "désactivé"}</span><br /><span className="muted small">{desc}</span></span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
