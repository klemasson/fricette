"use client";
// Activer / couper les notifications sur ce téléphone ou cet ordinateur.
import { useEffect, useState } from "react";
import { me, loadLocal, saveLocal } from "@/lib/client";
import { useFeatures } from "@/lib/features-client";

function b64(s) {
  const p = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushToggle({ compact = false }) {
  const [st, setSt] = useState("load"); // load | nosupport | ios | denied | off | on
  const [logged, setLogged] = useState(false);
  const [prefs, setPrefs] = useState({ defi: true, dates: true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const f = useFeatures();

  useEffect(() => {
    me().then((d) => setLogged(!!d.user));
    setPrefs((p) => ({ ...p, ...loadLocal("frc-push-prefs", {}) }));
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setSt(ios && !standalone ? "ios" : "nosupport");
      if (Notification.permission === "denied") return setSt("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      setSt(sub ? "on" : "off");
    })().catch(() => setSt("nosupport"));
  }, []);

  async function enable(nextPrefs = prefs, hello = true) {
    setBusy(true); setMsg("");
    try {
      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        if (p !== "granted") { setSt(p === "denied" ? "denied" : "off"); return; }
      }
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { key } = await fetch("/api/push").then((r) => r.json());
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      }
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), ...nextPrefs, hello }) });
      if (!r.ok) throw new Error();
      setSt("on");
      if (hello) setMsg("C'est activé ! Tu devrais recevoir une notification de test.");
    } catch {
      setMsg("Impossible d'activer les notifications sur cet appareil.");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSt("off"); setMsg("");
    } finally { setBusy(false); }
  }

  function setPref(k, v) {
    const next = { ...prefs, [k]: v };
    setPrefs(next); saveLocal("frc-push-prefs", next);
    if (st === "on") enable(next, false);
  }

  if (st === "load" || !f.push) return null;
  if (st === "nosupport") return compact ? null : <p className="muted small">Ce navigateur ne permet pas les notifications.</p>;
  if (st === "ios") return <p className="muted small">📱 Sur iPhone, installe d'abord Fricette sur ton écran d'accueil (bouton Partager, puis « Sur l'écran d'accueil »). Ouvre ensuite Fricette depuis l'icône pour activer les notifications.</p>;
  if (st === "denied") return <p className="muted small">Les notifications sont bloquées pour Fricette. Pour les réactiver, ouvre les réglages du navigateur (ou du téléphone) et autorise les notifications pour fricette.ch.</p>;

  if (compact) {
    return st === "on"
      ? <p className="small-note">🔔 Tu seras prévenu·e chaque lundi du nouveau défi.</p>
      : <button type="button" className="ghost small" onClick={() => enable({ ...prefs, defi: true })} disabled={busy}>🔔 Me prévenir du défi chaque lundi</button>;
  }
  return (
    <div className="push">
      {st === "on" ? (
        <>
          <label className="switch"><input type="checkbox" checked={prefs.defi} onChange={(e) => setPref("defi", e.target.checked)} /><span className="track" aria-hidden="true" />Le nouveau défi anti-gaspi, chaque lundi matin</label>
          <label className="switch"><input type="checkbox" checked={prefs.dates && logged} disabled={!logged} onChange={(e) => setPref("dates", e.target.checked)} /><span className="track" aria-hidden="true" />Un produit de mon frigo arrive à sa date limite{!logged && " (avec un compte)"}</label>
          <button type="button" className="link" onClick={disable} disabled={busy}>Couper les notifications sur cet appareil</button>
        </>
      ) : (
        <button type="button" className="btn" onClick={() => enable()} disabled={busy}>{busy ? "Activation…" : "🔔 Activer les notifications sur cet appareil"}</button>
      )}
      {msg && <p className="status ok-msg">{msg}</p>}
    </div>
  );
}
