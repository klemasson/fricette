import { NextResponse } from "next/server";
import { visitorId, visitorIp } from "@/lib/session";
import { currentPro, billingEnabled } from "@/lib/billing";
import { limits, remaining } from "@/lib/quota";
import { MOCK, AI_ENABLED } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = await visitorId();
  const ip = await visitorIp();
  const pro = !!(await currentPro());
  const lim = limits(pro);
  return NextResponse.json({
    pro,
    recipesLeft: await remaining("recipes", id, ip, lim.recipes),
    photosLeft: await remaining("photos", id, ip, lim.photos),
    freePerDay: limits(false).recipes,
    billing: billingEnabled,
    priceLabel: process.env.PRICE_LABEL || "4,90 CHF / mois",
    restore: !!process.env.RESEND_API_KEY,
    mock: MOCK,
    ai: AI_ENABLED,
  });
}
