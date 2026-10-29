"use client";
// Petits morceaux vivants des pages statiques.
import { useEffect, useState } from "react";
import { Basket } from "./bits";
import { loadLocal, getList, track } from "@/lib/client";

export function CoursesLink({ className = "nav-link" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const count = (l) => setN((l || []).filter((x) => !x.done).length);
    count(loadLocal("frc-courses", []));
    getList("courses").then(count);
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
