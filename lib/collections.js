import { COLLECTIONS } from "@/data/collections";
import { carnet } from "./carnet-server";

const order = (a, b) => (b.photo ? 1 : 0) - (a.photo ? 1 : 0) || a.temps - b.temps || a.titre.localeCompare(b.titre, "fr");

export function collections() {
  return COLLECTIONS.map((c) => ({ ...c, recettes: carnet().filter(c.test).sort(order) })).filter((c) => c.recettes.length >= 6);
}
export function collection(slug) {
  return collections().find((c) => c.slug === slug) || null;
}
