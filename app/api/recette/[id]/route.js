// Une recette complète (étapes, astuce) : chargée à l'ouverture, la recherche n'utilise que la version légère.
import { NextResponse } from "next/server";
import { getRecipe } from "@/lib/carnet-server";

export async function GET(_req, { params }) {
  const r = getRecipe((await params).id);
  if (!r) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });
  return NextResponse.json(r, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
