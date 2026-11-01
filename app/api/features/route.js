import { NextResponse } from "next/server";
import { features } from "@/lib/features";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(features(), { headers: { "Cache-Control": "no-store" } });
}
