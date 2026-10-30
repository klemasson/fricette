import { NextResponse } from "next/server";
import { currentDefi } from "@/lib/defi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(currentDefi(), { headers: { "Cache-Control": "public, max-age=600" } });
}
