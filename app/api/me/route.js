import { NextResponse } from "next/server";
import { currentUser, endSession, sameOrigin, checkPassword } from "@/lib/auth";
import { listFavorites, deleteUser, findUserByEmail, getUserData } from "@/lib/db";
import { mailEnabled, mailDiagnostic } from "@/lib/mail";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // Diagnostic seulement pour une requête faite depuis le serveur lui-même (console SSH : curl "localhost:3000/api/me?diag=1").
  const h = await headers();
  if (new URL(request.url).searchParams.has("diag") && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h.get("host") || "")) {
    return NextResponse.json({ mail: mailEnabled(), diagnostic: mailDiagnostic(), version: "diag" });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null, favorites: [], mail: mailEnabled() });
  return NextResponse.json({ user: { email: user.email }, favorites: listFavorites(user.id), data: getUserData(user.id), mail: mailEnabled() });
}

// Suppression du compte (et de ses favoris), après confirmation du mot de passe.
export async function DELETE(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Tu n'es pas connecté·e." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const full = findUserByEmail(user.email);
  if (!full || !checkPassword(String(body.password || ""), full.pass)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  deleteUser(user.id);
  await endSession();
  return NextResponse.json({ ok: true });
}
