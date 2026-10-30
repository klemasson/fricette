// Une photo de réalisation : signaler, valider / masquer (administrateurs), supprimer (auteur ou administrateur).
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { photoGet, photoReport, photoSetStatus } from "@/lib/db";
import { removePhoto } from "@/lib/photos";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const { id } = await params;
  const p = photoGet(id);
  if (!p) return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  const { action } = await request.json().catch(() => ({}));
  if (action === "signaler") {
    if (tooManyAttempts("report:" + (await visitorIp()) + ":" + id, 1)) return NextResponse.json({ ok: true });
    photoReport(id);
    return NextResponse.json({ ok: true });
  }
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  if (action === "valider") photoSetStatus(id, "ok");
  else if (action === "masquer") photoSetStatus(id, "attente");
  else return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const { id } = await params;
  const p = photoGet(id);
  if (!p) return NextResponse.json({ ok: true });
  const user = await currentUser();
  if (!user || (p.user_id !== user.id && !isAdminEmail(user.email))) return NextResponse.json({ error: "Tu ne peux pas supprimer cette photo." }, { status: 403 });
  removePhoto(id);
  return NextResponse.json({ ok: true });
}
