// Abonnement Stripe : on vérifie auprès de Stripe que l'abonnement est actif
// (résultat gardé 10 minutes pour rester rapide).
import Stripe from "stripe";
import { get, set } from "./store";
import { proCustomerId } from "./session";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const billingEnabled = !!(stripe && process.env.STRIPE_PRICE_ID);

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export async function hasActiveSubscription(customerId) {
  if (!stripe || !customerId) return false;
  const cacheKey = `sub:${customerId}`;
  const cached = await get(cacheKey);
  if (cached !== null && cached !== undefined) return cached === "1" || cached === 1;
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const active = subs.data.some((s) => ACTIVE.has(s.status));
  await set(cacheKey, active ? "1" : "0", 600);
  return active;
}

export async function markActive(customerId) {
  await set(`sub:${customerId}`, "1", 600);
}

/** Renvoie l'identifiant client Stripe si le visiteur est abonné, sinon null. */
export async function currentPro() {
  const cid = await proCustomerId();
  if (!cid) return null;
  try {
    return (await hasActiveSubscription(cid)) ? cid : null;
  } catch (e) {
    console.error("[billing] vérification impossible", e?.message);
    return null;
  }
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
