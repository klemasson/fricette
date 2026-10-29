// Lire et modifier une liste partagée : quiconque a le lien peut la voir et la modifier.
import { NextResponse } from "next/server";
import { sameOrigin, tooManyAttempts } from "@/lib/auth";
import { sharedGet, sharedSave } from "@/lib/db";
import { applyOp } from "@/lib/courses-ops";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";
const valid = (id) => /^[A-Za-z0-9_-]{16,40}$/.test(id || "");

export async function GET(_req, { params }) {
  const { id } = await params;
  const l = valid(id) && sharedGet(id);
  if (!l) return NextResponse.json({ error: "Cette liste n'existe plus." }, { status: 404 });
  return NextResponse.json(l, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const { id } = await params;
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (tooManyAttempts("share:" + (await visitorIp()), 600)) return NextResponse.json({ error: "Doucement !" }, { status: 429 });
  const l = valid(id) && sharedGet(id);
  if (!l) return NextResponse.json({ error: "Cette liste n'existe plus." }, { status: 404 });
  const ops = [].concat((await request.json().catch(() => ({}))).ops || []).slice(0, 50);
  let items = l.items;
  for (const op of ops) items = applyOp(items, op);
  return NextResponse.json(sharedSave(id, items));
}
