"use client";
// Mode cuisine : une étape à la fois, en grand, avec minuteurs et écran qui reste allumé.
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/client";
import Gestes, { useVideos } from "./Gestes";

/** Durées citées dans une étape : « 8 minutes », « 1 h 30 », « 3 à 4 minutes » (on prend la plus longue). */
export function durations(text) {
  const out = [];
  const re = /(\d+(?:[,.]\d+)?)\s*(?:(?:à|-|ou)\s*(\d+(?:[,.]\d+)?)\s*)?(h(?:eures?)?|min(?:utes?)?)\b(?:\s*(\d{1,2})\b(?!\s*(?:°|g|ml|cl|cm|personnes)))?/gi;
  for (const m of text.matchAll(re)) {
    const a = parseFloat(m[1].replace(",", ".")), b = m[2] ? parseFloat(m[2].replace(",", ".")) : a;
    const v = Math.max(a, b);
    const isH = m[3].toLowerCase().startsWith("h");
    let sec = isH ? v * 3600 + (m[4] ? Number(m[4]) * 60 : 0) : v * 60;
    if (sec >= 30 && sec <= 6 * 3600) out.push({ sec: Math.round(sec), label: m[0].trim() });
  }
  return out;
}

const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + ":" + String(x).padStart(2, "0");
};

function beep() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = new C();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.32);
    });
  } catch {}
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch {}
}

export default function CookMode({ r, onClose, onDone }) {
  const steps = r.etapes || [];
  const [i, setI] = useState(0);
  const [showIngs, setShowIngs] = useState(false);
  const [timers, setTimers] = useState([]); // {id, label, end, done}
  const [now, setNow] = useState(Date.now());
  const lock = useRef(null);
  const videos = useVideos();
  const box = useRef(null);

  useEffect(() => {
    track("cook", r.id || r.titre);
    const ask = async () => { try { lock.current = await navigator.wakeLock?.request("screen"); } catch {} };
    ask();
    const vis = () => document.visibilityState === "visible" && ask();
    document.addEventListener("visibilitychange", vis);
    const key = (e) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    box.current?.focus();
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      try { lock.current?.release(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!timers.some((t) => !t.done)) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setTimers((list) => list.map((x) => {
        if (!x.done && x.end <= n) { beep(); return { ...x, done: true }; }
        return x;
      }));
    }, 500);
    return () => clearInterval(t);
  }, [timers]);

  const start = (d) => setTimers((l) => [...l, { id: Date.now(), label: `Étape ${i + 1} · ${d.label}`, end: Date.now() + d.sec * 1000, done: false }]);
  const stop = (id) => setTimers((l) => l.filter((x) => x.id !== id));
  const step = steps[i] || "";

  return (
    <div className="cook" role="dialog" aria-modal="true" aria-label={`Mode cuisine : ${r.titre}`} ref={box} tabIndex={-1}>
      <div className="cook-top">
        <div>
          <div className="label">Mode cuisine · l'écran reste allumé</div>
          <strong className="cook-title">{r.titre}</strong>
        </div>
        <button type="button" className="ghost small" onClick={onClose}>Fermer</button>
      </div>

      <div className="cook-progress" aria-hidden="true">
        {steps.map((_, k) => <span key={k} className={k <= i ? "on" : ""} />)}
      </div>

      <div className="cook-main">
        <div className="cook-n">Étape {i + 1} <span>/ {steps.length}</span></div>
        <p className="cook-step">{step}</p>
        <Gestes step={step} videos={videos} big />
        <div className="cook-timers-start">
          {durations(step).map((d, k) => (
            <button key={k} type="button" className="btn" onClick={() => start(d)}>⏱ Minuteur {d.label}</button>
          ))}
        </div>
      </div>

      {timers.length > 0 && (
        <div className="cook-timers">
          {timers.map((t) => (
            <div key={t.id} className={"timer" + (t.done ? " done" : "")}>
              <span>{t.label}</span>
              <strong>{t.done ? "C'est prêt !" : fmt(Math.max(0, Math.ceil((t.end - now) / 1000)))}</strong>
              <button type="button" className="x" onClick={() => stop(t.id)} aria-label="Arrêter ce minuteur">×</button>
            </div>
          ))}
        </div>
      )}

      {showIngs && (
        <ul className="ing cook-ings">
          {(r.ingredients || []).map((g, k) => <li key={k}><span>{g.nom}</span><span className="q">{g.quantite}</span></li>)}
        </ul>
      )}

      <div className="cook-nav">
        <button type="button" className="ghost" onClick={() => setI((x) => Math.max(x - 1, 0))} disabled={i === 0} aria-label="Étape précédente">← <span className="hide-sm">Précédente</span></button>
        <button type="button" className="link" onClick={() => setShowIngs((v) => !v)}>{showIngs ? "Cacher" : "Voir"} les ingrédients</button>
        {i < steps.length - 1
          ? <button type="button" className="cta" onClick={() => setI((x) => x + 1)}>Suivante →</button>
          : <button type="button" className="cta" onClick={onDone || onClose}>C'est prêt ! ✓</button>}
      </div>
    </div>
  );
}
