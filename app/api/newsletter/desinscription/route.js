import { NextResponse } from "next/server";
import { newsletterRemove } from "@/lib/db";
import { siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

async function handle(request) {
  newsletterRemove(new URL(request.url).searchParams.get("t") || "");
  return NextResponse.redirect(`${siteUrl()}/?newsletter=desinscrit`, 303);
}
export const GET = handle;
export const POST = handle; // désinscription en un clic depuis la boîte mail
