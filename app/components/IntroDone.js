"use client";
import { useEffect } from "react";

/** Retire l'animation d'arrivée à la fin, ou dès qu'on touche l'écran. */
export function IntroDone() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("frc-intro")) return;
    const end = () => {
      root.classList.add("frc-intro-out");
      setTimeout(() => root.classList.remove("frc-intro", "frc-intro-out"), 450);
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
    };
    const t = setTimeout(end, 1900);
    window.addEventListener("pointerdown", end);
    window.addEventListener("keydown", end);
    return () => clearTimeout(t);
  }, []);
  return null;
}
