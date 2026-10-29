"use client";
// Petits morceaux vivants des pages statiques.
import { useEffect, useState } from "react";
import { Basket } from "./bits";
import { loadLocal, getCourses, track, me } from "@/lib/client";

export function CoursesLink({ className = "nav-link" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const count = (l) => setN((l || []).filter((x) => !x.done).length);
    count(loadLocal("frc-courses", []));
    getCourses().then(count);
    const on = (e) => count(e.detail);
    window.addEventListener("frc:courses", on);
    return () => window.removeEventListener("frc:courses", on);
  }, []);
  return (
    <a className={className} href="/courses" aria-label={`Ma liste de courses${n ? ` (${n})` : ""}`}>
      <Basket /> <span className="hide-sm">Courses</span>{n > 0 && <span className="count">{n}</span>}
    </a>
  );
}

/** Compte une page vue (statistiques anonymes, sans cookie). */
export function PageView({ path }) {
  useEffect(() => { track("page", path || window.location.pathname); }, [path]);
  return null;
}

/** « Mon compte » si connecté·e, sinon « Se connecter ». */
export function AccountLink() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { me().then((d) => setUser(d.user || null)); }, []);
  if (user === undefined) return <span className="acc-placeholder" />;
  return user
    ? <a className="btn small" href="/compte">Mon compte</a>
    : <a className="btn small" href="/?connexion=1">Se connecter</a>;
}
