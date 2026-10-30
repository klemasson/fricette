// « Une idée ? Un souci ? » : message d'un visiteur, enregistré et envoyé à bonjour@fricette.ch.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { feedbackAdd, feedbackSet, feedbackDelete } from "@/lib/db";
import { sendMail, mailEnabled } from "@/lib/mail";
import { visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";
const KINDS = { idee: "💡 Idée", souci: "🐞 Souci", autre: "💬 Message" };

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  // Champ piège invisible : seuls les robots le remplissent.
  if (b.site) return NextResponse.json({ ok: true });
  if (tooManyAttempts("fb:" + (await visitorIp()), 5)) return NextResponse.json({ error: "Tu as déjà envoyé plusieurs messages. Réessaie dans un moment." }, { status: 429 });
  const message = String(b.message || "").trim().slice(0, 2000);
  if (message.length < 3) return NextResponse.json({ error: "Écris quelques mots." }, { status: 400 });
  const kind = KINDS[b.kind] ? b.kind : "autre";
  const user = await currentUser();
  let email = String(b.email || user?.email || "").trim().slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Adresse e-mail invalide (tu peux la laisser vide)." }, { status: 400 });
  const page = String(b.page || "").slice(0, 300);
  feedbackAdd({ kind, message, email, page });
  if (mailEnabled()) {
    sendMail({
      to: "bonjour@fricette.ch",
      replyTo: email || undefined,
      subject: `${KINDS[kind]} sur Fricette`,
      text: `${message}\n\n— ${email || "sans adresse"}\nPage : ${page || "?"}\n\nTous les messages : https://fricette.ch/stats#messages`,
    }).catch((e) => console.error("[feedback]", e.message));
  }
  return NextResponse.json({ ok: true });
}

// Administrateurs : marquer comme lu / supprimer.
export async function PATCH(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const id = Number(b.id);
  if (b.supprimer) feedbackDelete(id);
  else feedbackSet(id, !!b.lu);
  return NextResponse.json({ ok: true });
}
