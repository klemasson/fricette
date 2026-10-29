import { NextResponse } from "next/server";
import { lookup } from "@/lib/barcode";
import { tooManyAttempts } from "@/lib/auth";
import { visitorIp } from "@/lib/session";
import { recordEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const code = new URL(request.url).searchParams.get("code") || "";
  if (!/^\d{8,14}$/.test(code)) return NextResponse.json({ error: "Code-barres invalide." }, { status: 400 });
  if (tooManyAttempts("scan:" + (await visitorIp()), 150)) {
    return NextResponse.json({ error: "Beaucoup de scans d'un coup ! Réessaie dans quelques minutes." }, { status: 429 });
  }
  try {
    const item = await lookup(code);
    try { recordEvent(new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" }), "scan", item.found ? (item.known ? "reconnu" : "produit inconnu du carnet") : "absent d'Open Food Facts"); } catch {}
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "La base des produits ne répond pas. Réessaie dans un instant." }, { status: 502 });
  }
}
