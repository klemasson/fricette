// Inscription à la newsletter : on envoie un lien de confirmation (double validation).
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normEmail, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { newsletterAdd } from "@/lib/db";
import { sendMail, mailEnabled, siteUrl } from "@/lib/mail";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!mailEnabled()) return NextResponse.json({ error: "L'inscription n'est pas disponible pour le moment." }, { status: 503 });
  if (tooManyAttempts("news:" + (await visitorIp()), 5)) return NextResponse.json({ error: "Trop de demandes. Réessaie plus tard." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const email = normEmail(body.email);
  if (!email) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  const row = newsletterAdd(email, crypto.randomBytes(24).toString("base64url"));
  if (row.confirmed) return NextResponse.json({ message: "Tu es déjà inscrit·e. À lundi !" });
  const link = `${siteUrl()}/api/newsletter/confirmation?t=${row.token}`;
  try {
    await sendMail({
      to: email,
      subject: "Confirme ton inscription à Fricette",
      text: `Bonjour,\n\nPour recevoir chaque lundi 5 idées de recettes de saison, confirme ton inscription :\n${link}\n\nSi tu n'as rien demandé, ignore cet e-mail.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16181d;max-width:520px"><p>Bonjour,</p><p>Pour recevoir chaque lundi <strong>5 idées de recettes de saison</strong>, confirme ton inscription :</p><p><a href="${link}" style="display:inline-block;background:#f2552c;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Je confirme</a></p><p style="color:#6a6d74;font-size:14px">Si tu n'as rien demandé, ignore cet e-mail.</p></div>`,
    });
  } catch (e) {
    console.error("[newsletter] confirmation", e?.message);
    return NextResponse.json({ error: "L'e-mail n'a pas pu partir. Réessaie plus tard." }, { status: 502 });
  }
  return NextResponse.json({ message: "Presque fini : clique sur le lien reçu par e-mail pour confirmer." });
}
