// Défi anti-gaspi de la semaine (même ingrédient du lundi au dimanche, pour tout le monde).
import { DEFIS } from "@/data/defis";
import { kvGet, kvSet } from "./db";
import { ingredientPages } from "./carnet-server";

/** Numéro de semaine ISO, sous la forme « 2026-W44 ». */
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

function override(week) {
  try {
    const o = JSON.parse(kvGet("defi") || "null");
    return o && o.semaine === week ? o : null;
  } catch { return null; }
}

export function currentDefi(d = new Date()) {
  const week = weekKey(d);
  const pages = new Map(ingredientPages().map((p) => [p.cle, p]));
  const list = DEFIS.filter((x) => pages.has(x.cle));
  const n = Number(week.slice(0, 4)) * 53 + Number(week.slice(6));
  const auto = list[n % list.length];
  const o = override(week);
  const base = o && pages.has(o.cle) ? { ...(DEFIS.find((x) => x.cle === o.cle) || {}), ...o } : auto;
  const p = pages.get(base.cle);
  return {
    semaine: week,
    cle: base.cle,
    slug: p.slug,
    nom: p.nom,
    n: p.n,
    titre: base.titre || `Sauve ${p.nom}`,
    accroche: base.accroche || "",
    choisi: !!o,
  };
}

export function setDefi(value) {
  kvSet("defi", value ? JSON.stringify({ ...value, semaine: weekKey() }) : "");
}
