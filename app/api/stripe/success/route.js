// Stripe renvoie ici après le paiement : on vérifie la session
// puis on enregistre l'abonné dans un cookie signé.
import { NextResponse } from "next/server";
import { stripe, markActive, siteUrl } from "@/lib/billing";
import { setProCustomer } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!stripe || !sessionId) return NextResponse.redirect(`${siteUrl()}/`);
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    const cid = typeof s.customer === "string" ? s.customer : s.customer?.id;
    if (s.status === "complete" && cid) {
      await setProCustomer(cid);
      await markActive(cid);
      return NextResponse.redirect(`${siteUrl()}/?paiement=ok`);
    }
  } catch (e) {
    console.error("[stripe success]", e?.message);
  }
  return NextResponse.redirect(`${siteUrl()}/?paiement=erreur`);
}
