// Crée une liste de courses partagée à partir de la liste actuelle.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sameOrigin, tooManyAttempts } from "@/lib/auth";
import { sharedSave } from "@/lib/db";
import { applyOp } from "@/lib/courses-ops";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (tooManyAttempts("share-create:" + (await visitorIp()), 10)) return NextResponse.json({ error: "Trop de listes créées. Réessaie plus tard." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const id = crypto.randomBytes(15).toString("base64url");
  const items = applyOp([], { op: "add", items: body.items || [] });
  return NextResponse.json({ id, ...sharedSave(id, items) });
}
