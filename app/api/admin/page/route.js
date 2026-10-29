// Enregistrer une page éditable (administrateurs seulement).
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { pageSet } from "@/lib/db";

export const dynamic = "force-dynamic";
const PAGES = ["conditions"];

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé à l'équipe." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!PAGES.includes(body.page)) return NextResponse.json({ error: "Page inconnue." }, { status: 400 });
  if (body.reset) { pageSet(body.page, null); return NextResponse.json({ ok: true }); }
  const v = body.value || {};
  const clean = { intro: String(v.intro || "").slice(0, 400), bref: String(v.bref || "").slice(0, 1000), texte: String(v.texte || "").slice(0, 40000) };
  pageSet(body.page, clean);
  return NextResponse.json({ ok: true });
}
