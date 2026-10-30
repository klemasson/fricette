// Une astuce : signaler (tout le monde), valider / masquer (administrateurs), supprimer (auteur ou administrateur).
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { tipGet, tipReport, tipSetStatus, tipDelete } from "@/lib/db";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const id = Number((await params).id);
  if (!tipGet(id)) return NextResponse.json({ error: "Astuce introuvable." }, { status: 404 });
  const { action } = await request.json().catch(() => ({}));
  if (action === "signaler") {
    if (!tooManyAttempts("tipreport:" + (await visitorIp()) + ":" + id, 1)) tipReport(id);
    return NextResponse.json({ ok: true });
  }
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  if (action === "valider") tipSetStatus(id, "ok");
  else if (action === "masquer") tipSetStatus(id, "attente");
  else return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const id = Number((await params).id);
  const t = tipGet(id);
  if (!t) return NextResponse.json({ ok: true });
  const user = await currentUser();
  if (!user || (t.user_id !== user.id && !isAdminEmail(user.email))) return NextResponse.json({ error: "Tu ne peux pas supprimer cette astuce." }, { status: 403 });
  tipDelete(id);
  return NextResponse.json({ ok: true });
}
