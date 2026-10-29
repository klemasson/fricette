"use client";
// Planning des repas : une recette par jour (et le midi si on veut), remplissage automatique
// à partir du frigo et de la saison, puis toutes les courses de la semaine en un clic.
import { useEffect, useMemo, useState } from "react";
import { getList, setList, loadLocal, isoDate, mondayOf, addToCourses, track } from "@/lib/client";
import { suggest, pick, norm, fmtQty } from "@/lib/match";
import { daily } from "@/lib/season";
import { artSvg } from "@/lib/art";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEALS = { plat: true };

export default function PlanningClient() {
  const [carnet, setCarnet] = useState(null);
  const [plan, setPlan] = useState(null);
  const [fridge, setFridge] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [week, setWeek] = useState(mondayOf());
  const [midi, setMidi] = useState(false);
  const [picking, setPicking] = useState(null); // { date, slot }
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/carnet.json").then((r) => r.json()).then(setCarnet).catch(() => setCarnet([]));
    setPlan(loadLocal("frc-planning", []));
    getList("planning").then(setPlan);
    getList("frigo").then((f) => setFridge(Array.isArray(f) ? f : []));
    getList("prefs").then((p) => { setPrefs(p || {}); if (p?.midi) setMidi(true); });
    const on = (e) => setPlan(e.detail);
    window.addEventListener("frc:planning", on);
    return () => window.removeEventListener("frc:planning", on);
  }, []);

  const opts = { personnes: prefs.personnes || 2, basiques: prefs.placard !== false, placard: prefs.placard !== false, regime: prefs.regime || "", sans: prefs.sans || [] };
  const byId = useMemo(() => new Map((carnet || []).map((r) => [r.id, r])), [carnet]);
  const dates = DAYS.map((_, i) => isoDate(new Date(week + "T12:00:00"), i));
  const slots = midi ? ["midi", "soir"] : ["soir"];
  const at = (date, slot) => plan?.find((x) => x.date === date && x.slot === slot);

  const save = (next) => { setPlan(next); setList("planning", next); };
  const set = (date, slot, id) => save([...(plan || []).filter((x) => !(x.date === date && x.slot === slot)), ...(id ? [{ date, slot, id }] : [])]);

  // Candidats : ce que permet le frigo (produits à finir en tête), puis des plats de saison.
  function candidates() {
    const fromFridge = fridge.length ? suggest(carnet, fridge, { ...opts, type: "plats" }).results.map((r) => r.id) : [];
    const season = daily(carnet).seasonal.filter((r) => r.categorie === "plat" && !(opts.sans || []).some((a) => r.allergenes?.includes(a))).map((r) => r.id);
    const all = carnet.filter((r) => r.categorie === "plat").map((r) => r.id).sort(() => Math.random() - 0.5);
    return [...new Set([...fromFridge.slice(0, 20), ...season, ...all])];
  }

  function fillWeek() {
    const used = new Set((plan || []).map((x) => x.id));
    const pool = candidates().filter((id) => !used.has(id));
    let next = [...(plan || [])];
    let k = 0;
    for (const date of dates) for (const slot of slots) {
      if (date < isoDate()) continue; // pas les jours passés
      if (next.some((x) => x.date === date && x.slot === slot)) continue;
      // un peu de hasard parmi les meilleures idées pour ne pas avoir toujours la même semaine
      const take = Math.min(pool.length - 1, k + Math.floor(Math.random() * 3));
      const [id] = pool.splice(Math.max(0, take), 1);
      if (id) next.push({ date, slot, id });
      k++;
    }
    save(next);
    track("page", "planning-auto");
  }

  function swap(date, slot) {
    const used = new Set((plan || []).map((x) => x.id));
    const pool = candidates().filter((id) => !used.has(id)).slice(0, 25);
    set(date, slot, pool[Math.floor(Math.random() * pool.length)]);
  }

  async function weekCourses() {
    const ids = (plan || []).filter((x) => dates.includes(x.date)).map((x) => x.id);
    if (!ids.length) return;
    const recs = pick(carnet, ids, fridge, opts);
    // On additionne les ingrédients manquants identiques (même ingrédient, même unité).
    const tot = new Map();
    for (const r of recs) for (const i of r.ingredients) {
      if (i.etat !== "need") continue;
      const key = i.cle + "|" + i.unite;
      const cur = tot.get(key) || { nom: i.nom, cle: i.cle, unite: i.unite, q: 0, n: 0 };
      cur.q += i.q || 0; cur.n++;
      tot.set(key, cur);
    }
    const items = [...tot.values()].map((x) => ({ nom: x.nom, quantite: x.q ? fmtQty(x.q, x.unite) : "" }));
    const n = await addToCourses(items, { id: "", titre: `Planning du ${dates[0].split("-").reverse().slice(0, 2).join(".")}` });
    setMsg(n ? `${n} article${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} à ta liste de courses.` : "Tout est déjà dans ta liste (ou dans ton frigo).");
  }

  if (!carnet || !plan) return <p className="empty">Chargement…</p>;
  const weekPlan = plan.filter((x) => dates.includes(x.date));
  const results = q.length >= 2 ? carnet.filter((r) => norm(r.titre).includes(norm(q))).slice(0, 12) : [];

  return (
    <div className="plan">
      <div className="plan-bar">
        <div className="plan-weeks">
          <button type="button" className="f" aria-pressed={week === mondayOf()} onClick={() => setWeek(mondayOf())}>Cette semaine</button>
          <button type="button" className="f" aria-pressed={week === isoDate(new Date(mondayOf() + "T12:00:00"), 7)} onClick={() => setWeek(isoDate(new Date(mondayOf() + "T12:00:00"), 7))}>Semaine prochaine</button>
        </div>
        <label className="switch">
          <input type="checkbox" checked={midi} onChange={(e) => { setMidi(e.target.checked); setList("prefs", { ...prefs, midi: e.target.checked }); }} />
          <span className="track" aria-hidden="true" /> Midi aussi
        </label>
      </div>
      <p className="lead" style={{ marginTop: 6 }}>
        {fridge.length ? "Fricette commence par ce qui est dans ton frigo (et ce qui est à finir vite), puis complète avec des plats de saison." : "Remplis ton frigo pour des idées encore plus anti-gaspi : en attendant, voici des plats de saison."}
      </p>
      <div className="actions" style={{ marginTop: 0, marginBottom: 18 }}>
        <button className="cta" type="button" onClick={fillWeek}>✨ Remplir la semaine</button>
        {weekPlan.length > 0 && <button className="ghost" type="button" onClick={weekCourses}>🧺 Courses de la semaine</button>}
        {weekPlan.length > 0 && <button className="link" type="button" onClick={() => save(plan.filter((x) => !dates.includes(x.date)))}>Tout effacer</button>}
      </div>
      <div className="toast" role="status">{msg}</div>

      <div className="plan-days">
        {dates.map((date, i) => (
          <section key={date} className={"plan-day" + (date === isoDate() ? " today" : "") + (date < isoDate() ? " past" : "")}>
            <h2>{DAYS[i]} <span>{date.split("-").reverse().slice(0, 2).join(".")}</span></h2>
            {slots.map((slot) => {
              const e = at(date, slot);
              const r = e && byId.get(e.id);
              return (
                <div key={slot} className="plan-slot">
                  {midi && <div className="label">{slot === "midi" ? "Midi" : "Soir"}</div>}
                  {r ? (
                    <div className="plan-recipe">
                      <a href={`/recette/${r.id}`} className="plan-link">
                        <span className="plan-img">{r.photo ? <img src={r.photo} alt="" loading="lazy" /> : <span dangerouslySetInnerHTML={{ __html: artSvg(r.titre, [], { w: 160, h: 110 }) }} />}</span>
                        <span className="plan-t"><strong>{r.titre}</strong><small>{r.temps} min</small></span>
                      </a>
                      <div className="plan-tools">
                        <button type="button" onClick={() => swap(date, slot)} aria-label="Autre idée" title="Autre idée">🔄</button>
                        <button type="button" onClick={() => setPicking({ date, slot })} aria-label="Choisir une recette" title="Choisir">✎</button>
                        <button type="button" onClick={() => set(date, slot, null)} aria-label="Retirer" title="Retirer">×</button>
                      </div>
                    </div>
                  ) : (
                    <div className="plan-empty">
                      <button type="button" className="link" onClick={() => setPicking({ date, slot })}>+ Choisir</button>
                      <button type="button" className="link" onClick={() => swap(date, slot)}>🎲 Au hasard</button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>

      {picking && (
        <div className="plan-picker" role="dialog" aria-modal="true" aria-label="Choisir une recette" onClick={(e) => e.target === e.currentTarget && setPicking(null)}>
          <div className="plan-picker-box">
            <div className="plan-picker-top">
              <strong>{DAYS[dates.indexOf(picking.date)]} {picking.slot === "midi" ? "midi" : "soir"}</strong>
              <button type="button" className="x" onClick={() => setPicking(null)} aria-label="Fermer">×</button>
            </div>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cherche une recette : risotto, curry, tarte…" />
            <ul>
              {(results.length ? results : pick(carnet, candidates().slice(0, 8), fridge, opts)).map((r) => (
                <li key={r.id}><button type="button" onClick={() => { set(picking.date, picking.slot, r.id); setPicking(null); setQ(""); }}>{r.titre}<small>{r.temps} min</small></button></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
