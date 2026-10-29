"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suggest, pick, familyOfName, resolve, norm, daysLeft, searchCarnet } from "@/lib/match";
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
import Logo from "./components/Logo";
import QtySheet from "./components/QtySheet";
import { me, getList, setList, mergeAfterLogin, getRatings, track, loadLocal, saveLocal } from "@/lib/client";

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
// Transforme une phrase dictée en ingrédients : « quatre œufs, 200 g de feta et un reste de riz ».
const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12, demi: 0.5, "une demi": 0.5 };
const UNITES_DITES = [[/^(kilos?|kg)$/, "kg"], [/^(grammes?|g)$/, "g"], [/^(litres?|l)$/, "l"], [/^(centilitres?|cl)$/, "cl"], [/^(millilitres?|ml)$/, "ml"], [/^tranches?$/, "tranche"], [/^(boîtes?|boites?)$/, "boîte"], [/^pots?$/, "pot"], [/^bottes?$/, "botte"], [/^gousses?$/, "gousse"]];
function parseSpoken(text) {
  return text.toLowerCase().split(/,| et |;| puis /).map((x) => x.trim()).filter(Boolean).map((part) => {
    let words = part.replace(/^(du|de la|des|de l'|d'|un reste de|un peu de|il y a|j'ai)\s+/, "").split(/\s+/);
    let qte = null, unite = "";
    const n = /^\d+([.,]\d+)?$/.test(words[0]) ? parseFloat(words[0].replace(",", ".")) : NOMBRES[words[0]];
    if (n) { qte = n; unite = "pièce"; words = words.slice(1); }
    const u = UNITES_DITES.find(([re]) => re.test(words[0] || ""));
    if (u && qte != null) { unite = u[1]; words = words.slice(1); }
    if (words[0] === "de" || words[0] === "d'") words = words.slice(1);
    let nom = words.join(" ").replace(/^(d'|de |du |des )/, "").trim();
    const sg = suggestIngredients(nom, new Set())[0];
    if (sg && norm(sg.nom).startsWith(norm(nom).slice(0, 4))) nom = sg.nom;
    return nom ? { nom, qte, unite } : null;
  }).filter(Boolean);
}

const isoDay = (plus) => { const d = new Date(); d.setDate(d.getDate() + plus); return d.toLocaleDateString("sv-SE"); };
function ExpBadge({ exp, onClick }) {
  const d = daysLeft(exp);
  if (d == null) return null;
  const txt = d < 0 ? "date passée" : d === 0 ? "aujourd'hui" : d === 1 ? "demain" : `J-${d}`;
  return <button type="button" className={"exp-badge" + (d <= 1 ? " hot" : d <= 3 ? " warm" : "")} onClick={onClick} title={`À finir avant le ${exp.split("-").reverse().join(".")}`}>⏰ {txt}</button>;
}
const qtyLabel = (it) => (it.unite === "pièce" || !it.unite ? `${it.qte}` : `${it.qte} ${it.unite}`);

// L'ancien frigo de démonstration, pré-rempli pour tout le monde jusqu'en octobre 2026 :
// s'il n'a pas été modifié, on repart d'un frigo vide.
const OLD_DEMO = "œufs|courgette|feta|tomates cerises|crème|pâtes";
const oldDemo = (f) => f.map((x) => x.nom).join("|") === OLD_DEMO && f.every((x) => !x.exp);



export default function HomeClient({ mascot }) {
  const [fridge, setFridge] = useState([]);
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [temps, setTemps] = useState("40");
  const [regime, setRegime] = useState("");
  const [type, setType] = useState("");
  const [personnes, setPersonnes] = useState("2");
  const [basiques, setBasiques] = useState(true);
  const [placard, setPlacard] = useState(true);
  const [sans, setSans] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(false);
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
    const io2 = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting || e.boundingClientRect.top > 0), { threshold: 0 }); // bouton flottant seulement une fois le gros bouton dépassé
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
      if (Array.isArray(saved)) setFridge(oldDemo(saved) ? [] : saved);
    } catch {}
    applyPrefs(loadLocal("frc-prefs", {}));
    setRecent(loadLocal("frc-recent", []));
    const q0 = new URLSearchParams(window.location.search).get("q");
    if (q0 !== null) { setQuery(q0); window.history.replaceState(null, "", "/"); setTimeout(() => { document.getElementById("recherche")?.scrollIntoView({ behavior: "smooth", block: "start" }); document.getElementById("search")?.focus({ preventScroll: true }); }, 400); }
    loaded.current = true;
    fetch("/carnet-lite.json").then((r) => r.json()).then(setCarnet).catch(() => setCarnet([]));
    let local = [];
    try { local = JSON.parse(localStorage.getItem("frc-favs") || "[]"); } catch {}
    setFavs(Array.isArray(local) ? local : []);
    me().then((d) => {
      setMailEnabled(!!d.mail);
      if (d.user) {
        setUser(d.user); setFavs(d.favorites || []);
        if (Array.isArray(d.data?.frigo)) setFridge(oldDemo(d.data.frigo) ? [] : d.data.frigo);
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
    setList("prefs", { ...loadLocal("frc-prefs", {}), personnes: Number(personnes), temps, regime, placard: basiques && placard, sans });
  }, [personnes, temps, regime, basiques, placard, sans]);

  const opts = { temps: Number(temps), regime, personnes: Number(personnes), basiques, placard, type, sans, now };
  const found = useMemo(
    () => (carnet ? suggest(carnet, fridge, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carnet, fridge, temps, regime, personnes, basiques, placard, type, sans, now]
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

  // Dictée : « quatre œufs, deux courgettes et un reste de riz »
  const [voiceOk, setVoiceOk] = useState(false);
  const [listening, setListening] = useState(false);
  useEffect(() => { setVoiceOk(!!(window.SpeechRecognition || window.webkitSpeechRecognition)); }, []);
  function dictate() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const rec = new SR();
    rec.lang = "fr-FR"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const items = parseSpoken(text);
      if (!items.length) return;
      for (const it of items) { const k = resolve(it.nom); track(k ? "ing" : "unknown", k || it.nom); }
      setFridge((f) => {
        const next = [...f];
        for (const it of items) if (!next.some((x) => x.nom.toLowerCase() === it.nom.toLowerCase())) next.push(it);
        return next;
      });
      setStatus({ text: `Ajouté : ${items.map((x) => x.nom).join(", ")}. Vérifie les quantités si besoin.`, err: false });
    };
    rec.onerror = (e) => setStatus({ text: e.error === "not-allowed" ? "Autorise le micro pour dicter tes ingrédients." : "Je n'ai pas bien entendu, réessaie.", err: true });
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
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
  // Unité habituelle d'un ingrédient dans le carnet (lait -> ml, feta -> g, œufs -> pièce)
  const usualUnit = useMemo(() => {
    const m = new Map();
    for (const r of carnet || []) for (const g of r.ingredients) {
      if (!g.unite || g.unite.startsWith("c. à")) continue;
      const c = m.get(g.cle) || {}; c[g.unite] = (c[g.unite] || 0) + 1; m.set(g.cle, c);
    }
    return m;
  }, [carnet]);
  const unitFor = (nom) => {
    const c = usualUnit.get(resolve(nom));
    return c ? Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] : "pièce";
  };
  const settingsSummary = [
    `Pour ${personnes}`,
    temps === "0" ? "tout temps" : `≤ ${temps === "90" ? "1 h 30" : temps + " min"}`,
    regime,
    sans.length ? `sans ${sans.map(allergenLabel).join(", ")}` : "",
    basiques && placard ? "" : "sans placard",
  ].filter(Boolean).join(" · ");
  const inFridge = new Set(fridge.map((it) => resolve(it.nom)).filter(Boolean));
  const sugs = useMemo(() => suggestIngredients(name, inFridge), [name, fridge]); // eslint-disable-line react-hooks/exhaustive-deps
  const quick = QUICK.filter((q) => !inFridge.has(resolve(q))).slice(0, 8);
  const fridgeFams = [...new Set(fridge.map((it) => familyOfName(it.nom)))].filter((f) => f !== "gris");

  // Les étapes ne sont pas dans la version légère du carnet : on les charge à l'ouverture.
  const fullCache = useRef(new Map());
  const [sheetRaw, setSheetRaw] = useState(null); // recette complète ouverte (pour recalculer les quantités)
  const [sheetPers, setSheetPers] = useState(2);
  async function openSheet(r) {
    const show = () => requestAnimationFrame(() => { if (!sheetRef.current?.open) sheetRef.current?.showModal?.(); });
    if (!r.id) { setSheetRaw(null); setOpenRecipe(r); show(); return; } // recette du chef
    track("open", r.id);
    rememberRecent(r.id);
    setSheetPers(Number(personnes));
    let full = fullCache.current.get(r.id);
    if (full) { setSheetRaw(full); setOpenRecipe(r); show(); return; }
    setSheetRaw(null);
    setOpenRecipe({ ...r, etapes: [], loading: true });
    show();
    try {
      full = await fetch(`/api/recette/${r.id}`).then((x) => x.json());
      fullCache.current.set(r.id, full);
      setSheetRaw((cur) => cur || full);
    } catch {
      setOpenRecipe((cur) => (cur?.id === r.id ? { ...cur, loading: false, etapes: ["Connexion perdue : impossible de charger les étapes. Réessaie."] } : cur));
    }
  }
  const sheetRecipe = sheetRaw && openRecipe?.id === sheetRaw.id
    ? pick([sheetRaw], [sheetRaw.id], fridge, { ...opts, personnes: sheetPers })[0]
    : openRecipe;

  // Recettes vues récemment (sur cet appareil)
  const [recent, setRecent] = useState([]);
  function rememberRecent(id) {
    setRecent((l) => {
      const next = [id, ...l.filter((x) => x !== id)].slice(0, 12);
      saveLocal("frc-recent", next);
      return next;
    });
  }

  // Recherche par nom
  const [query, setQuery] = useState("");
  const searchResults = useMemo(() => (carnet && query.trim().length >= 2 ? pick(carnet, searchCarnet(carnet, query).map((r) => r.id), fridge, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carnet, query, fridge, personnes, basiques, placard]);

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
        mergeAfterLogin().then((m) => { if (Array.isArray(m.data?.frigo)) setFridge(oldDemo(m.data.frigo) ? [] : m.data.frigo); });
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
          <Logo />
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
            {mascot}
            <h1>Ton frigo est plein d'idées. <em>On les cuisine.</em></h1>
            <p>
              Dis ce qui traîne au frais et en quelle quantité. Fricette te propose des recettes où il ne te manque
              rien, ou presque.
            </p>
            <button className="cta" type="button" onClick={() => {
              document.getElementById("frigo")?.scrollIntoView({ behavior: "smooth" });
              if (!fridge.length) setTimeout(() => document.getElementById("ing")?.focus({ preventScroll: true }), 500);
            }}>
              Voir ce que je peux cuisiner
            </button>
            <ol className="steps-mini" aria-label="Comment ça marche">
              <li><b>1</b><span><strong>Ton frigo</strong>tape, dicte ou scanne ce que tu as</span></li>
              <li><b>2</b><span><strong>Tes recettes</strong>parmi {carnet?.length || 900}, gratuites</span></li>
              <li><b>3</b><span><strong>Tu cuisines</strong>avec les bonnes quantités, zéro gaspi</span></li>
            </ol>
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
          <div className="fridge-card">
            <div className="fridge-head">
              <h2>Ton frigo</h2>
              {fridge.length > 0 && <span className="fridge-count">{fridge.length} ingrédient{fridge.length > 1 ? "s" : ""}</span>}
              {fridge.length > 0 && <button className="clear-link" type="button" onClick={clearFridge} disabled={busy}>Vider</button>}
            </div>

            <form className="addbar" onSubmit={add} onKeyDown={onAddKey}>
              <svg className="i plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              <input id="ing" value={name} onChange={(e) => { setName(e.target.value); setSugIdx(0); }} placeholder="Ajoute un ingrédient…"
                aria-label="Ingrédient" autoComplete="off" role="combobox" aria-expanded={sugs.length > 0} aria-controls="ing-sugs"
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
              {voiceOk && (
                <button className={"icon-btn" + (listening ? " on" : "")} type="button" onClick={dictate} aria-label="Dicter les ingrédients" title="Dicter">
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                </button>
              )}
              <button className="icon-btn" type="button" onClick={() => setScanOpen(true)} aria-label="Scanner un code-barres" title="Scanner un code-barres">
                <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5h3M17 5h3v2M20 17v2h-3M7 19H4v-2M8 9v6M11 9v6M14 9v6M17 9v6" /></svg>
              </button>
              <button className="add-btn" type="submit" aria-label="Ajouter"><span className="hide-sm">Ajouter</span><span className="show-sm" aria-hidden="true">+</span></button>
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
            </form>
            {listening && <p className="hint">🎤 J'écoute… dis par exemple « quatre œufs, deux courgettes et du riz ».</p>}

            {quick.length > 0 && (
              <div className="quick" aria-label="Ajout rapide">
                {quick.map((q) => (
                  <button key={q} type="button" className="quick-chip" onClick={() => addNames([q])}>+ {q}</button>
                ))}
              </div>
            )}

            {cleared && (
              <p className="undo-bar" role="status">
                Frigo vidé.
                <button className="link" type="button" onClick={() => { setFridge(cleared); setCleared(null); }}>Annuler</button>
              </p>
            )}
            {fridge.length === 0 && !cleared && (
              <p className="fridge-empty">Ton frigo est vide pour l'instant. Ajoute ce qui traîne au frais : les recettes s'affichent au fur et à mesure.</p>
            )}
            {fridge.length > 0 && (
              <div className="tokens">
                {fridge.map((it, i) => (
                  <span className={"token" + (editIdx === i ? " editing" : "")} key={it.nom + i}>
                    <Ico fam={familyOfName(it.nom)} />
                    <span className="n">{it.nom}</span>
                    <button type="button" className={"qbtn" + (it.qte == null ? " empty-q" : "")} onClick={() => setEditIdx(i)} aria-label={`Préciser ${it.nom}`}>
                      {it.qte == null ? "+ qté" : qtyLabel(it)}
                    </button>
                    {it.exp && <ExpBadge exp={it.exp} onClick={() => setEditIdx(i)} />}
                    <button className="x" type="button" onClick={() => { setEditIdx(null); remove(i); }} aria-label={`Retirer ${it.nom}`}>×</button>
                  </span>
                ))}
              </div>
            )}
            {fridge.length > 0 && <p className="hint hide-sm">Touche « + qté » pour préciser une quantité ou une date limite : les produits à finir vite passent en premier.</p>}
            {found?.unknown.length > 0 && (
              <p className="note">Le carnet ne connaît pas encore : {found.unknown.join(", ")}.{info?.ai ? " Le chef, lui, saura quoi en faire." : ""}</p>
            )}
            <Bilan compact />
          </div>

          <div className="toolbar">
            <div className="seg" role="group" aria-label="Type de recette">
              {TYPES.map(([v, l, short]) => (
                <button key={v} type="button" aria-pressed={type === v} onClick={() => setType(v)}>
                  <span className="hide-sm">{l}</span><span className="show-sm">{short}</span>
                </button>
              ))}
            </div>
            <button type="button" className={"settings-btn" + (showSettings ? " open" : "")} aria-expanded={showSettings} onClick={() => setShowSettings((v) => !v)}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
              <span className="settings-sum">{settingsSummary}</span>
            </button>
          </div>

          {showSettings && (
            <div className="settings">
              <div className="settings-grid">
                <label className="field">Nombre de personnes
                  <select id="personnes" value={personnes} onChange={(e) => setPersonnes(e.target.value)}>
                    {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n} personne{n > 1 ? "s" : ""}</option>)}
                  </select>
                </label>
                <label className="field">Temps maximum
                  <select id="temps" value={temps} onChange={(e) => setTemps(e.target.value)}>
                    <option value="0">Peu importe</option><option value="20">20 minutes</option>
                    <option value="40">40 minutes</option><option value="90">1 h 30</option>
                  </select>
                </label>
                <label className="field">Régime
                  <select id="regime" value={regime} onChange={(e) => setRegime(e.target.value)}>
                    <option value="">Aucun</option><option>végétarien</option><option>vegan</option>
                    <option>sans gluten</option><option>sans lactose</option><option>sans porc</option><option>halal</option>
                  </select>
                </label>
              </div>
              <div className="field">Allergies : masquer les recettes avec
                <div className="allergy-chips">
                  {ALLERGENS.map((a) => (
                    <button key={a.key} type="button" className="f" aria-pressed={sans.includes(a.key)}
                      onClick={() => setSans((l) => (l.includes(a.key) ? l.filter((x) => x !== a.key) : [...l, a.key]))}>{a.label}</button>
                  ))}
                </div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={basiques && placard} onChange={(e) => { setBasiques(e.target.checked); setPlacard(e.target.checked); }} />
                <span className="track" aria-hidden="true" />
                <span>J'ai un placard de base <small>sel, huile, beurre, farine, oignon, ail, pâtes, riz, épices</small></span>
              </label>
              <button type="button" className="btn small" onClick={() => setShowSettings(false)}>OK</button>
            </div>
          )}

          <div className="actions">
            {info?.ai && <>
              <button className="cta" type="button" onClick={generate} disabled={busy}>Le chef invente pour moi</button>
              <button className="ghost" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>Photo du frigo</button>
              <input ref={fileRef} className="hidden-file" type="file" accept="image/*" onChange={onPhoto} tabIndex={-1} aria-hidden="true" />
            </>}
            <button id="see-recipes" className="cta big" type="button" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} disabled={!fridge.length}>
              {fridge.length && found ? `Voir les ${results.length} recette${results.length > 1 ? "s" : ""} →` : "Voir les recettes →"}
            </button>
            {carnet && (
              <button className="ghost surprise" type="button" onClick={surprise} aria-label="Surprends-moi : une recette au hasard">
                <span aria-hidden="true">🎲</span> <span className="hide-sm">Surprends-moi</span>
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

      {recent.length > 0 && carnet && (
        <section className="recent in" aria-label="Vues récemment">
          <div className="recent-head"><strong>Vues récemment</strong><button type="button" className="link" onClick={() => { setRecent([]); saveLocal("frc-recent", []); }}>Effacer</button></div>
          <div className="recent-row">
            {pick(carnet, recent, fridge, opts).map((r) => (
              <button key={"r" + r.id} type="button" className="recent-card" onClick={() => openSheet(r)}>
                {r.photo ? <img src={r.photo} alt="" loading="lazy" /> : <span className="ph" />}
                <span>{r.titre}</span>
              </button>
            ))}
          </div>
        </section>
      )}

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
          <div className="searchbar" id="recherche">
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher une recette : risotto, tiramisu, poulet…" aria-label="Chercher une recette par son nom" autoComplete="off" />
            {query && <button type="button" className="x" onClick={() => setQuery("")} aria-label="Effacer la recherche">×</button>}
          </div>
          {searchResults ? (
            <>
              <div className="sec">
                <h2>Recherche</h2>
                <span>{searchResults.length ? `${searchResults.length} recette${searchResults.length > 1 ? "s" : ""} pour « ${query.trim()} »` : `Aucune recette pour « ${query.trim()} »`}</span>
              </div>
              {searchResults.length === 0 && <p className="empty">Essaie un autre mot, ou un ingrédient : « courgette », « chocolat »…</p>}
              <div className="grid" style={{ marginBottom: 34 }}>
                {searchResults.map((r) => <Card key={"q" + r.id} r={r} onOpen={openSheet} fav={favSet.has(r.id)} onFav={toggleFav} rating={ratings[r.id]} />)}
              </div>
            </>
          ) : null}
          <div className="sec">
            <h2>Au menu</h2>
            <span>{found ? `${results.length} recette${results.length > 1 ? "s" : ""} possible${results.length > 1 ? "s" : ""} avec ton frigo` : "Chargement du carnet…"}</span>
          </div>
          {fridge.length > 0 && (
            <div className="seg small menu-seg" role="group" aria-label="Recettes à afficher">
              <button type="button" aria-pressed={!now} onClick={() => setNow(false)}>Toutes</button>
              <button type="button" aria-pressed={now} onClick={() => setNow(true)}>✓ Prêtes tout de suite</button>
            </div>
          )}
          {fridgeFams.length > 0 && (
            <div className="legend" aria-hidden="true">
              {fridgeFams.map((f) => <span key={f}><Ico fam={f} rot={0} />{FAM[f].l}</span>)}
            </div>
          )}


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

      {editIdx != null && fridge[editIdx] && (
        <QtySheet key={editIdx} item={fridge[editIdx]} defaultUnit={unitFor(fridge[editIdx].nom)}
          onSave={(patch) => { update(editIdx, patch); setEditIdx(null); }}
          onRemove={() => { remove(editIdx); setEditIdx(null); }}
          onClose={() => setEditIdx(null)} />
      )}
      {scanOpen && <Scanner onAdd={addScanned} onRemove={removeScanned} onClose={() => setScanOpen(false)} />}

      <dialog className="sheet" ref={sheetRef} onClose={() => { setOpenRecipe(null); setSheetRaw(null); }} onClick={(e) => { if (e.target === sheetRef.current) sheetRef.current.close(); }}>
        {sheetRecipe && <Sheet r={sheetRecipe} onClose={() => sheetRef.current?.close()} fav={favSet.has(sheetRecipe.id)} onFav={sheetRecipe.id ? toggleFav : null}
          persons={sheetRaw ? sheetPers : null} onPersons={setSheetPers} />}
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
  const { missing, short, swaps, fams } = summary(r);
  const badge = missing.length === 0 ? ["ok", "✓ Tu as tout"] : [missing.length === 1 ? "one" : "more", `Il manque ${missing.length}`];
  return (
    <div className={"card" + (ai ? " ai" : "")}>
      <button type="button" className="card-hit" onClick={() => onOpen(r)}>
        <div className="art">
          {r.photo
            ? <img src={r.photo} alt="" loading="lazy" />
            : <div className="fill" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams) }} />}
          {ai && <span className="chef-tag">Le chef</span>}
          <span className={"score " + badge[0]}>{badge[1]}</span>
        </div>
        <div className="txt">
          <h3>{r.titre}</h3>
          <div className="meta">{[r.temps && `${r.temps} min`, r.difficulte, `${r.portions} pers.`].filter(Boolean).join(" · ")}{rating && <> · <StarAvg v={rating} /></>}</div>
          {r.urgent?.length > 0 && <div className="urgent">⏰ Finit {r.urgent.join(", ")}</div>}
          {(missing.length > 0 || short.length > 0) && (
            <div className="miss">
              {missing.length > 0 && `Il manque : ${missing.map((m) => m.nom).join(", ")}`}
              {short.length > 0 && <span className="juste">{missing.length ? " · " : ""}un peu juste : {short.map((m) => m.nom).join(", ")}</span>}
            </div>
          )}
          {swaps?.length > 0 && <div className="swaps">↔ {swaps.map((x) => `${x.swap} au lieu de ${x.nom}`).join(", ")}</div>}
        </div>
      </button>
      {onFav && r.id && <FavButton on={fav} onClick={() => onFav(r.id)} label={false} />}
    </div>
  );
}

function Sheet({ r, onClose, fav, onFav, persons, onPersons }) {
  const { fams } = summary(r);
  return (
    <article>
      {r.photo
        ? <div className="art"><img src={r.photo} alt={r.titre} /><span className="ai-tag">Photo générée par IA</span></div>
        : <div className="art" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams, { w: 640, h: 280 }) }} />}
      <button className="close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      <div className="sheet-body">
        <RecipeBody r={r} fav={fav} onFav={onFav} pageLink controls={persons ? (
          <label className="chip select">
            <span className="sr">Nombre de personnes</span>
            <select value={persons} onChange={(e) => onPersons(Number(e.target.value))} aria-label="Nombre de personnes">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => <option key={n} value={n}>👥 Pour {n}</option>)}
            </select>
          </label>
        ) : null} />
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
