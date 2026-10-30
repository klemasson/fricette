// Concours photo : choisir la gagnante d'un mois ({ mois, photo }) ou changer le lot ({ lot }).
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { setWinner, setLot } from "@/lib/concours";
import { photoGet } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  if (typeof b.lot === "string") {
    setLot(b.lot.replace(/[<>]/g, "").trim().slice(0, 140));
    return NextResponse.json({ ok: true });
  }
  if (!/^\d{4}-\d{2}$/.test(b.mois || "")) return NextResponse.json({ error: "Mois invalide." }, { status: 400 });
  if (b.photo && !photoGet(b.photo)) return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  setWinner(b.mois, b.photo || "");
  return NextResponse.json({ ok: true });
}
