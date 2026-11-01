"use client";
// Options du site côté navigateur : chargées une fois (/api/features), puis gardées en mémoire.
import { useEffect, useState } from "react";
import { FEATURE_DEFAULTS } from "@/data/features";

let cache = null, promise = null;
function last() { try { return JSON.parse(localStorage.getItem("frc-features") || "null"); } catch { return null; } }
export function loadFeatures() {
  if (!promise) {
    promise = fetch("/api/features", { cache: "no-store" }).then((r) => r.json()).then((f) => {
      cache = { ...FEATURE_DEFAULTS, ...f };
      try { localStorage.setItem("frc-features", JSON.stringify(cache)); } catch {}
      return cache;
    }).catch(() => cache || { ...FEATURE_DEFAULTS, ...(last() || {}) });
  }
  return promise;
}
/** Renvoie les options (la dernière version connue tout de suite, puis la version à jour). */
export function useFeatures() {
  const [f, setF] = useState(() => cache || { ...FEATURE_DEFAULTS });
  useEffect(() => {
    const l = last(); if (l && !cache) setF({ ...FEATURE_DEFAULTS, ...l });
    loadFeatures().then(setF);
  }, []);
  return f;
}
