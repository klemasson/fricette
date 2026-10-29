import { NextResponse } from "next/server";
import { videos } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await videos();
  const ok = Object.fromEntries(Object.entries(all).filter(([, v]) => v.ok).map(([k, v]) => [k, { id: v.id, titre: v.titre }]));
  return NextResponse.json({ videos: ok }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
