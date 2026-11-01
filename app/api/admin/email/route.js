// E-mail de bienvenue modifiable : { value: { sujet, texte } } enregistre, { reset: true } rétablit, { test: true } envoie un test.
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { pageSet } from "@/lib/db";
import { sendWelcome } from "@/lib/jobs";
import { mailEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  if (b.reset) { pageSet("email-bienvenue", null); return NextResponse.json({ ok: true }); }
  if (b.value) {
    const sujet = String(b.value.sujet || "").replace(/[\r\n]/g, " ").trim().slice(0, 150);
    const texte = String(b.value.texte || "").slice(0, 20000);
    if (!sujet || !texte.trim()) return NextResponse.json({ error: "L'objet et le texte ne peuvent pas être vides." }, { status: 400 });
    pageSet("email-bienvenue", { sujet, texte });
  }
  if (b.test) {
    if (!mailEnabled()) return NextResponse.json({ error: "L'envoi d'e-mails n'est pas configuré sur le serveur." }, { status: 503 });
    try { await sendWelcome(admin.email); } catch (e) { return NextResponse.json({ error: "Envoi impossible : " + (e?.message || "erreur") }, { status: 500 }); }
    return NextResponse.json({ ok: true, sent: admin.email });
  }
  return NextResponse.json({ ok: true });
}
