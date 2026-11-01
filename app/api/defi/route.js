import { NextResponse } from "next/server";
import { currentDefi } from "@/lib/defi";
import { feature } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!feature("defi")) return NextResponse.json({ error: "Pas de défi en ce moment." }, { status: 404 });
  return NextResponse.json(currentDefi(), { headers: { "Cache-Control": "public, max-age=600" } });
}
