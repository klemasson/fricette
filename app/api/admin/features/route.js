import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { setFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";
export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  return NextResponse.json(setFeatures(b || {}));
}
