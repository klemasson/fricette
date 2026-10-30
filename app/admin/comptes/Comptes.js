"use client";
import { useMemo, useState } from "react";

const date = (t) => (t ? new Date(t).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" }) : "—");
function ago(t) {
  if (!t) return "—";
  const d = Math.floor((Date.now() - t) / 86400000);
  return d <= 0 ? "aujourd'hui" : d === 1 ? "hier" : d < 30 ? `il y a ${d} j` : date(t);
}

export default function Comptes({ list }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("created");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list
      .filter((u) => !s || u.email.toLowerCase().includes(s))
      .sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  }, [list, q, sort]);

  return (
    <section className="st-box wide" style={{ marginTop: 14 }}>
      <div className="acc-toolbar">
        <input type="search" placeholder="Chercher une adresse…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher une adresse" />
        <label className="muted small">Trier par{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created">les plus récents</option>
            <option value="active">dernière activité</option>
            <option value="favs">favoris</option>
            <option value="photos">photos</option>
          </select>
        </label>
      </div>
      {rows.length === 0 ? <p className="muted">Aucun compte{q ? " ne correspond" : " pour l'instant"}.</p> : (
        <div className="acc-table-wrap">
          <table className="acc-table">
            <thead>
              <tr><th>Adresse</th><th>Créé le</th><th>Dernière activité</th><th>Favoris</th><th>Notes</th><th>Photos</th><th>Newsletter</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="em">{u.email}</td>
                  <td>{date(u.created)}</td>
                  <td>{ago(u.active)}</td>
                  <td>{u.favs || ""}</td>
                  <td>{u.notes || ""}</td>
                  <td>{u.photos || ""}</td>
                  <td>{u.news === 1 ? "✓" : u.news === 0 ? "non confirmée" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
