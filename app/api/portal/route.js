// Espace client Stripe : facture, carte bancaire, résiliation.
import { NextResponse } from "next/server";
import { stripe, siteUrl } from "@/lib/billing";
import { proCustomerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const cid = await proCustomerId();
  if (!stripe || !cid) {
    return NextResponse.json({ error: "Aucun abonnement trouvé sur cet appareil." }, { status: 404 });
  }
  try {
    const p = await stripe.billingPortal.sessions.create({ customer: cid, return_url: `${siteUrl()}/` });
    return NextResponse.json({ url: p.url });
  } catch (e) {
    console.error("[portal]", e?.message);
    return NextResponse.json({ error: "L'espace abonnement est indisponible pour le moment." }, { status: 502 });
  }
}
