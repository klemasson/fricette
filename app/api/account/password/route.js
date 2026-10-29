// Changer son mot de passe (connecté·e), après confirmation de l'ancien.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, checkPassword, hashPassword, startSession, tooManyAttempts } from "@/lib/auth";
import { findUserByEmail, updatePassword } from "@/lib/db";
import { sendMail, mailEnabled, siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Tu n'es pas connecté·e." }, { status: 401 });
  if (tooManyAttempts("pwchange:" + user.id)) return NextResponse.json({ error: "Trop de tentatives. Réessaie dans un quart d'heure." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const next = String(body.next || "");
  if (next.length < 8) return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  if (next.length > 200) return NextResponse.json({ error: "Mot de passe trop long." }, { status: 400 });
  const full = findUserByEmail(user.email);
  if (!full || !checkPassword(String(body.current || ""), full.pass)) {
    return NextResponse.json({ error: "Le mot de passe actuel est incorrect." }, { status: 401 });
  }
  updatePassword(user.id, hashPassword(next)); // déconnecte les autres appareils
  await startSession(user.id); // mais garde celui-ci connecté
  if (mailEnabled()) {
    sendMail({
      to: user.email,
      subject: "Ton mot de passe Fricette a été changé",
      text: `Bonjour,\n\nLe mot de passe de ton compte Fricette vient d'être changé. Si c'est toi, tout va bien.\nSinon, utilise « Mot de passe oublié » sur ${siteUrl()} et écris-nous à bonjour@fricette.ch.\n\nFricette`,
    }).catch((e) => console.error("[mail] avis de changement", e?.message));
  }
  return NextResponse.json({ ok: true });
}
