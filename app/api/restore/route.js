// Retrouver son abonnement sur un autre appareil : on envoie un lien
// de connexion valable 30 minutes à l'adresse utilisée lors du paiement.
import { NextResponse } from "next/server";
import { stripe, hasActiveSubscription, siteUrl } from "@/lib/billing";
import { sign, visitorIp } from "@/lib/session";
import { incr } from "@/lib/store";

export const dynamic = "force-dynamic";

const OK = { message: "Si un abonnement existe pour cette adresse, un lien de connexion vient d'y être envoyé." };

export async function POST(request) {
  if (!stripe || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Cette fonction n'est pas activée." }, { status: 503 });
  }
  const { email } = await request.json().catch(() => ({}));
  const addr = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr) || addr.length > 200) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  const ip = await visitorIp();
  if ((await incr(`restore:${ip}`, 3600)) > 5) {
    return NextResponse.json({ error: "Trop de demandes. Réessaie dans une heure." }, { status: 429 });
  }

  try {
    const customers = await stripe.customers.list({ email: addr, limit: 5 });
    let cid = null;
    for (const c of customers.data) {
      if (await hasActiveSubscription(c.id)) { cid = c.id; break; }
    }
    if (cid) {
      const token = sign({ cid, k: "restore", exp: Date.now() + 30 * 60 * 1000 });
      const link = `${siteUrl()}/api/restore/verify?t=${encodeURIComponent(token)}`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: addr,
          subject: "Ton lien de connexion – Fricette",
          html: `<p>Bonjour,</p><p>Clique sur ce lien pour retrouver ton abonnement sur cet appareil (valable 30 minutes) :</p><p><a href="${link}">Me connecter</a></p><p>Si tu n'as rien demandé, ignore ce message.</p>`,
        }),
      });
      if (!r.ok) console.error("[restore] envoi e-mail", r.status, await r.text());
    }
  } catch (e) {
    console.error("[restore]", e?.message);
  }
  return NextResponse.json(OK);
}
