// État public du concours photo (pour afficher ou non les mentions du concours).
import { NextResponse } from "next/server";
import { actif } from "@/lib/concours";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ actif: actif() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
