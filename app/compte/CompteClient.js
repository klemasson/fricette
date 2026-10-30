"use client";
import { useEffect, useState } from "react";
import { me, getList, setList, getFavorites, loadLocal } from "@/lib/client";
import { InstallApp } from "@/app/components/Pwa";
import { ALLERGENS } from "@/data/allergens";
import Newsletter from "@/app/components/Newsletter";
import Bilan from "@/app/components/Bilan";

const post = async (url, body, method = "POST") => {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Une erreur est survenue.");
  return d;
};

function Msg({ m }) {
  if (!m) return null;
  return <p className={"status " + (m.err ? "err" : "ok-msg")} role="status">{m.text}</p>;
}

export default function CompteClient() {
  const [state, setState] = useState("loading"); // loading | out | in
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [counts, setCounts] = useState({ favs: 0, courses: 0 });
  const [prefs, setPrefs] = useState({ personnes: 2, temps: "40", regime: "", placard: true });
  const [prefMsg, setPrefMsg] = useState(null);
  const [mail, setMail] = useState({ email: "", password: "", busy: false, msg: null });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "", busy: false, msg: null });
  const [del, setDel] = useState({ open: false, password: "", busy: false, msg: null });

  useEffect(() => {
    me(true).then(async (d) => {
      if (!d.user) return setState("out");
      setEmail(d.user.email);
      setAdmin(!!d.user.admin);
      setState("in");
      const [favs, courses, p] = await Promise.all([getFavorites(), getList("courses"), getList("prefs")]);
      setCounts({ favs: favs.length, courses: courses.filter((x) => !x.done).length });
      setPrefs((old) => ({ ...old, ...loadLocal("frc-prefs", {}), ...p }));
    });
  }, []);

  async function savePrefs(patch) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await setList("prefs", next);
    setPrefMsg({ text: "Enregistré.", err: false });
    setTimeout(() => setPrefMsg(null), 2000);
  }

  async function changeEmail(e) {
    e.preventDefault();
    setMail((m) => ({ ...m, busy: true, msg: null }));
    try {
      const d = await post("/api/account/email", { email: mail.email, password: mail.password });
      setEmail(d.email);
      setMail({ email: "", password: "", busy: false, msg: { text: `C'est fait : tu te connectes désormais avec ${d.email}.`, err: false } });
    } catch (err) {
      setMail((m) => ({ ...m, busy: false, msg: { text: err.message, err: true } }));
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setPw((p) => ({ ...p, msg: { text: "Les deux nouveaux mots de passe ne sont pas identiques.", err: true } }));
    setPw((p) => ({ ...p, busy: true, msg: null }));
    try {
      await post("/api/account/password", { current: pw.current, next: pw.next });
      setPw({ current: "", next: "", confirm: "", busy: false, msg: { text: "Mot de passe changé. Tes autres appareils ont été déconnectés.", err: false } });
    } catch (err) {
      setPw((p) => ({ ...p, busy: false, msg: { text: err.message, err: true } }));
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDel((d) => ({ ...d, busy: true, msg: null }));
    try {
      await post("/api/me", { password: del.password }, "DELETE");
      try { ["frc-favs", "frc-courses", "frc-prefs"].forEach((k) => localStorage.removeItem(k)); } catch {}
      window.location.href = "/?compte=supprime";
    } catch (err) {
      setDel((d) => ({ ...d, busy: false, msg: { text: err.message, err: true } }));
    }
  }

  if (state === "loading") return <p className="empty">Chargement…</p>;
  if (state === "out") {
    return (
      <div className="acc-card">
        <p className="lead" style={{ marginTop: 0 }}>Tu n'es pas connecté·e. Un compte gratuit garde tes favoris, ton frigo et ta liste de courses sur tous tes appareils.</p>
        <div className="actions" style={{ marginTop: 0 }}>
          <a className="cta" href="/?connexion=1">Se connecter</a>
          <a className="ghost" href="/?connexion=creer">Créer un compte</a>
        </div>
      </div>
    );
  }

  return (
    <div className="acc">
      <p className="lead">Connecté·e avec <strong>{email}</strong></p>

      <div className="acc-links">
        <a href="/#favoris" className="acc-link"><strong>{counts.favs}</strong><span>recette{counts.favs > 1 ? "s" : ""} favorite{counts.favs > 1 ? "s" : ""}</span></a>
        <a href="/courses" className="acc-link"><strong>{counts.courses}</strong><span>article{counts.courses > 1 ? "s" : ""} à acheter</span></a>
        <a href="/#frigo" className="acc-link"><strong>Frigo</strong><span>synchronisé</span></a>
      </div>

      {admin && (
        <section className="acc-card">
          <h2>Administration</h2>
          <p className="muted small">Ton compte est administrateur de Fricette.</p>
          <div className="actions" style={{ marginTop: 0 }}>
            <a className="btn small" href="/admin/photos">Photos à valider</a>
            <a className="ghost small" href="/stats">Statistiques</a>
            <a className="ghost small" href="/admin/conditions">Modifier les Conditions</a>
          </div>
        </section>
      )}

      <Bilan />

      <section className="acc-card">
        <h2>Mes réglages</h2>
        <p className="muted small">Fricette s'en souvient sur tous tes appareils.</p>
        <div className="acc-grid">
          <label className="field">Nombre de personnes
            <select value={prefs.personnes} onChange={(e) => savePrefs({ personnes: Number(e.target.value) })}>
              {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n} personne{n > 1 ? "s" : ""}</option>)}
            </select>
          </label>
          <label className="field">Temps de préparation
            <select value={prefs.temps} onChange={(e) => savePrefs({ temps: e.target.value })}>
              <option value="0">Peu importe</option><option value="20">20 min max</option><option value="40">40 min max</option><option value="90">1 h 30 max</option>
            </select>
          </label>
          <label className="field">Régime
            <select value={prefs.regime} onChange={(e) => savePrefs({ regime: e.target.value })}>
              <option value="">Aucun</option><option>végétarien</option><option>vegan</option><option>sans gluten</option><option>sans lactose</option><option>sans porc</option><option>halal</option>
            </select>
          </label>
        </div>
        <label className="switch" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={prefs.placard !== false} onChange={(e) => savePrefs({ placard: e.target.checked })} />
          <span className="track" aria-hidden="true" />
          J'ai un placard de base (sel, huile, beurre, farine, oignon, ail, pâtes, riz, épices)
        </label>
        <div className="field" style={{ marginTop: 6 }}>Allergies : masquer les recettes qui contiennent
          <div className="allergy-chips">
            {ALLERGENS.map((a) => {
              const on = (prefs.sans || []).includes(a.key);
              return <button key={a.key} type="button" className="f" aria-pressed={on} onClick={() => savePrefs({ sans: on ? prefs.sans.filter((x) => x !== a.key) : [...(prefs.sans || []), a.key] })}>{a.label}</button>;
            })}
          </div>
        </div>
        <Msg m={prefMsg} />
      </section>

      <section className="acc-card">
        <h2>E-mails</h2>
        <label className="switch">
          <input type="checkbox" checked={!!prefs.rappels} onChange={(e) => savePrefs({ rappels: e.target.checked })} />
          <span className="track" aria-hidden="true" />
          Me prévenir le matin quand un produit de mon frigo arrive à sa date limite, avec des idées pour le finir
        </label>
        <p className="muted small">Indique les dates dans ton frigo : touche la quantité d'un ingrédient, puis « À finir avant ».</p>
        <div className="field" style={{ marginTop: 8 }}>Newsletter « 5 idées de saison », chaque lundi
          <Newsletter compact email={email} />
        </div>
      </section>

      <section className="acc-card">
        <h2>Adresse e-mail</h2>
        <form onSubmit={changeEmail} className="acc-form">
          <label className="field">Nouvelle adresse
            <input type="email" required autoComplete="email" value={mail.email} onChange={(e) => setMail((m) => ({ ...m, email: e.target.value }))} />
          </label>
          <label className="field">Mot de passe actuel
            <input type="password" required autoComplete="current-password" value={mail.password} onChange={(e) => setMail((m) => ({ ...m, password: e.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={mail.busy}>Changer d'adresse</button>
          <Msg m={mail.msg} />
        </form>
      </section>

      <section className="acc-card">
        <h2>Mot de passe</h2>
        <form onSubmit={changePassword} className="acc-form">
          <label className="field">Mot de passe actuel
            <input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          </label>
          <label className="field">Nouveau mot de passe <small>(8 caractères minimum)</small>
            <input type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </label>
          <label className="field">Confirme le nouveau mot de passe
            <input type="password" required minLength={8} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={pw.busy}>Changer le mot de passe</button>
          <Msg m={pw.msg} />
        </form>
        <p className="muted small">Mot de passe oublié ? Déconnecte-toi, puis utilise « Mot de passe oublié » dans la fenêtre de connexion.</p>
      </section>

      <section className="acc-card">
        <h2>L'app Fricette</h2>
        <p className="muted">Installe Fricette sur l'écran d'accueil de ton téléphone : elle s'ouvre comme une app, même sans réseau.</p>
        <InstallApp />
      </section>

      <section className="acc-card">
        <h2>Session</h2>
        <button className="ghost" type="button" onClick={logout}>Se déconnecter</button>
      </section>

      <section className="acc-card danger">
        <h2>Supprimer mon compte</h2>
        <p className="muted">Ton compte, tes favoris, tes notes, ton frigo et ta liste de courses seront effacés définitivement.</p>
        {!del.open ? (
          <button className="clear-btn" type="button" onClick={() => setDel((d) => ({ ...d, open: true }))}>Supprimer mon compte…</button>
        ) : (
          <form onSubmit={deleteAccount} className="acc-form">
            <label className="field">Confirme avec ton mot de passe
              <input type="password" required autoComplete="current-password" value={del.password} onChange={(e) => setDel((d) => ({ ...d, password: e.target.value }))} />
            </label>
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="danger-btn" type="submit" disabled={del.busy}>Supprimer définitivement</button>
              <button className="link" type="button" onClick={() => setDel({ open: false, password: "", busy: false, msg: null })}>Annuler</button>
            </div>
            <Msg m={del.msg} />
          </form>
        )}
      </section>
    </div>
  );
}
