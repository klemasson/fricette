import { carnet, ingredientPages } from "@/lib/carnet-server";
import { collections } from "@/lib/collections";

const SITE = "https://fricette.ch";

export default function sitemap() {
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/avec`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/gestes`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/realisations`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE}/idees`, changeFrequency: "weekly", priority: 0.8 },
    ...collections().map((c) => ({ url: `${SITE}/idees/${c.slug}`, changeFrequency: "weekly", priority: 0.7 })),
    { url: `${SITE}/saison`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/defi`, changeFrequency: "weekly", priority: 0.6 },
    ...ingredientPages().map((p) => ({ url: `${SITE}/avec/${p.slug}`, changeFrequency: "weekly", priority: 0.7 })),
    ...carnet().map((r) => ({ url: `${SITE}/recette/${r.id}`, changeFrequency: "monthly", priority: 0.6, images: r.photo ? [`${SITE}${r.photo}`] : undefined })),
    { url: `${SITE}/conditions`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
