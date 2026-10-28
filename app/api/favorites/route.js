import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
import { setFavorite, listFavorites } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Connecte-toi pour enregistrer tes favoris." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!recipeExists(body.id)) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });
  setFavorite(user.id, body.id, body.on !== false);
  return NextResponse.json({ favorites: listFavorites(user.id) });
}
