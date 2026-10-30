// Nombre de photos publiées par recette (badges « 📸 3 » sur les cartes).
import { NextResponse } from "next/server";
import { photoCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(photoCounts(), { headers: { "Cache-Control": "public, max-age=300" } });
}
