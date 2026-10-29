import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normEmail, sameOrigin, tooManyAttempts, hashToken } from "@/lib/auth";
import { findUserByEmail, createReset } from "@/lib/db";
import { sendMail, mailEnabled, siteUrl } from "@/lib/mail";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

// Même réponse que le compte existe ou non : on ne révèle pas qui est inscrit.
const OK = { message: "Si un compte existe avec cette adresse, tu vas recevoir un e-mail avec un lien pour choisir un nouveau mot de passe. Pense à regarder dans les spams." };

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!mailEnabled()) return NextResponse.json({ error: "Cette fonction n'est pas encore disponible." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = normEmail(body.email);
  if (!email) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  const ip = await visitorIp();
  if (tooManyAttempts("forgot:" + ip) || tooManyAttempts("forgot:" + email)) {
    return NextResponse.json({ error: "Trop de demandes. Réessaie dans un quart d'heure." }, { status: 429 });
  }
  const user = findUserByEmail(email);
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    createReset(user.id, hashToken(token));
    const link = `${siteUrl()}/?reset=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: "Choisis un nouveau mot de passe – Fricette",
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe sur Fricette, ouvre ce lien (valable 1 heure) :\n${link}\n\nSi tu n'as rien demandé, ignore simplement cet e-mail : ton mot de passe ne change pas.\n\nFricette`,
        html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16181d;max-width:520px">
<p style="font-size:22px;font-weight:bold;margin:0 0 16px"><span style="color:#f2552c">●</span> fricette</p>
<p>Bonjour,</p>
<p>Pour choisir un nouveau mot de passe, clique sur le bouton ci-dessous. Le lien est valable 1 heure.</p>
<p style="margin:24px 0"><a href="${link}" style="background:#f2552c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;display:inline-block">Choisir un nouveau mot de passe</a></p>
<p style="color:#6a6d74;font-size:14px">Si tu n'as rien demandé, ignore simplement cet e-mail : ton mot de passe ne change pas.</p>
</div>`,
      });
    } catch (e) {
      console.error("[forgot] envoi impossible :", e?.message);
      return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé. Réessaie plus tard." }, { status: 502 });
    }
  }
  return NextResponse.json(OK);
}
