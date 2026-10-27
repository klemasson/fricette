import { NextResponse } from "next/server";
import { verify, setProCustomer } from "@/lib/session";
import { siteUrl } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const data = verify(new URL(request.url).searchParams.get("t"));
  if (data?.k === "restore" && data.cid) {
    await setProCustomer(data.cid);
    return NextResponse.redirect(`${siteUrl()}/?paiement=retrouve`);
  }
  return NextResponse.redirect(`${siteUrl()}/?paiement=lien-expire`);
}
