// Options du site (serveur) : enregistrées dans la table kv, clé « features ».
import { kvGet, kvSet } from "./db";
import { FEATURE_DEFAULTS } from "@/data/features";

export function features() {
  let saved = {};
  try { saved = JSON.parse(kvGet("features") || "{}"); } catch {}
  // Ancien interrupteur du concours (avant la page Options)
  if (saved.concours === undefined && kvGet("concours:actif") === "1") saved.concours = true;
  return { ...FEATURE_DEFAULTS, ...saved };
}
export function feature(k) {
  try { return !!features()[k]; } catch { return !!FEATURE_DEFAULTS[k]; }
}
export function setFeatures(patch) {
  const next = { ...features() };
  for (const [k, v] of Object.entries(patch)) if (k in FEATURE_DEFAULTS) next[k] = !!v;
  kvSet("features", JSON.stringify(next));
  return next;
}
