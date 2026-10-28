"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suggest, familyOfName } from "@/lib/match";
import { FAM, iconSvg, artSvg } from "@/lib/art";

const UNITS = ["", "pièce", "g", "kg", "ml", "cl", "l", "tranche", "botte", "boîte", "pot", "c. à s.", "c. à c.", "gousse"];
const UNIT_LABEL = (u) => (u === "" ? "—" : u);
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
  const [qte, setQte] = useState("");
  const [unite, setUnite] = useState("pièce");
  const [temps, setTemps] = useState("40");
  const [regime, setRegime] = useState("");
  const [type, setType] = useState("");
  const [personnes, setPersonnes] = useState("2");
  const [basiques, setBasiques] = useState(true);
  const [placard, setPlacard] = useState(true);
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
  const aiRef = useRef(null);
  const sheetRef = useRef(null);
  const [openRecipe, setOpenRecipe] = useState(null);
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
    loaded.current = true;
    fetch("/carnet.json").then((r) => r.json()).then(setCarnet).catch(() => setCarnet([]));
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
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem("olf-frigo", JSON.stringify(fridge)); } catch {}
  }, [fridge]);

  const opts = { temps: Number(temps), regime, personnes: Number(personnes), basiques, placard, type };
  const found = useMemo(
    () => (carnet ? suggest(carnet, fridge, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carnet, fridge, temps, regime, personnes, basiques, placard, type]
  );
  useEffect(() => setShown(PAGE), [fridge, temps, regime, personnes, basiques, placard, type]);

  async function refreshStatus() {
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      setInfo(await r.json());
    } catch {}
  }

  function add(e) {
    e.preventDefault();
    const names = name.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setFridge((f) => {
      const next = [...f];
      for (const n of names) {
        const i = next.findIndex((x) => x.nom.toLowerCase() === n.toLowerCase());
        const item = { nom: n, qte: names.length === 1 && qte !== "" ? Number(qte) : null, unite: names.length === 1 ? unite : "" };
        if (i >= 0) next[i] = item; else next.push(item);
      }
      return next;
    });
    setName(""); setQte("");
  }

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
  const fridgeFams = [...new Set(fridge.map((it) => familyOfName(it.nom)))].filter((f) => f !== "gris");

  function openSheet(r) {
    setOpenRecipe(r);
    requestAnimationFrame(() => sheetRef.current?.showModal?.());
  }

  const TYPES = [["", "De tout"], ["plats", "Un plat"], ["soupes-salades", "Soupe & salade"], ["sucre", "Sucré"]];

  return (
    <div className={busy ? "busy" : ""}>
      <header className="in">
        <nav className="nav">
          <a className="logo" href="/"><Ico fam="rouge" rot={0} />fricette</a>
          {badge}
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
              <span><Ico fam="vert" rot={0} />{carnet?.length || 600} recettes gratuites</span>
              <span><Ico fam="jaune" rot={0} />les quantités comptent</span>
              <span><Ico fam="rouge" rot={0} />zéro gaspi</span>
            </div>
            {info?.mock && <p className="mock">Mode simulation : les recettes du chef sont fictives.</p>}
          </div>
          <div
            className="hero-art"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: artSvg("fricette", ["rouge", "vert", "jaune", "blanc", "orange", "bleu", "rose"], { w: 400, h: 400, hero: true }) }}
          />
        </div>
      </header>

      <section className="fridge" id="frigo" aria-label="Ton frigo">
        <div className="in">
          <div className="sec">
            <h2>Ton frigo</h2>
            <span>{fridge.length} ingrédient{fridge.length > 1 ? "s" : ""}</span>
          </div>
          <form className="addrow" onSubmit={add}>
            <input id="ing" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ajoute un ingrédient (ex. carottes)" aria-label="Ingrédient" autoComplete="off" />
            <input id="qte" value={qte} onChange={(e) => setQte(e.target.value)} type="number" min="0" step="any" inputMode="decimal" placeholder="Qté" aria-label="Quantité" />
            <select id="unite" value={unite} onChange={(e) => setUnite(e.target.value)} aria-label="Unité">
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL(u)}</option>)}
            </select>
            <button className="btn" type="submit">Ajouter</button>
          </form>

          {fridge.length === 0 && <p className="empty">Ton frigo est vide. Ajoute ce qui traîne au frais, ou prends-le en photo.</p>}
          <div className="tokens">
            {fridge.map((it, i) => (
              <span className="token" key={it.nom + i}>
                <Ico fam={familyOfName(it.nom)} />
                <span className="n">{it.nom}</span>
                <input
                  type="number" min="0" step="any" inputMode="decimal" aria-label={`Quantité de ${it.nom}`}
                  placeholder="qté" value={it.qte ?? ""}
                  onChange={(e) => update(i, { qte: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <select value={it.unite || ""} onChange={(e) => update(i, { unite: e.target.value })} aria-label={`Unité de ${it.nom}`}>
                  {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL(u)}</option>)}
                </select>
                <button className="x" type="button" onClick={() => remove(i)} aria-label={`Retirer ${it.nom}`}>×</button>
              </span>
            ))}
          </div>
          {found?.unknown.length > 0 && (
            <p className="note">Le carnet ne connaît pas encore : {found.unknown.join(", ")}.{info?.ai ? " Le chef, lui, saura quoi en faire." : ""}</p>
          )}

          <div className="filters" role="group" aria-label="Type de recette">
            {TYPES.map(([v, l]) => (
              <button key={v} className="f" type="button" aria-pressed={type === v} onClick={() => setType(v)}>{l}</button>
            ))}
            <button className="f" type="button" aria-pressed={basiques} onClick={() => setBasiques((b) => !b)} title="Sel, poivre, huile, farine, sucre, beurre">
              J'ai les basiques
            </button>
            <button className="f" type="button" aria-pressed={placard} onClick={() => setPlacard((b) => !b)} title="Oignon, ail, pâtes, riz, semoule, épices, herbes de Provence, bouillon, moutarde, sauce soja, miel">
              J'ai un placard classique
            </button>
          </div>
          <div className="opts">
            <select id="temps" value={temps} onChange={(e) => setTemps(e.target.value)} aria-label="Temps">
              <option value="0">Temps : peu importe</option><option value="20">≤ 20 min</option>
              <option value="40">≤ 40 min</option><option value="90">≤ 1 h 30</option>
            </select>
            <select id="regime" value={regime} onChange={(e) => setRegime(e.target.value)} aria-label="Régime">
              <option value="">Régime : aucun</option><option>végétarien</option><option>vegan</option>
              <option>sans gluten</option><option>sans lactose</option><option>sans porc</option><option>halal</option>
            </select>
            <select id="personnes" value={personnes} onChange={(e) => setPersonnes(e.target.value)} aria-label="Nombre de personnes">
              {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>Pour {n}</option>)}
            </select>
          </div>

          <div className="actions">
            {info?.ai && <>
              <button className="cta" type="button" onClick={generate} disabled={busy}>Le chef invente pour moi</button>
              <button className="ghost" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>Photo du frigo</button>
              <input ref={fileRef} className="hidden-file" type="file" accept="image/*" onChange={onPhoto} tabIndex={-1} aria-hidden="true" />
            </>}
            {info && !info.ai && (
              <button className="cta" type="button" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
                Voir les recettes
              </button>
            )}
            <button className="link" type="button" onClick={() => { setFridge([]); setAiRecipes(null); }} disabled={busy}>Vider le frigo</button>
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
            {results.slice(0, shown).map((r) => <Card key={r.id} r={r} onOpen={openSheet} />)}
          </div>
          {results.length > shown && (
            <button className="ghost more" type="button" onClick={() => setShown((n) => n + PAGE)}>
              Voir {Math.min(PAGE, results.length - shown)} recettes de plus
            </button>
          )}
        </div>
      </section>

      <footer>
        <div className="in">
          <div>
            <span>fricette · fait avec amour et des restes</span>
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
          <a href="/conditions">Conditions</a>
        </div>
      </footer>

      <dialog className="sheet" ref={sheetRef} onClose={() => setOpenRecipe(null)} onClick={(e) => { if (e.target === sheetRef.current) sheetRef.current.close(); }}>
        {openRecipe && <Sheet r={openRecipe} onClose={() => sheetRef.current?.close()} />}
      </dialog>
    </div>
  );
}

function Ico({ fam, rot = -10 }) {
  return <span className="ico" dangerouslySetInnerHTML={{ __html: iconSvg(fam || "gris", rot) }} />;
}

function summary(r) {
  const ings = r.ingredients || [];
  const core = ings.filter((i) => i.etat !== "option");
  const have = core.filter((i) => i.etat === "have" || i.etat === "short");
  const missing = core.filter((i) => i.etat === "need");
  const short = core.filter((i) => i.etat === "short");
  const pct = core.length ? Math.round((have.length / core.length) * 100) : 0;
  const fams = have.filter((i) => !i.basique).map((i) => i.fam || "gris");
  return { ings, have, missing, short, pct, fams };
}

function Card({ r, ai, onOpen }) {
  const { missing, short, pct, fams } = summary(r);
  return (
    <button type="button" className={"card" + (ai ? " ai" : "")} onClick={() => onOpen(r)}>
      <div className="art">
        {r.photo
          ? <img src={r.photo} alt="" loading="lazy" />
          : <div className="fill" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams) }} />}
        {ai && <span className="chef-tag">Le chef</span>}
        <span className="score">{pct} %</span>
      </div>
      <div className="txt">
        <h3>{r.titre}</h3>
        <div className="meta">{[r.temps && `${r.temps} min`, r.difficulte, `${r.portions} pers.`].filter(Boolean).join(" · ")}</div>
        <div className={"miss" + (missing.length ? "" : " ok")}>
          {missing.length ? `Il manque : ${missing.map((m) => m.nom).join(", ")}` : "Tu as tout"}
          {short.length > 0 && <span className="juste"> · un peu juste : {short.map((m) => m.nom).join(", ")}</span>}
        </div>
      </div>
    </button>
  );
}

function Sheet({ r, onClose }) {
  const { ings, missing, fams } = summary(r);
  return (
    <article>
      {r.photo
        ? <div className="art"><img src={r.photo} alt={r.titre} /></div>
        : <div className="art" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, fams, { w: 640, h: 280 }) }} />}
      <button className="close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      <div className="sheet-body">
        <div>
          <h2>{r.titre}</h2>
          <div className="meta" style={{ marginTop: 6 }}>
            {[r.temps && `${r.temps} min`, r.difficulte, `${r.portions} pers.`].filter(Boolean).join(" · ")}
            {" · "}
            <span className={"miss" + (missing.length ? "" : " ok")}>
              {missing.length ? `il manque : ${missing.map((m) => m.nom).join(", ")}` : "tu as tout"}
            </span>
          </div>
        </div>
        <div className="cols">
          <div>
            <div className="label">Ingrédients</div>
            <ul className="ing">
              {ings.map((i, k) => (
                <li key={k} className={i.etat}>
                  <span className="n">
                    <Ico fam={i.etat === "need" || i.etat === "option" ? "gris" : i.fam} />
                    <span>{i.nom}{i.etat === "option" && <em> (facultatif)</em>}{i.note && <em> · {i.note}</em>}</span>
                  </span>
                  <span className="q">{i.quantite}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">Préparation</div>
            <ol className="steps">{(r.etapes || []).map((e, k) => <li key={k}>{e}</li>)}</ol>
          </div>
        </div>
        {r.reste && <div className="tip"><strong>Après la recette : </strong>{r.reste}</div>}
        {r.astuce && <div className="tip"><strong>Astuce : </strong>{r.astuce}</div>}
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
