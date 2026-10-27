import { NextResponse } from "next/server";
import { stripe, billingEnabled, siteUrl } from "@/lib/billing";
import { visitorId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!billingEnabled) {
    return NextResponse.json({ error: "L'abonnement n'est pas encore activé." }, { status: 503 });
  }
  const id = await visitorId();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${siteUrl()}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?paiement=annule`,
      client_reference_id: id,
      allow_promotion_codes: true,
      locale: "fr",
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout]", e?.message);
    return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessaie." }, { status: 502 });
  }
}
