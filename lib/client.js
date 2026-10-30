"use client";
import { grams, resolve, toBase } from "./match";
import { applyOp } from "./courses-ops";
import { prixKg } from "@/data/prix";
// Petites briques partagées par toutes les pages, côté navigateur :
// compte connecté, liste de courses, frigo, favoris, notes et statistiques anonymes.

// --- Stockage local (protégé : navigation privée, stockage bloqué…) ---
export function loadLocal(key, def) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? def;
  } catch {
    return def;
  }
}
export function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const KEYS = { courses: "frc-courses", frigo: "olf-frigo", favs: "frc-favs", prefs: "frc-prefs", cuisine: "frc-cuisine", planning: "frc-planning" };
const valid = (kind, v) => (kind === "prefs" ? !!v && typeof v === "object" && !Array.isArray(v) : Array.isArray(v));

// --- Compte ---
let mePromise = null;
export function me(force = false) {
  if (!mePromise || force) {
    mePromise = fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => ({ user: null, favorites: [] }));
  }
  return mePromise;
}

// --- Listes synchronisées (courses, frigo) ---
const timers = {};
function pushLater(kind, value) {
  clearTimeout(timers[kind]);
  timers[kind] = setTimeout(() => {
    fetch("/api/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, value }) }).catch(() => {});
  }, 700);
}

/** Liste à jour : celle du compte si on est connecté, sinon celle de l'appareil. */
// (La liste partagée éventuelle est mémorisée dans les réglages du compte : on la reprend ici.)
if (typeof window !== "undefined") {
  me().then((d) => { const id = d.data?.prefs?.shared; if (d.user && id && !loadLocal("frc-shared", null)) saveLocal("frc-shared", id); });
}
export async function getList(kind) {
  const d = await me();
  if (d.user && valid(kind, d.data?.[kind])) {
    saveLocal(KEYS[kind], d.data[kind]);
    return d.data[kind];
  }
  return loadLocal(KEYS[kind], kind === "frigo" ? null : kind === "prefs" ? {} : []);
}

export async function setList(kind, value) {
  saveLocal(KEYS[kind], value);
  if (kind === "courses") window.dispatchEvent(new CustomEvent("frc:courses", { detail: value }));
  const d = await me();
  if (d.user) {
    d.data = { ...(d.data || {}), [kind]: value };
    pushLater(kind, value);
  }
}

/** Après connexion : on fusionne la liste de courses de l'appareil avec celle du compte. */
export async function mergeAfterLogin() {
  const localCourses = loadLocal(KEYS.courses, []);
  const localFrigo = loadLocal(KEYS.frigo, null);
  const d = await me(true);
  if (!d.user) return d;
  const server = Array.isArray(d.data?.courses) ? d.data.courses : [];
  const seen = new Set(server.map((x) => x.key));
  const merged = [...server, ...localCourses.filter((x) => !seen.has(x.key))];
  if (merged.length !== server.length) await setList("courses", merged);
  else saveLocal(KEYS.courses, merged);
  if (!Array.isArray(d.data?.frigo) && Array.isArray(localFrigo)) await setList("frigo", localFrigo);
  const localCuisine = loadLocal(KEYS.cuisine, []);
  const serverCuisine = Array.isArray(d.data?.cuisine) ? d.data.cuisine : [];
  const seenC = new Set(serverCuisine.map((x) => x.id + x.date));
  const mergedC = [...serverCuisine, ...localCuisine.filter((x) => !seenC.has(x.id + x.date))];
  if (mergedC.length !== serverCuisine.length) await setList("cuisine", mergedC);
  const localPrefs = loadLocal(KEYS.prefs, null);
  if (!valid("prefs", d.data?.prefs) && valid("prefs", localPrefs)) await setList("prefs", localPrefs);
  return d;
}

// --- Liste de courses ---
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Ajoute des ingrédients d'une recette ; renvoie le nombre de lignes ajoutées. */
export async function addToCourses(items, recipe) {
  const list = await getCourses();
  const add = [];
  for (const it of items) {
    const key = norm(it.nom) + "|" + (recipe?.id || "");
    if (list.some((x) => x.key === key) || add.some((x) => x.key === key)) continue;
    add.push({ key, nom: it.nom, quantite: it.quantite || "", recette: recipe?.titre || "", recetteId: recipe?.id || "", done: false });
  }
  if (add.length) await coursesOp({ op: "add", items: add });
  track("courses", recipe?.id || "ajout");
  return add.length;
}

// --- Liste de courses, seule ou partagée en famille (lien secret) ---
export const sharedId = () => loadLocal("frc-shared", null);

/** La liste de courses à jour (partagée si on en a rejoint une). */
export async function getCourses() {
  const id = sharedId();
  if (id) {
    try {
      const r = await fetch(`/api/shared/${id}`, { cache: "no-store" });
      if (r.status === 404) { leaveShared(false); return getList("courses"); }
      const d = await r.json();
      saveLocal(KEYS.courses, d.items);
      return d.items;
    } catch {
      return loadLocal(KEYS.courses, []);
    }
  }
  return getList("courses");
}

/** Applique une opération (add, toggle, remove, clearDone, clear) et renvoie la liste à jour. */
export async function coursesOp(op) {
  const id = sharedId();
  if (id) {
    const optimistic = applyOp(loadLocal(KEYS.courses, []), op);
    saveLocal(KEYS.courses, optimistic);
    window.dispatchEvent(new CustomEvent("frc:courses", { detail: optimistic }));
    try {
      const r = await fetch(`/api/shared/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops: [op] }) });
      const d = await r.json();
      if (r.ok) {
        saveLocal(KEYS.courses, d.items);
        window.dispatchEvent(new CustomEvent("frc:courses", { detail: d.items }));
        return d.items;
      }
    } catch {}
    return optimistic;
  }
  const next = applyOp(await getList("courses"), op);
  await setList("courses", next);
  return next;
}

/** Crée une liste partagée avec la liste actuelle ; renvoie le lien à envoyer. */
export async function startShared() {
  const items = await getList("courses");
  const r = await fetch("/api/shared", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Impossible de partager la liste.");
  await joinShared(d.id, false);
  return `${location.origin}/courses?liste=${d.id}`;
}

export async function joinShared(id, mergeMine = true) {
  const mine = await getList("courses");
  saveLocal("frc-shared", id);
  const p = await getList("prefs");
  await setList("prefs", { ...p, shared: id }); // la liste partagée suit le compte sur tous les appareils
  if (mergeMine && mine.length) await coursesOp({ op: "add", items: mine });
  return getCourses();
}

export async function leaveShared(keepCopy = true) {
  const copy = loadLocal(KEYS.courses, []);
  saveLocal("frc-shared", null);
  try { localStorage.removeItem("frc-shared"); } catch {}
  const p = await getList("prefs");
  if (p.shared) { const { shared, ...rest } = p; await setList("prefs", rest); }
  if (keepCopy) await setList("courses", copy);
}

// --- Favoris (hors page d'accueil, qui gère les siens) ---
export async function getFavorites() {
  const d = await me();
  return d.user ? d.favorites || [] : loadLocal(KEYS.favs, []);
}
export async function setFavorite(id, on) {
  const d = await me();
  if (!d.user) {
    const list = loadLocal(KEYS.favs, []);
    const next = on ? [id, ...list.filter((x) => x !== id)] : list.filter((x) => x !== id);
    saveLocal(KEYS.favs, next);
    return next;
  }
  const r = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, on }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Erreur");
  d.favorites = j.favorites;
  return j.favorites;
}

// --- Notes ---
let ratingsPromise = null;
export function getRatings(force = false) {
  if (!ratingsPromise || force) {
    ratingsPromise = fetch("/api/ratings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ all: {}, mine: {} }));
  }
  return ratingsPromise;
}
export async function sendRating(id, stars) {
  const r = await fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, stars }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Erreur");
  ratingsPromise = Promise.resolve(j);
  window.dispatchEvent(new CustomEvent("frc:ratings", { detail: j }));
  return j;
}

// --- Statistiques anonymes ---
export function track(kind, value) {
  try {
    const body = JSON.stringify({ kind, value, ref: kind === "page" ? document.referrer : undefined });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/hit", new Blob([body], { type: "text/plain" }));
    else fetch("/api/hit", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}

// --- Partage ---
export async function share({ title, url }) {
  track("share", url.split("/").pop());
  if (navigator.share) {
    try { await navigator.share({ title, url }); return "shared"; } catch (e) { if (e?.name === "AbortError") return "cancel"; }
  }
  try { await navigator.clipboard.writeText(url); return "copied"; } catch { return "fail"; }
}

// --- « Je l'ai cuisinée » et bilan anti-gaspi ---

const fromFridge = (r) => (r.ingredients || []).filter((i) => (i.etat === "have" || i.etat === "short") && !i.basique && i.note !== "placard" && i.cle);

/** Enregistre la recette comme cuisinée ; renvoie les grammes d'aliments sauvés (estimation). */
export async function logCooked(r) {
  const used = fromFridge(r).map((i) => [i.cle, grams(i.cle, i.q, i.unite)]);
  const g = Math.round(used.reduce((s, x) => s + x[1], 0));
  const chf = Math.round(used.reduce((s, [cle, gr]) => s + (gr / 1000) * prixKg(cle), 0) * 10) / 10;
  // Défi de la semaine relevé ? (la recette contient l'ingrédient du défi)
  let defi;
  try {
    const d = await fetch("/api/defi").then((x) => x.json());
    if (d?.cle && (r.ingredients || []).some((i) => i.cle === d.cle && i.etat !== "option")) defi = d.semaine;
  } catch {}
  const list = await getList("cuisine");
  const before = list;
  const keys = (r.ingredients || []).filter((i) => i.etat !== "option" && i.cle).map((i) => i.cle).slice(0, 20);
  const next = [...list, { id: r.id || "", titre: r.titre, date: new Date().toISOString().slice(0, 10), g, chf, k: keys, ...(defi ? { defi } : {}) }].slice(-1000);
  await setList("cuisine", next);
  window.dispatchEvent(new CustomEvent("frc:cuisine", { detail: next }));
  track("page", "cuisinee");
  return { g, chf, before, after: next, defi: !!defi };
}

/** Retire du frigo ce que la recette a utilisé. Renvoie { changed, unknown } (noms). */
export async function consumeFridge(r) {
  const fridge = (await getList("frigo")) || [];
  const next = fridge.map((x) => ({ ...x }));
  const changed = [], unknown = [];
  for (const i of fromFridge(r)) {
    const k = next.findIndex((x) => resolve(x.nom) === i.cle);
    if (k < 0) continue;
    const item = next[k];
    const have = toBase(item.qte, item.unite), need = toBase(i.q, i.unite);
    if (have && need && have[0] === need[0]) {
      const left = have[1] - need[1];
      if (left <= have[1] * 0.05) next[k] = null;
      else next[k] = { ...item, qte: Math.round((left / (have[1] / item.qte)) * 10) / 10 };
      changed.push(item.nom);
    } else if (item.qte == null) unknown.push(item.nom);
    else unknown.push(item.nom);
  }
  const clean = next.filter(Boolean);
  await setList("frigo", clean);
  window.dispatchEvent(new CustomEvent("frc:frigo", { detail: clean }));
  return { changed, unknown };
}

/** Totaux du bilan : { n, g, chf, mois: { n, g, chf } } */
export function bilan(list) {
  const CHF_KG = 8; // anciens enregistrements sans prix : prix moyen indicatif des aliments en Suisse
  const month = new Date().toISOString().slice(0, 7);
  const sum = (l) => {
    const g = l.reduce((s, x) => s + (x.g || 0), 0);
    const chf = l.reduce((s, x) => s + (x.chf ?? ((x.g || 0) / 1000) * CHF_KG), 0);
    return { n: l.length, g, chf: Math.round(chf) };
  };
  return { ...sum(list), mois: sum(list.filter((x) => (x.date || "").startsWith(month))) };
}

// --- Planning de la semaine ---
/** Date locale AAAA-MM-JJ, décalée de n jours. */
export function isoDate(d = new Date(), plus = 0) {
  const x = new Date(d); x.setDate(x.getDate() + plus);
  return x.toLocaleDateString("sv-SE");
}
/** Lundi de la semaine d'une date. */
export function mondayOf(d = new Date()) {
  const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd);
  return isoDate(x);
}
export async function planAdd(date, slot, id) {
  const list = (await getList("planning")).filter((x) => x.date >= isoDate(new Date(), -14)); // on oublie les vieilles semaines
  const next = [...list.filter((x) => !(x.date === date && x.slot === slot)), { date, slot, id }];
  await setList("planning", next);
  window.dispatchEvent(new CustomEvent("frc:planning", { detail: next }));
  return next;
}
