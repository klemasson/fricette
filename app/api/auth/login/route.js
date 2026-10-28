import { NextResponse } from "next/server";
import { normEmail, checkPassword, startSession, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { findUserByEmail, setFavorite, listFavorites } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const email = normEmail(body.email);
  const password = String(body.password || "");
  if (tooManyAttempts("login:" + (await visitorIp()) + ":" + email)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie dans un quart d'heure." }, { status: 429 });
  }
  const user = email ? findUserByEmail(email) : null;
  if (!user || !checkPassword(password, user.pass)) {
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }
  const local = Array.isArray(body.favorites) ? body.favorites.slice(0, 1000) : [];
  for (const rid of local) if (recipeExists(rid)) setFavorite(user.id, rid, true);
  await startSession(user.id);
  return NextResponse.json({ user: { email: user.email }, favorites: listFavorites(user.id) });
}
