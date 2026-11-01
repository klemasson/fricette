// Abonnement aux notifications : GET (clé publique), POST (s'abonner / réglages), DELETE (se désabonner).
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { vapid, saveSub, removeSub, send } from "@/lib/push";
import { visitorIp } from "@/lib/session";
import { feature } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ key: vapid().publicKey });
}

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!feature("push")) return NextResponse.json({ error: "Les notifications sont désactivées." }, { status: 403 });
  if (tooManyAttempts("push:" + (await visitorIp()), 30)) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  const b = await request.json().catch(() => ({}));
  const sub = b.subscription;
  if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth || JSON.stringify(sub).length > 2000) {
    return NextResponse.json({ error: "Abonnement invalide." }, { status: 400 });
  }
  const user = await currentUser();
  saveSub(sub, user?.id, { defi: b.defi !== false, dates: b.dates !== false });
  if (b.hello) await send({ endpoint: sub.endpoint, json: JSON.stringify(sub) }, { title: "🔔 C'est activé !", body: "Fricette te préviendra pour le défi du lundi" + (user ? " et pour les produits à finir." : "."), url: "/" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  if (b.endpoint) removeSub(String(b.endpoint));
  return NextResponse.json({ ok: true });
}
