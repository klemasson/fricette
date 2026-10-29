import { NextResponse } from "next/server";
import { newsletterConfirm } from "@/lib/db";
import { siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const ok = newsletterConfirm(new URL(request.url).searchParams.get("t") || "");
  return NextResponse.redirect(`${siteUrl()}/?newsletter=${ok ? "ok" : "lien"}`);
}
