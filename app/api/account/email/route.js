// Changer l'adresse e-mail du compte, après confirmation du mot de passe.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, checkPassword, normEmail, tooManyAttempts } from "@/lib/auth";
import { findUserByEmail, updateEmail } from "@/lib/db";
import { sendMail, mailEnabled, siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Tu n'es pas connecté·e." }, { status: 401 });
  if (tooManyAttempts("emailchange:" + user.id)) return NextResponse.json({ error: "Trop de tentatives. Réessaie dans un quart d'heure." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const email = normEmail(body.email);
  if (!email) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  const full = findUserByEmail(user.email);
  if (!full || !checkPassword(String(body.password || ""), full.pass)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  if (email === user.email) return NextResponse.json({ email });
  if (findUserByEmail(email)) return NextResponse.json({ error: "Cette adresse est déjà utilisée par un autre compte." }, { status: 409 });
  updateEmail(user.id, email);
  if (mailEnabled()) {
    sendMail({
      to: user.email,
      subject: "L'adresse de ton compte Fricette a changé",
      text: `Bonjour,\n\nL'adresse e-mail de ton compte Fricette vient d'être changée en ${email}.\nSi ce n'est pas toi, écris-nous tout de suite à bonjour@fricette.ch.\n\nFricette – ${siteUrl()}`,
    }).catch((e) => console.error("[mail] avis de changement d'adresse", e?.message));
  }
  return NextResponse.json({ email });
}
