import { NextResponse } from "next/server";
import { sameOrigin, hashPassword, hashToken, startSession, tooManyAttempts } from "@/lib/auth";
import { useReset, updatePassword, findUserById, listFavorites } from "@/lib/db";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");
  if (password.length < 8) return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "Mot de passe trop long." }, { status: 400 });
  if (tooManyAttempts("reset:" + (await visitorIp()))) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie dans un quart d'heure." }, { status: 429 });
  }
  const userId = useReset(hashToken(body.token || ""));
  if (!userId) {
    return NextResponse.json({ error: "Ce lien a expiré ou a déjà servi. Demande un nouveau lien depuis « Mot de passe oublié »." }, { status: 400 });
  }
  updatePassword(userId, hashPassword(password));
  await startSession(userId);
  const user = findUserById(userId);
  return NextResponse.json({ user: { email: user.email }, favorites: listFavorites(userId) });
}
