import { NextResponse } from "next/server";
import { normEmail, hashPassword, startSession, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { findUserByEmail, createUser, setFavorite, listFavorites } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const email = normEmail(body.email);
  const password = String(body.password || "");
  if (!email) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "Mot de passe trop long." }, { status: 400 });
  if (tooManyAttempts("signup:" + (await visitorIp()))) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie dans un quart d'heure." }, { status: 429 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "Un compte existe déjà avec cette adresse. Connecte-toi plutôt." }, { status: 409 });
  }
  const id = createUser(email, hashPassword(password));
  // Les favoris enregistrés avant la création du compte sont repris.
  const local = Array.isArray(body.favorites) ? body.favorites.slice(0, 1000) : [];
  for (const rid of local) if (recipeExists(rid)) setFavorite(id, rid, true);
  await startSession(id);
  return NextResponse.json({ user: { email }, favorites: listFavorites(id) });
}
