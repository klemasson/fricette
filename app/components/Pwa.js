"use client";
// Installe le service worker (mode hors ligne) et gère le bouton « Installer l'app ».
import { useEffect, useState } from "react";
import { loadLocal, saveLocal } from "@/lib/client";

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Garde l'invitation du navigateur pour plus tard (Chrome, Edge, Samsung…)
    const keep = (e) => { e.preventDefault(); window.__frcInstall = e; window.dispatchEvent(new Event("frc:installable")); };
    window.addEventListener("beforeinstallprompt", keep);
    return () => window.removeEventListener("beforeinstallprompt", keep);
  }, []);
  return null;
}

function platform() {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  return { standalone, ios: /iphone|ipad|ipod/i.test(ua), mobile: /android|iphone|ipad|ipod|mobile/i.test(ua) };
}

/** Bouton (ou bandeau) pour installer Fricette sur l'écran d'accueil. */
export function InstallApp({ banner = false }) {
  const [st, setSt] = useState(null); // null | {can, ios}
  const [help, setHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const p = platform();
    if (p.standalone) return;
    const upd = () => setSt({ can: !!window.__frcInstall, ios: p.ios, mobile: p.mobile });
    upd();
    window.addEventListener("frc:installable", upd);
    if (banner && loadLocal("frc-install-hide", 0) > Date.now()) setHidden(true);
    return () => window.removeEventListener("frc:installable", upd);
  }, [banner]);

  if (!st || hidden) return null;
  if (banner && !(st.mobile && (st.can || st.ios))) return null;
  if (!banner && !st.can && !st.ios) return null;

  async function install() {
    if (window.__frcInstall) {
      window.__frcInstall.prompt();
      const r = await window.__frcInstall.userChoice.catch(() => null);
      window.__frcInstall = null;
      if (r?.outcome === "accepted") setHidden(true);
    } else setHelp(true);
  }
  function later() {
    saveLocal("frc-install-hide", Date.now() + 14 * 86400000);
    setHidden(true);
  }

  return (
    <div className={banner ? "install-banner" : "install-inline"}>
      {banner && <img src="/icons/icon-192.png" alt="" width="40" height="40" />}
      <div className="install-txt">
        {banner && <strong>Fricette sur ton écran d'accueil</strong>}
        {help
          ? <span>Sur iPhone : touche <b>Partager</b> <span aria-hidden="true">⎋</span> en bas de Safari, puis <b>« Sur l'écran d'accueil »</b>.</span>
          : banner && <span>Ouvre-la comme une app, même sans réseau.</span>}
      </div>
      {!help && <button type="button" className={banner ? "btn small" : "link"} onClick={install}>Installer l'app</button>}
      {banner && <button type="button" className="x" onClick={later} aria-label="Plus tard">×</button>}
    </div>
  );
}
