import { NextResponse } from "next/server";
import { endSession, sameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  await endSession();
  return NextResponse.json({ ok: true });
}
