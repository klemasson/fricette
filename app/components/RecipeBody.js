"use client";
// Contenu d'une recette, partagé par la fenêtre de la page d'accueil et la page de la recette.
import { useEffect, useState } from "react";
import { Ico, FavButton, Basket } from "./bits";
import CookMode from "./CookMode";
import Gestes, { useVideos } from "./Gestes";
import { addToCourses, share, getRatings, sendRating, logCooked, consumeFridge, planAdd, isoDate } from "@/lib/client";
import { allergenLabel } from "@/data/allergens";

export function summary(r) {
  const ings = r.ingredients || [];
  const core = ings.filter((i) => i.etat !== "option");
  const have = core.filter((i) => i.etat === "have" || i.etat === "short");
  const missing = core.filter((i) => i.etat === "need");
  const short = core.filter((i) => i.etat === "short");
  const pct = core.length ? Math.round((have.length / core.length) * 100) : 0;
  const fams = have.filter((i) => !i.basique).map((i) => i.fam || "gris");
  return { ings, have, missing, short, pct, fams };
}

const SITE = "https://fricette.ch";

/**
 * r : recette évaluée (lib/match) ; compare : afficher ce qu'on a / ce qui manque par rapport au frigo.
 * titleTag : "h1" sur la page de la recette, "h2" dans la fenêtre.
 */
export default function RecipeBody({ r, compare = true, fav, onFav, controls, titleTag = "h2", pageLink = false }) {
  const { ings, missing } = summary(r);
  const [cook, setCook] = useState(false);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState({ avg: null, mine: 0 });
  const [hover, setHover] = useState(0);
  const [cooked, setCooked] = useState(null); // null | { g, done }
  const [planOpen, setPlanOpen] = useState(false);
  const Title = titleTag;
  const videos = useVideos();
  const url = `${SITE}/recette/${r.id}`;

  useEffect(() => {
    if (!r.id) return;
    let alive = true;
    const apply = (d) => alive && setRating({ avg: d.all?.[r.id] || null, mine: d.mine?.[r.id] || 0 });
    getRatings().then(apply);
    const on = (e) => apply(e.detail);
    window.addEventListener("frc:ratings", on);
    return () => { alive = false; window.removeEventListener("frc:ratings", on); };
  }, [r.id]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  async function toCourses() {
    const list = compare && missing.length ? missing : ings.filter((i) => i.etat !== "option" && !i.basique);
    const n = await addToCourses(list.map((i) => ({ nom: i.nom, quantite: i.quantite })), r);
    setMsg(n ? `${n} ingrédient${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} à ta liste de courses.` : "Déjà dans ta liste de courses.");
  }

  async function markCooked() {
    const g = await logCooked(r);
    setCooked({ g, done: false });
  }
  async function updateFridge() {
    const res = await consumeFridge(r);
    setCooked((c) => ({ ...c, done: true, res }));
  }
  const usesFridge = compare && (r.ingredients || []).some((i) => (i.etat === "have" || i.etat === "short") && !i.basique && i.note !== "placard");

  async function onShare() {
    const res = await share({ title: r.titre, url });
    if (res === "copied") setMsg("Lien copié ! Colle-le dans un message.");
    if (res === "fail") setMsg(url);
  }

  async function rate(stars) {
    const next = stars === rating.mine ? 0 : stars;
    try {
      await sendRating(r.id, next);
      setMsg(next ? "Merci pour ta note !" : "Note retirée.");
    } catch (e) {
      setMsg(e.message);
    }
  }

  const coursesLabel = compare && missing.length
    ? `Ajouter les ${missing.length} manquant${missing.length > 1 ? "s" : ""} à mes courses`
    : "Ajouter à mes courses";

  return (
    <>
      <div>
        <Title className="r-title">{r.titre}</Title>
        <div className="meta" style={{ marginTop: 8 }}>
          {[r.temps && `${r.temps} min`, r.difficulte, `${r.portions} pers.`].filter(Boolean).join(" · ")}
          {rating.avg && <> · <span className="star-avg">★ {String(rating.avg[0]).replace(".", ",")} <small>({rating.avg[1]} avis)</small></span></>}
          {compare && (
            <>
              {" · "}
              <span className={"miss" + (missing.length ? "" : " ok")}>
                {missing.length ? `il manque : ${missing.map((m) => m.nom).join(", ")}` : "tu as tout"}
              </span>
            </>
          )}
        </div>
        <div className="r-actions">
          {onFav && r.id && <FavButton on={fav} onClick={() => onFav(r.id)} />}
          {r.id && <button type="button" className="chip" onClick={toCourses}><Basket />{coursesLabel}</button>}
          <button type="button" className="chip strong" onClick={() => setCook(true)}>▶ Mode cuisine</button>
          {r.id && <button type="button" className="chip" onClick={() => setPlanOpen((v) => !v)} aria-expanded={planOpen}>📅 Planning</button>}
          <button type="button" className="chip" onClick={markCooked} disabled={!!cooked}>{cooked ? "✓ Cuisinée !" : "✓ Je l'ai cuisinée"}</button>
          {r.id && <button type="button" className="chip" onClick={onShare}>Partager</button>}
          {r.id && <button type="button" className="chip hide-sm" onClick={() => (pageLink ? window.open(`/recette/${r.id}?imprimer=1`, "_blank") : window.print())}>Imprimer</button>}
          {controls}
        </div>
        {planOpen && (
          <div className="plan-quick">
            <span>Ajouter au planning (soir) :</span>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => {
              const d = isoDate(new Date(), n);
              const label = n === 0 ? "ce soir" : n === 1 ? "demain" : new Date(d + "T12:00:00").toLocaleDateString("fr-CH", { weekday: "long" });
              return <button key={n} type="button" className="f" onClick={async () => { await planAdd(d, "soir", r.id); setPlanOpen(false); setMsg(`Ajoutée au planning : ${label}.`); }}>{label}</button>;
            })}
            <a href="/planning" className="small-note">Ouvrir le planning →</a>
          </div>
        )}
        <div className="toast" role="status">{msg}</div>
        {cooked && (
          <div className="cooked">
            <strong>Bravo ! 🌱</strong>{" "}
            {cooked.g > 0 ? <>Environ <b>{cooked.g >= 1000 ? `${(cooked.g / 1000).toFixed(1).replace(".", ",")} kg` : `${cooked.g} g`}</b> d'aliments sauvés de la poubelle.</> : "Recette ajoutée à ton bilan."}
            {usesFridge && !cooked.done && (
              <div className="cooked-actions">
                <button type="button" className="btn small" onClick={updateFridge}>Retirer ce que j'ai utilisé de mon frigo</button>
                <button type="button" className="link" onClick={() => setCooked((c) => ({ ...c, done: true }))}>Non merci</button>
              </div>
            )}
            {cooked.done && cooked.res && (
              <p className="small-note">
                {cooked.res.changed.length ? `Frigo mis à jour : ${cooked.res.changed.join(", ")}.` : "Rien à retirer automatiquement."}
                {cooked.res.unknown.length ? ` Vérifie les quantités de : ${cooked.res.unknown.join(", ")}.` : ""}
              </p>
            )}
            <a className="small-note" href="/compte#bilan">Voir mon bilan anti-gaspi →</a>
          </div>
        )}
      </div>

      <div className="cols">
        <div>
          <div className="label">Ingrédients</div>
          <ul className="ing">
            {ings.map((i, k) => (
              <li key={k} className={compare ? i.etat : i.etat === "option" ? "option" : ""}>
                <span className="n">
                  <Ico fam={compare && (i.etat === "need" || i.etat === "option") ? "gris" : i.fam} />
                  <span>{i.nom}{i.etat === "option" && <em> (facultatif)</em>}{compare && i.note && <em> · {i.note}</em>}</span>
                </span>
                <span className="q">{i.quantite}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="label">Préparation</div>
          <ol className="steps">{(r.etapes || []).map((e, k) => <li key={k}>{e}<Gestes step={e} videos={videos} /></li>)}</ol>
        </div>
      </div>
      {r.allergenes?.length > 0 && (
        <p className="allergen-line"><strong>Allergènes :</strong> {r.allergenes.map(allergenLabel).join(", ")}. <span className="muted">Vérifie les étiquettes des produits utilisés.</span></p>
      )}
      {r.reste && <div className="tip"><strong>Après la recette : </strong>{r.reste}</div>}
      {r.astuce && <div className="tip"><strong>Astuce : </strong>{r.astuce}</div>}

      {r.id && (
        <div className="rate">
          <span className="rate-q">{rating.mine ? "Ta note :" : "Tu l'as faite ? Note-la :"}</span>
          <span className="stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" className={(hover || rating.mine) >= s ? "on" : ""} onMouseEnter={() => setHover(s)}
                onClick={() => rate(s)} aria-label={`${s} étoile${s > 1 ? "s" : ""}`} aria-pressed={rating.mine === s}>★</button>
            ))}
          </span>
          <span className="rate-links">
            {pageLink && <a href={`/recette/${r.id}`}>Page de la recette</a>}
            <a href={`mailto:bonjour@fricette.ch?subject=${encodeURIComponent("Erreur dans la recette : " + r.titre)}&body=${encodeURIComponent(url + "\n\n")}`}>Signaler une erreur</a>
          </span>
        </div>
      )}

      {cook && <CookMode r={r} onClose={() => setCook(false)} onDone={() => { setCook(false); if (!cooked) markCooked(); }} />}
    </>
  );
}
