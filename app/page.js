"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suggest, pick, familyOfName, resolve, norm, daysLeft } from "@/lib/match";
import { VOCAB, BASICS } from "@/data/vocab";
import { ALLERGENS, allergenLabel } from "@/data/allergens";
import { FAM, artSvg } from "@/lib/art";
import { daily } from "@/lib/season";
import { Ico, Heart, FavButton, StarAvg } from "./components/bits";
import RecipeBody, { summary } from "./components/RecipeBody";
import { CoursesLink } from "./components/Live";
import Scanner from "./components/Scanner";
import { InstallApp } from "./components/Pwa";
import Newsletter from "./components/Newsletter";
import Bilan from "./components/Bilan";
import { me, getList, setList, mergeAfterLogin, getRatings, track, loadLocal } from "@/lib/client";

const UNITS = ["", "pièce", "g", "kg", "ml", "cl", "l", "tranche", "botte", "boîte", "pot", "c. à s.", "c. à c.", "gousse"];
const PAGE = 8;

const CHEF_LINES = [
  "Je négocie avec ta vieille carotte…",
  "Je fouille derrière les yaourts…",
  "Je demande son avis à la moutarde…",
  "Je réveille le chef, il faisait la sieste dans le bac à légumes…",
  "J'aligne les casseroles par taille…",
  "Ça mijote, ne quitte pas…",
  "Je goûte la sauce. Encore. Pour être sûre…",
];
const PHOTO_LINES = [
  "J'enfile mes lunettes…",
  "Je zoome sur ton bac à légumes…",
  "Je compte tes œufs (deux fois)…",
];

// Ingrédients proposés pendant la saisie : noms du vocabulaire et leurs autres écritures.
const SUG = VOCAB.filter(([cle]) => !BASICS.includes(cle)).map(([cle, nom, syn]) => ({ cle, nom, words: [nom, ...syn].map(norm) }));
function suggestIngredients(q, have) {
  const n = norm(q);
  if (n.length < 2) return [];
  // Rang : le nom commence par la saisie, puis un mot du nom, puis une autre écriture, puis le reste.
  const rank = (s) => {
    const nom = s.words[0];
    if (nom.startsWith(n)) return 0;
    if (nom.includes(" " + n)) return 1;
    if (s.words.some((w) => w.startsWith(n))) return 2;
    if (s.words.some((w) => w.includes(" " + n))) return 3;
    if (s.words.some((w) => w.includes(n))) return 4;
    return 9;
  };
  return SUG.filter((s) => !have.has(s.cle))
    .map((s) => [rank(s), s])
    .filter(([r]) => r < 9)
    .sort((a, b) => a[0] - b[0] || a[1].nom.length - b[1].nom.length)
    .slice(0, 6)
    .map((x) => x[1]);
}
const QUICK = ["œufs", "lait", "beurre", "crème", "fromage râpé", "jambon", "yaourt nature", "tomates", "carottes", "courgettes", "pommes de terre", "poulet", "champignons", "poivrons", "salade verte"];
const isoDay = (plus) => { const d = new Date(); d.setDate(d.getDate() + plus); return d.toLocaleDateString("sv-SE"); };
function ExpBadge({ exp, onClick }) {
  const d = daysLeft(exp);
  if (d == null) return null;
  const txt = d < 0 ? "date passée" : d === 0 ? "aujourd'hui" : d === 1 ? "demain" : `J-${d}`;
  return <button type="button" className={"exp-badge" + (d <= 1 ? " hot" : d <= 3 ? " warm" : "")} onClick={onClick} title={`À finir avant le ${exp.split("-").reverse().join(".")}`}>⏰ {txt}</button>;
}
const qtyLabel = (it) => (it.unite === "pièce" || !it.unite ? `${it.qte}` : `${it.qte} ${it.unite}`);

const START = [
  { nom: "œufs", qte: 4, unite: "pièce" },
  { nom: "courgette", qte: 2, unite: "pièce" },
  { nom: "feta", qte: 150, unite: "g" },
  { nom: "tomates cerises", qte: 250, unite: "g" },
  { nom: "crème", qte: 20, unite: "cl" },
  { nom: "pâtes", qte: 500, unite: "g" },
];

export default function Home() {
  const [fridge, setFridge] = useState(START);
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [temps, setTemps] = useState("40");
  const [regime, setRegime] = useState("");
  const [type, setType] = useState("");
  const [personnes, setPersonnes] = useState("2");
  const [basiques, setBasiques] = useState(true);
  const [placard, setPlacard] = useState(true);
  const [sans, setSans] = useState([]);
  const [showAllergies, setShowAllergies] = useState(false);
  const [carnet, setCarnet] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const [aiRecipes, setAiRecipes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ text: "", err: false });
  const [info, setInfo] = useState(null);
  const [showOffer, setShowOffer] = useState(false);
  const [email, setEmail] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const fileRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(true);
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById("menu");
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setMenuVisible(e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    // Le gros bouton « Voir les recettes » du frigo est à l'écran : pas besoin du bouton flottant.
    const io2 = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0 });
    const cta = document.getElementById("see-recipes");
    if (cta) io2.observe(cta);
    return () => { io.disconnect(); io2.disconnect(); };
  }, []);
  const aiRef = useRef(null);
  const sheetRef = useRef(null);
  const [openRecipe, setOpenRecipe] = useState(null);
  // Compte et favoris
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState([]);
  const [favShown, setFavShown] = useState(PAGE);
  const [auth, setAuth] = useState({ mode: "login", email: "", password: "", error: "", info: "", busy: false, token: "" });
  const [mailEnabled, setMailEnabled] = useState(false);
  const [ratings, setRatings] = useState({});
  const [scanOpen, setScanOpen] = useState(false);
  const [cleared, setCleared] = useState(null);
  const [sugIdx, setSugIdx] = useState(0);
  const [editIdx, setEditIdx] = useState(null);
  const authRef = useRef(null);
  const loaded = useRef(false);
  const ticker = useRef(null);

  function chatter(lines) {
    let i = 0;
    setStatus({ text: lines[0], err: false, chef: true });
    clearInterval(ticker.current);
    ticker.current = setInterval(() => {
      i = (i + 1) % lines.length;
      setStatus({ text: lines[i], err: false, chef: true });
    }, 3500);
  }
  const stopChatter = () => clearInterval(ticker.current);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("olf-frigo") || "null");
      if (Array.isArray(saved)) setFridge(saved);
    } catch {}
    applyPrefs(loadLocal("frc-prefs", {}));
    loaded.current = true;
    fetch("/carnet.json").then((r) => r.json()).then(setCarnet).catch(() => setCarnet([]));
    let local = [];
    try { local = JSON.parse(localStorage.getItem("frc-favs") || "[]"); } catch {}
    setFavs(Array.isArray(local) ? local : []);
    me().then((d) => {
      setMailEnabled(!!d.mail);
      if (d.user) {
        setUser(d.user); setFavs(d.favorites || []);
        if (Array.isArray(d.data?.frigo)) setFridge(d.data.frigo);
        if (d.data?.prefs) applyPrefs(d.data.prefs);
      }
    });
    getRatings().then((d) => setRatings(d.all || {}));
    const onRatings = (e) => setRatings(e.detail.all || {});
    window.addEventListener("frc:ratings", onRatings);
    const onFrigo = (e) => Array.isArray(e.detail) && setFridge(e.detail);
    window.addEventListener("frc:frigo", onFrigo);
    track("page", "/");
    // Liens depuis les autres pages : /?connexion=1 (se connecter), /?connexion=creer, /?compte=supprime
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("connexion")) {
      window.history.replaceState(null, "", "/");
      setAuth({ mode: qs.get("connexion") === "creer" ? "signup" : "login", email: "", password: "", error: "", info: "", busy: false, token: "" });
      setTimeout(() => authRef.current?.showModal?.(), 300);
    }
    const nl = { ok: ["Inscription confirmée : à lundi pour 5 idées de saison !", false], lien: ["Ce lien de confirmation n'est plus valable.", true], desinscrit: ["Tu es désinscrit·e de la newsletter.", false] }[qs.get("newsletter")];
    if (nl) { window.history.replaceState(null, "", "/"); setStatus({ text: nl[0], err: nl[1] }); setTimeout(() => document.getElementById("frigo")?.scrollIntoView({ behavior: "smooth" }), 400); }
    if (qs.get("compte") === "supprime") {
      window.history.replaceState(null, "", "/");
      setStatus({ text: "Ton compte et toutes ses données ont été supprimés.", err: false });
    }
    // Lien « mot de passe oublié » reçu par e-mail : https://fricette.ch/?reset=…
    const resetToken = new URLSearchParams(window.location.search).get("reset");
    if (resetToken) {
      window.history.replaceState(null, "", "/");
      setAuth({ mode: "reset", email: "", password: "", error: "", info: "", busy: false, token: resetToken });
      setTimeout(() => authRef.current?.showModal?.(), 300);
    }
    refreshStatus();
    const p = new URLSearchParams(window.location.search).get("paiement");
    const msgs = {
      ok: ["Merci ! Ton abonnement est actif.", false],
      retrouve: ["Abonnement retrouvé sur cet appareil.", false],
      annule: ["Paiement annulé, rien n'a été prélevé.", false],
      erreur: ["Le paiement n'a pas pu être confirmé. Contacte-nous si tu as été débité.", true],
      "lien-expire": ["Ce lien a expiré. Demande-en un nouveau en bas de page.", true],
    };
    if (p && msgs[p]) {
      setStatus({ text: msgs[p][0], err: msgs[p][1] });
      window.history.replaceState(null, "", "/");
    }
    return () => { window.removeEventListener("frc:ratings", onRatings); window.removeEventListener("frc:frigo", onFrigo); };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    setList("frigo", fridge);
  }, [fridge]);

  // Réglages (personnes, temps, régime, placard) : retenus sur l'appareil et sur le compte.
  function applyPrefs(p) {
    if (!p || typeof p !== "object") return;
    if (p.personnes) setPersonnes(String(p.personnes));
    if (p.temps !== undefined) setTemps(String(p.temps));
    if (p.regime !== undefined) setRegime(p.regime);
    if (p.placard !== undefined) { setBasiques(!!p.placard); setPlacard(!!p.placard); }
    if (Array.isArray(p.sans)) setSans(p.sans);
  }
  const prefsReady = useRef(false);
  useEffect(() => {
    if (!loaded.current) return;
    if (!prefsReady.current) { prefsReady.current = true; return; } // pas d'écriture au chargement
    setList("prefs", { personnes: Number(personnes), temps, regime, placard: basiques && placard, sans });
  }, [personnes, temps, regime, basiques, placard, sans]);

  const opts = { temps: Number(temps), regime, personnes: Number(personnes), basiques, placard, type, sans };
  const found = useMemo(
    () => (carnet ? suggest(carnet, fridge, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carnet, fridge, temps, regime, personnes, basiques, placard, type, sans]
  );
  useEffect(() => setShown(PAGE), [fridge, temps, regime, personnes, basiques, placard, type]);

  async function refreshStatus() {
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      setInfo(await r.json());
    } catch {}
  }

  function addNames(names) {
    names = names.map((x) => x.trim()).filter(Boolean);
    if (!names.length) return;
    for (const n of names) { const k = resolve(n); track(k ? "ing" : "unknown", k || n); }
    setFridge((f) => {
      const next = [...f];
      for (const n of names) {
        if (!next.some((x) => x.nom.toLowerCase() === n.toLowerCase())) next.push({ nom: n, qte: null, unite: "" });
      }
      return next;
    });
    setName(""); setSugIdx(0);
  }

  function add(e) {
    e.preventDefault();
    // Entrée : on ajoute la suggestion surlignée (orthographe connue du carnet), sinon le texte tapé.
    if (sugs.length && !name.includes(",")) return addNames([(sugs[sugIdx] || sugs[0]).nom]);
    addNames(name.split(/[,;\n]/));
  }

  function onAddKey(e) {
    if (!sugs.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSugIdx((k) => (k + 1) % sugs.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSugIdx((k) => (k - 1 + sugs.length) % sugs.length); }
    if (e.key === "Escape") setName("");
  }

  // Produit scanné : on additionne si l'ingrédient est déjà là dans la même unité.
  const same = (a, b) => a.nom.toLowerCase() === b.nom.toLowerCase();
  function addScanned(it) {
    const k = resolve(it.nom); track(k ? "ing" : "unknown", k || it.nom);
    setFridge((f) => {
      const i = f.findIndex((x) => same(x, it));
      if (i < 0) return [...f, it];
      const x = f[i];
      const merged = x.unite === it.unite && x.qte != null && it.qte != null ? { ...x, qte: x.qte + it.qte } : { ...x, qte: it.qte ?? x.qte, unite: it.qte != null ? it.unite : x.unite };
      return f.map((y, j) => (j === i ? merged : y));
    });
  }
  function removeScanned(it) {
    setFridge((f) => {
      const i = f.findIndex((x) => same(x, it));
      if (i < 0) return f;
      const x = f[i];
      if (x.unite === it.unite && x.qte != null && it.qte != null && x.qte > it.qte) return f.map((y, j) => (j === i ? { ...y, qte: y.qte - it.qte } : y));
      return f.filter((_, j) => j !== i);
    });
  }

  // Une recette au hasard parmi les meilleures possibles avec le frigo (ou de saison si rien ne colle).
  function surprise() {
    const pool = results.length ? results.slice(0, 40) : pick(carnet, (day?.seasonal || carnet).slice(0, 60).map((r) => r.id), fridge, opts);
    if (!pool.length) return;
    let r = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && r.id === openRecipe?.id) r = pool[(pool.indexOf(r) + 1) % pool.length];
    track("page", "surprise");
    openSheet(r);
  }

  function clearFridge() {
    setCleared(fridge);
    setFridge([]);
    setAiRecipes(null);
  }
  useEffect(() => {
    if (cleared && fridge.length) setCleared(null); // on a rajouté quelque chose : plus besoin d'annuler
  }, [fridge, cleared]);

  const update = (i, patch) => setFridge((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i) => setFridge((f) => f.filter((_, j) => j !== i));

  async function generate() {
    if (!fridge.length) return setStatus({ text: "Ajoute au moins un ingrédient.", err: true });
    setBusy(true); setShowOffer(false);
    chatter(CHEF_LINES);
    try {
      const r = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fridge, temps: Number(temps), regime, personnes: Number(personnes), basiques }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.code === "free_limit" && info?.billing) setShowOffer(true);
        setStatus({
          text: data.code === "free_limit" && !info?.billing
            ? "Le chef a fini son service pour aujourd'hui. Il revient demain avec une nouvelle recette sur mesure ! En attendant, le carnet reste ouvert."
            : data.error || "Une erreur est survenue.",
          err: true,
        });
      } else {
        setAiRecipes(data.recipes.map(fromAi));
        setStatus({ text: "", err: false });
        setInfo((s) => (s ? { ...s, recipesLeft: data.recipesLeft } : s));
        setTimeout(() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    } catch {
      setStatus({ text: "Connexion perdue. Vérifie ton réseau et réessaie.", err: true });
    } finally { stopChatter(); setBusy(false); }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setShowOffer(false);
    chatter(PHOTO_LINES);
    try {
      const image = await shrink(file);
      const r = await fetch("/api/photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.code === "free_limit" && info?.billing) setShowOffer(true);
        return setStatus({
          text: data.code === "free_limit" && !info?.billing
            ? "Le chef a rangé ses lunettes pour aujourd'hui. Reviens demain pour une nouvelle photo !"
            : data.error || "Photo illisible.",
          err: true,
        });
      }
      setFridge((f) => {
        const next = [...f];
        for (const it of data.items) if (!next.some((x) => x.nom.toLowerCase() === it.nom.toLowerCase())) next.push(it);
        return next;
      });
      setStatus({
        text: data.items.length ? "Ingrédients ajoutés depuis la photo. Vérifie les quantités et retire ce qui est faux." : "Je n'ai rien reconnu sur cette photo.",
        err: !data.items.length,
      });
      setInfo((s) => (s ? { ...s, photosLeft: data.photosLeft } : s));
    } catch {
      setStatus({ text: "Impossible d'envoyer la photo. Essaie une image plus petite.", err: true });
    } finally { stopChatter(); setBusy(false); }
  }

  async function goPay() {
    setBusy(true);
    const r = await fetch("/api/checkout", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (data.url) window.location.href = data.url;
    else { setBusy(false); setStatus({ text: data.error || "Paiement indisponible.", err: true }); }
  }

  async function goPortal() {
    const r = await fetch("/api/portal", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (data.url) window.location.href = data.url;
    else setStatus({ text: data.error || "Espace abonnement indisponible.", err: true });
  }

  async function restore(e) {
    e.preventDefault();
    const r = await fetch("/api/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await r.json().catch(() => ({}));
    setStatus({ text: data.message || data.error || "", err: !r.ok });
    if (r.ok) setShowRestore(false);
  }

  const aiLeft = info?.recipesLeft;
  const badge = info && info.ai
    ? info.pro
      ? <span className="badge pro">Abonné·e · sur mesure illimité</span>
      : <span className="badge">{aiLeft > 0 ? `${aiLeft} recette${aiLeft > 1 ? "s" : ""} du chef offerte${aiLeft > 1 ? "s" : ""} aujourd'hui` : "Le chef revient demain"}</span>
    : null;

  const results = found?.results || [];
  const inFridge = new Set(fridge.map((it) => resolve(it.nom)).filter(Boolean));
  const sugs = useMemo(() => suggestIngredients(name, inFridge), [name, fridge]); // eslint-disable-line react-hooks/exhaustive-deps
  const quick = QUICK.filter((q) => !inFridge.has(resolve(q))).slice(0, 8);
  const fridgeFams = [...new Set(fridge.map((it) => familyOfName(it.nom)))].filter((f) => f !== "gris");

  function openSheet(r) {
    if (r.id) track("open", r.id);
    setOpenRecipe(r);
    requestAnimationFrame(() => sheetRef.current?.showModal?.());
  }

  const day = useMemo(() => (carnet && carnet.length ? daily(carnet) : null), [carnet]);
  const seasonal = day && carnet ? pick(carnet, day.seasonal.slice(0, 4).map((r) => r.id), fridge, opts) : [];
  const favSet = new Set(favs);
  const favRecipes = carnet ? pick(carnet, favs, fridge, opts) : [];

  function saveLocalFavs(list) {
    try { localStorage.setItem("frc-favs", JSON.stringify(list)); } catch {}
  }

  async function toggleFav(id) {
    const on = !favSet.has(id);
    const next = on ? [id, ...favs.filter((x) => x !== id)] : favs.filter((x) => x !== id);
    setFavs(next);
    if (!user) {
      saveLocalFavs(next);
      if (on && next.length === 1) setStatus({ text: "Ajoutée à tes favoris. Crée un compte pour les retrouver sur tous tes appareils.", err: false });
      return;
    }
    try {
      const r = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, on }) });
      const d = await r.json();
      if (r.ok) setFavs(d.favorites);
      else { setFavs(favs); setStatus({ text: d.error || "Impossible d'enregistrer ce favori.", err: true }); }
    } catch {
      setFavs(favs);
      setStatus({ text: "Connexion perdue : le favori n'a pas été enregistré.", err: true });
    }
  }

  function openAuth(mode) {
    setAuth({ mode, email: user?.email || "", password: "", error: "", info: "", busy: false, token: "" });
    requestAnimationFrame(() => authRef.current?.showModal?.());
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuth((a) => ({ ...a, busy: true, error: "", info: "" }));
    const { mode, email: em, password, token } = auth;
    try {
      let r;
      if (mode === "forgot") {
        r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em }) });
        const d = await r.json().catch(() => ({}));
        return setAuth((a) => ({ ...a, busy: false, error: r.ok ? "" : d.error || "Une erreur est survenue.", info: r.ok ? d.message : "" }));
      }
      if (mode === "reset") {
        r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      } else if (mode === "delete") {
        r = await fetch("/api/me", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      } else {
        r = await fetch(`/api/auth/${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, password, favorites: user ? [] : favs }),
        });
      }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setAuth((a) => ({ ...a, busy: false, error: d.error || "Une erreur est survenue." }));
      if (mode === "delete") {
        me(true);
        setUser(null); setFavs([]); saveLocalFavs([]);
        setStatus({ text: "Ton compte et tes favoris ont été supprimés.", err: false });
      } else {
        setUser(d.user); setFavs(d.favorites || []); saveLocalFavs([]);
        mergeAfterLogin().then((m) => { if (Array.isArray(m.data?.frigo)) setFridge(m.data.frigo); });
        setStatus({
          text: mode === "signup" ? "Compte créé ! Tes favoris sont enregistrés."
            : mode === "reset" ? "Nouveau mot de passe enregistré. Tu es connecté·e."
            : "Te revoilà ! Tes favoris sont là.",
          err: false,
        });
      }
      authRef.current?.close();
    } catch {
      setAuth((a) => ({ ...a, busy: false, error: "Connexion perdue. Réessaie." }));
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    me(true);
    setUser(null); setFavs([]);
    setStatus({ text: "Tu es déconnecté·e.", err: false });
  }

  const TYPES = [["", "De tout", "Tout"], ["plats", "Un plat", "Plat"], ["soupes-salades", "Soupe & salade", "Soupe, salade"], ["sucre", "Sucré", "Sucré"]];

  return (
    <div className={busy ? "busy" : ""}>
      <header className="in">
        <nav className="nav">
          <a className="logo" href="/"><Ico fam="rouge" rot={0} />fricette</a>
          <div className="nav-right">
            {badge}
            {favs.length > 0 && (
              <a className="nav-link" href="#favoris" aria-label={`Mes favoris (${favs.length})`}><Heart on /> {favs.length}</a>
            )}
            <CoursesLink />
            {user
              ? <a className="btn small" href="/compte" title={user.email}>Mon compte</a>
              : <button className="btn small" type="button" onClick={() => openAuth("login")}>Se connecter</button>}
          </div>
        </nav>
        <div className="hero">
          <div>
            <h1>Ton frigo est plein d'idées. <em>On les cuisine.</em></h1>
            <p>
              Dis ce qui traîne au frais et en quelle quantité. Fricette te propose des recettes où il ne te manque
              rien, ou presque.
            </p>
            <button className="cta" type="button" onClick={() => document.getElementById("frigo")?.scrollIntoView({ behavior: "smooth" })}>
              Voir ce que je peux cuisiner
            </button>
            <div className="facts">
              <span><Ico fam="vert" rot={0} />{carnet?.length || 900} recettes gratuites</span>
              <span><Ico fam="jaune" rot={0} />les quantités comptent</span>
              <span><Ico fam="rouge" rot={0} />zéro gaspi</span>
            </div>
            {info?.mock && <p className="mock">Mode simulation : les recettes du chef sont fictives.</p>}
          </div>
          {day?.today ? (
            <button type="button" className="daily" onClick={() => openSheet(pick(carnet, [day.today.id], fridge, opts)[0])}>
              <span className="daily-img"><img src={day.today.photo} alt="" /><span className="ai-tag">Photo IA</span></span>
              <span className="daily-txt">
                <span className="label">La recette du jour</span>
                <strong>{day.today.titre}</strong>
                <span className="meta">{day.today.temps} min · {day.today.difficulte}{ratings[day.today.id] && <> · <StarAvg v={ratings[day.today.id]} /></>}</span>
              </span>
            </button>
          ) : (
            <div
              className="hero-art"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: artSvg("fricette", ["rouge", "vert", "jaune", "blanc", "orange", "bleu", "rose"], { w: 400, h: 400, hero: true }) }}
            />
          )}
        </div>
      </header>

      <div className="in"><InstallApp banner /></div>

      <section className="fridge" id="frigo" aria-label="Ton frigo">
        <div className="in">
          <div className="sec">
            <h2>Ton frigo</h2>
            <div className="sec-right">
              <span>{fridge.length} ingrédient{fridge.length > 1 ? "s" : ""}</span>
              {fridge.length > 0 && (
                <button className="clear-btn" type="button" onClick={clearFridge} disabled={busy}>
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
                  Vider le frigo
                </button>
              )}
            </div>
          </div>
          <form className="addbox" onSubmit={add} onKeyDown={onAddKey}>
            <div className="addfield">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              <input id="ing" value={name} onChange={(e) => { setName(e.target.value); setSugIdx(0); }} placeholder="Ajoute un ingrédient : carottes, feta, riz…"
                aria-label="Ingrédient" autoComplete="off" role="combobox" aria-expanded={sugs.length > 0} aria-controls="ing-sugs"
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
              {focused && sugs.length > 0 && (
                <ul className="sugs" id="ing-sugs" role="listbox">
                  {sugs.map((sg, k) => (
                    <li key={sg.cle} role="option" aria-selected={k === sugIdx}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addNames([sg.nom])}>
                        <Ico fam={familyOfName(sg.nom)} rot={0} />{sg.nom}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn" type="submit">Ajouter</button>
            <button className="scan-icon" type="button" onClick={() => setScanOpen(true)} aria-label="Scanner un code-barres" title="Scanner un code-barres">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5h3M17 5h3v2M20 17v2h-3M7 19H4v-2M8 9v6M11 9v6M14 9v6M17 9v6" /></svg>
              <span>Scanner</span>
            </button>
          </form>

          <Bilan compact />
          {quick.length > 0 && (
            <div className="quick" aria-label="Ajout rapide">
              <span>Ajout rapide :</span>
              {quick.map((q) => (
                <button key={q} type="button" className="quick-chip" onClick={() => addNames([q])}>+ {q}</button>
              ))}
            </div>
          )}

          {cleared && (
            <p className="undo-bar" role="status">
              Frigo vidé ({cleared.length} ingrédient{cleared.length > 1 ? "s" : ""}).
              <button className="link" type="button" onClick={() => { setFridge(cleared); setCleared(null); }}>Annuler</button>
            </p>
          )}
          {fridge.length === 0 && !cleared && <p className="empty">Ton frigo est vide. Ajoute ce qui traîne au frais, ou scanne les codes-barres de tes produits.</p>}
          <div className="tokens">
            {fridge.map((it, i) => (
              <span className={"token" + (editIdx === i ? " editing" : "")} key={it.nom + i}>
                <Ico fam={familyOfName(it.nom)} />
                <span className="n">{it.nom}</span>
                {editIdx === i ? (
                  <span className="qedit" onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); setEditIdx(null); } }}>
                    <input
                      type="number" min="0" step="any" inputMode="decimal" aria-label={`Quantité de ${it.nom}`} autoFocus
                      placeholder="qté" value={it.qte ?? ""}
                      onChange={(e) => update(i, { qte: e.target.value === "" ? null : Number(e.target.value), unite: it.unite || "pièce" })}
                    />
                    <select value={it.unite || "pièce"} onChange={(e) => update(i, { unite: e.target.value })} aria-label={`Unité de ${it.nom}`}>
                      {UNITS.filter(Boolean).map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button type="button" className="ok" onClick={() => setEditIdx(null)}>OK</button>
                    <span className="exp-edit">
                      <span>À finir avant</span>
                      <input type="date" value={it.exp || ""} min={isoDay(-2)} onChange={(e) => update(i, { exp: e.target.value || undefined })} aria-label={`Date limite de ${it.nom}`} />
                      <button type="button" className="exp-quick" onClick={() => update(i, { exp: isoDay(1) })}>demain</button>
                      <button type="button" className="exp-quick" onClick={() => update(i, { exp: isoDay(3) })}>3 jours</button>
                      {it.exp && <button type="button" className="exp-quick" onClick={() => update(i, { exp: undefined })}>aucune</button>}
                    </span>
                  </span>
                ) : (
                  <button type="button" className={"qbtn" + (it.qte == null ? " empty-q" : "")} onClick={() => setEditIdx(i)} aria-label={`Modifier la quantité de ${it.nom}`}>
                    {it.qte == null ? "+ qté" : qtyLabel(it)}
                  </button>
                )}
                {editIdx !== i && it.exp && <ExpBadge exp={it.exp} onClick={() => setEditIdx(i)} />}
                <button className="x" type="button" onClick={() => { setEditIdx(null); remove(i); }} aria-label={`Retirer ${it.nom}`}>×</button>
              </span>
            ))}
          </div>
          {fridge.length > 0 && <p className="hint hide-sm">Touche une quantité pour la modifier ou indiquer une date limite : les produits à finir vite passent en priorité.</p>}
          {found?.unknown.length > 0 && (
            <p className="note">Le carnet ne connaît pas encore : {found.unknown.join(", ")}.{info?.ai ? " Le chef, lui, saura quoi en faire." : ""}</p>
          )}

          <div className="prefs">
            <div className="filters" role="group" aria-label="Type de recette">
              {TYPES.map(([v, l, short]) => (
                <button key={v} className="f" type="button" aria-pressed={type === v} onClick={() => setType(v)}>
                  <span className="hide-sm">{l}</span><span className="show-sm">{short}</span>
                </button>
              ))}
            </div>
            <div className="opts">
              <label className="opt"><span aria-hidden="true">⏱</span>
                <select id="temps" value={temps} onChange={(e) => setTemps(e.target.value)} aria-label="Temps">
                  <option value="0">Tout temps</option><option value="20">≤ 20 min</option>
                  <option value="40">≤ 40 min</option><option value="90">≤ 1 h 30</option>
                </select>
              </label>
              <label className="opt"><span aria-hidden="true">👥</span>
                <select id="personnes" value={personnes} onChange={(e) => setPersonnes(e.target.value)} aria-label="Nombre de personnes">
                  {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>Pour {n}</option>)}
                </select>
              </label>
              <label className="opt"><span aria-hidden="true">🌿</span>
                <select id="regime" value={regime} onChange={(e) => setRegime(e.target.value)} aria-label="Régime">
                  <option value="">Régime</option><option>végétarien</option><option>vegan</option>
                  <option>sans gluten</option><option>sans lactose</option><option>sans porc</option><option>halal</option>
                </select>
              </label>

            </div>
            <div className="placard-row">
              <button type="button" className={"allergy-btn" + (sans.length ? " on" : "")} aria-expanded={showAllergies} onClick={() => setShowAllergies((v) => !v)}>
                <span aria-hidden="true">⚠︎</span> {sans.length ? `Sans ${sans.map(allergenLabel).join(", ")}` : "Allergies"}
              </button>
              <label className="switch" title="Sel, poivre, huile, beurre, farine, sucre, oignon, ail, pâtes, riz, semoule, épices, bouillon, moutarde…">
                <input type="checkbox" checked={basiques && placard} onChange={(e) => { setBasiques(e.target.checked); setPlacard(e.target.checked); }} />
                <span className="track" aria-hidden="true" />
                J'ai un placard de base
              </label>
            </div>
            {showAllergies && (
              <div className="allergies" role="group" aria-label="Allergies">
                <p className="hint" style={{ marginTop: 0 }}>Masquer les recettes qui contiennent :</p>
                <div className="allergy-chips">
                  {ALLERGENS.map((a) => (
                    <button key={a.key} type="button" className="f" aria-pressed={sans.includes(a.key)}
                      onClick={() => setSans((l) => (l.includes(a.key) ? l.filter((x) => x !== a.key) : [...l, a.key]))}>{a.label}</button>
                  ))}
                </div>
                <p className="hint">Déduit des ingrédients des recettes. Vérifie toujours les étiquettes des produits (bouillon, pâtes, sauces…).</p>
              </div>
            )}
            <p className="hint">{basiques && placard ? "On suppose que tu as sel, huile, beurre, farine, oignon, ail, pâtes, riz et épices." : "Seuls les ingrédients de ton frigo comptent."}</p>
          </div>

          <div className="actions">
            {info?.ai && <>
              <button className="cta" type="button" onClick={generate} disabled={busy}>Le chef invente pour moi</button>
              <button className="ghost" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>Photo du frigo</button>
              <input ref={fileRef} className="hidden-file" type="file" accept="image/*" onChange={onPhoto} tabIndex={-1} aria-hidden="true" />
            </>}
            {(
              <button id="see-recipes" className="cta big" type="button" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
                {found && results.length ? `Voir les ${results.length} recettes →` : "Voir les recettes →"}
              </button>
            )}
            {carnet && (
              <button className="ghost surprise" type="button" onClick={surprise}>
                <span aria-hidden="true">🎲</span> Surprends-moi
              </button>
            )}
          </div>
          <div className={"status" + (status.err ? " err" : "") + (status.chef ? " chef" : "")} role="status">{status.text}</div>

          {showOffer && info && !info.pro && info.billing && (
            <div className="offer">
              <h3>Le chef a fini son service du jour</h3>
              <p className="empty">Le carnet reste gratuit et illimité. Avec l'abonnement :</p>
              <ul>
                <li>Recettes inventées pour ton frigo, avec tes quantités exactes</li>
                <li>Analyse de photo du frigo</li>
                <li>Résiliable en un clic, sans engagement</li>
              </ul>
              <div className="actions" style={{ marginTop: 6 }}>
                <span className="price">{info.priceLabel}</span>
                <button className="cta" onClick={goPay} disabled={busy}>S'abonner</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {favs.length > 0 && (
        <section className="recipes favs" id="favoris" aria-label="Mes favoris">
          <div className="in">
            <div className="sec">
              <h2>Mes favoris</h2>
              <span>
                {user
                  ? `${favs.length} recette${favs.length > 1 ? "s" : ""} · enregistrés sur ton compte`
                  : <>Enregistrés sur cet appareil · <button className="link" type="button" onClick={() => openAuth("signup")}>crée un compte</button> pour les garder partout</>}
              </span>
            </div>
            <div className="grid">
              {favRecipes.slice(0, favShown).map((r) => <Card key={"f" + r.id} r={r} onOpen={openSheet} fav onFav={toggleFav} rating={ratings[r.id]} />)}
            </div>
            {favRecipes.length > favShown && (
              <button className="ghost more" type="button" onClick={() => setFavShown((n) => n + PAGE)}>Voir plus de favoris</button>
            )}
          </div>
        </section>
      )}

      <section className="recipes" id="menu" aria-label="Recettes">
        <div className="in">
          <div className="sec">
            <h2>Au menu</h2>
            <span>{found ? `${results.length} recette${results.length > 1 ? "s" : ""} possible${results.length > 1 ? "s" : ""} avec ton frigo` : "Chargement du carnet…"}</span>
          </div>
          {fridgeFams.length > 0 && (
            <div className="legend" aria-hidden="true">
              {fridgeFams.map((f) => <span key={f}><Ico fam={f} rot={0} />{FAM[f].l}</span>)}
            </div>
          )}

          {results.some((r) => r.photo) && <p className="note" style={{ margin: "-10px 0 18px" }}>Photos générées par IA, à titre indicatif.</p>}

          {aiRecipes && (
            <div className="grid" ref={aiRef} style={{ marginBottom: 18 }}>
              {aiRecipes.map((r, i) => <Card key={"ai" + i} r={r} ai onOpen={openSheet} />)}
            </div>
          )}

          {found && results.length === 0 && (
            <p className="empty">
              {fridge.length
                ? `Rien dans le carnet avec ces filtres. Élargis le temps ou le type${info?.ai ? ", ou demande au chef une recette sur mesure" : ", ou ajoute d'autres ingrédients"}.`
                : "Ajoute ce qui traîne dans ton frigo : les recettes apparaissent ici au fur et à mesure."}
            </p>
          )}
          <div className="grid">
            {results.slice(0, shown).map((r) => <Card key={r.id} r={r} onOpen={openSheet} fav={favSet.has(r.id)} onFav={toggleFav} rating={ratings[r.id]} />)}
          </div>
          {results.length > shown && (
            <button className="ghost more" type="button" onClick={() => setShown((n) => n + PAGE)}>
              Voir {Math.min(PAGE, results.length - shown)} recettes de plus
            </button>
          )}
        </div>
      </section>

      {seasonal.length > 0 && (
        <section className="recipes season" aria-label="De saison">
          <div className="in">
            <div className="sec">
              <h2>De saison en {day.month}</h2>
              <span><a href="/avec">Toutes les idées par ingrédient →</a></span>
            </div>
            <div className="grid">
              {seasonal.map((r) => <Card key={"s" + r.id} r={r} onOpen={openSheet} fav={favSet.has(r.id)} onFav={toggleFav} rating={ratings[r.id]} />)}
            </div>
          </div>
        </section>
      )}

      {!menuVisible && !ctaVisible && results.length > 0 && (
        <button type="button" className="float-cta" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
          Voir les {results.length} recettes ↓
        </button>
      )}

      <footer>
        <div className="in foot-news"><Newsletter /></div>
        <div className="in">
          <div>
            <span>fricette · fait avec amour et des restes</span>
            {user && <> · <a href="/compte">Mon compte</a></>}
            {info?.pro ? (
              <> · <button className="link" onClick={goPortal}>Gérer mon abonnement</button></>
            ) : info?.billing && info.restore ? (
              <> · <button className="link" onClick={() => setShowRestore((v) => !v)}>Déjà abonné·e ?</button></>
            ) : null}
            {showRestore && (
              <form className="restore" onSubmit={restore}>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail utilisé pour le paiement" aria-label="E-mail" />
                <button className="btn" type="submit">Recevoir un lien</button>
              </form>
            )}
          </div>
          <span className="foot-links">
            <a href="/avec">Idées par ingrédient</a>
            <a href="/gestes">Gestes en vidéo</a>
            <a href="/planning">Planning</a>
            <a href="/courses">Liste de courses</a>
            <a href="/conditions">Conditions</a>
          </span>
        </div>
      </footer>

      {scanOpen && <Scanner onAdd={addScanned} onRemove={removeScanned} onClose={() => setScanOpen(false)} />}

      <dialog className="sheet" ref={sheetRef} onClose={() => setOpenRecipe(null)} onClick={(e) => { if (e.target === sheetRef.current) sheetRef.current.close(); }}>
        {openRecipe && <Sheet r={openRecipe} onClose={() => sheetRef.current?.close()} fav={favSet.has(openRecipe.id)} onFav={openRecipe.id ? toggleFav : null} />}
      </dialog>

      <dialog className="sheet auth" ref={authRef} onClick={(e) => { if (e.target === authRef.current) authRef.current.close(); }}>
        <form className="auth-body" onSubmit={submitAuth}>
          <button className="close" type="button" onClick={() => authRef.current?.close()} aria-label="Fermer">×</button>
          {auth.mode === "delete" ? (
            <>
              <h2>Supprimer mon compte</h2>
              <p className="muted">Ton compte et tous tes favoris seront effacés définitivement. Confirme avec ton mot de passe.</p>
            </>
          ) : auth.mode === "forgot" ? (
            <>
              <h2>Mot de passe oublié</h2>
              <p className="muted">Indique l'adresse de ton compte : on t'envoie un lien pour choisir un nouveau mot de passe.</p>
              <label className="field">E-mail
                <input id="auth-email" type="email" required autoComplete="email" value={auth.email} onChange={(e) => setAuth((a) => ({ ...a, email: e.target.value }))} />
              </label>
            </>
          ) : auth.mode === "reset" ? (
            <>
              <h2>Nouveau mot de passe</h2>
              <p className="muted">Choisis ton nouveau mot de passe. Tu seras ensuite connecté·e, et déconnecté·e de tes autres appareils.</p>
            </>
          ) : (
            <>
              <h2>{auth.mode === "signup" ? "Créer un compte" : "Se connecter"}</h2>
              <p className="muted">Retrouve tes recettes favorites sur ton téléphone comme sur ton ordinateur. C'est gratuit.</p>
              <div className="tabs" role="tablist">
                <button type="button" role="tab" aria-selected={auth.mode === "login"} className="f" aria-pressed={auth.mode === "login"} onClick={() => setAuth((a) => ({ ...a, mode: "login", error: "" }))}>J'ai un compte</button>
                <button type="button" role="tab" aria-selected={auth.mode === "signup"} className="f" aria-pressed={auth.mode === "signup"} onClick={() => setAuth((a) => ({ ...a, mode: "signup", error: "" }))}>Créer un compte</button>
              </div>
              <label className="field">E-mail
                <input id="auth-email" type="email" required autoComplete="email" value={auth.email} onChange={(e) => setAuth((a) => ({ ...a, email: e.target.value }))} />
              </label>
            </>
          )}
          {auth.mode !== "forgot" && (
            <label className="field">{auth.mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}{(auth.mode === "signup" || auth.mode === "reset") && <small> (8 caractères minimum)</small>}
              <input id="auth-password" type="password" required minLength={auth.mode === "signup" || auth.mode === "reset" ? 8 : undefined}
                autoComplete={auth.mode === "signup" || auth.mode === "reset" ? "new-password" : "current-password"}
                value={auth.password} onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))} />
            </label>
          )}
          {auth.error && <p className="status err">{auth.error}</p>}
          {auth.info && <p className="status ok-msg">{auth.info}</p>}
          {!(auth.mode === "forgot" && auth.info) && (
            <button className="cta" type="submit" disabled={auth.busy}>
              {auth.mode === "delete" ? "Supprimer définitivement"
                : auth.mode === "signup" ? "Créer mon compte"
                : auth.mode === "forgot" ? "Recevoir le lien"
                : auth.mode === "reset" ? "Enregistrer et me connecter"
                : "Me connecter"}
            </button>
          )}
          {auth.mode === "login" && (
            mailEnabled
              ? <button type="button" className="link small-link" onClick={() => setAuth((a) => ({ ...a, mode: "forgot", error: "", info: "", password: "" }))}>Mot de passe oublié ?</button>
              : <p className="muted small">Mot de passe oublié ? Écris-nous à bonjour@fricette.ch.</p>
          )}
          {auth.mode === "forgot" && (
            <button type="button" className="link small-link" onClick={() => setAuth((a) => ({ ...a, mode: "login", error: "", info: "" }))}>← Retour à la connexion</button>
          )}
        </form>
      </dialog>
    </div>
  );
}

function Card({ r, ai, onOpen, fav, onFav, rating }) {
  const { missing, short, pct, fams } = summary(r);
  return (
    <div className={"card" + (ai ? " ai" : "")}>
      <button type="button" className="card-hit" onClick={() => onOpen(r)}>
        <div className="art">
          {r.photo
            ? <img src={r.photo} alt="" loading="lazy" />
            : <div className="fill" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams) }} />}
          {ai && <span className="chef-tag">Le chef</span>}
          <span className="score">{pct} %</span>
        </div>
        <div className="txt">
          <h3>{r.titre}</h3>
          <div className="meta">{[r.temps && `${r.temps} min`, r.difficulte, `${r.portions} pers.`].filter(Boolean).join(" · ")}{rating && <> · <StarAvg v={rating} /></>}</div>
          {r.urgent?.length > 0 && <div className="urgent">⏰ Finit {r.urgent.join(", ")}</div>}
          <div className={"miss" + (missing.length ? "" : " ok")}>
            {missing.length ? `Il manque : ${missing.map((m) => m.nom).join(", ")}` : "Tu as tout"}
            {short.length > 0 && <span className="juste"> · un peu juste : {short.map((m) => m.nom).join(", ")}</span>}
          </div>
        </div>
      </button>
      {onFav && r.id && <FavButton on={fav} onClick={() => onFav(r.id)} label={false} />}
    </div>
  );
}

function Sheet({ r, onClose, fav, onFav }) {
  const { fams } = summary(r);
  return (
    <article>
      {r.photo
        ? <div className="art"><img src={r.photo} alt={r.titre} /><span className="ai-tag">Photo générée par IA</span></div>
        : <div className="art" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams, { w: 640, h: 280 }) }} />}
      <button className="close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      <div className="sheet-body">
        <RecipeBody r={r} fav={fav} onFav={onFav} pageLink />
      </div>
    </article>
  );
}

// Les recettes du chef arrivent avec du_frigo : on les met au même format que le carnet.
function fromAi(r) {
  const ingredients = (r.ingredients || []).map((i) => ({ nom: i.nom, quantite: i.quantite, etat: i.du_frigo ? "have" : "need", fam: familyOfName(i.nom) }));
  return { ...r, ingredients };
}

// Réduit la photo (1280 px max) avant l'envoi : plus rapide et moins cher.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    img.src = url;
  });
}
