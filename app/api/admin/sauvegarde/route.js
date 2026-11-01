// Télécharger une sauvegarde toute fraîche de la base (administrateurs seulement).
import fs from "node:fs";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { backupNow } from "@/lib/db";
import { sameOrigin } from "@/lib/auth";
import { mailBackup } from "@/lib/jobs";
import { mailEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé à l'équipe." }, { status: 403 });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const file = backupNow(`telechargement-${stamp}.db`);
  const data = fs.readFileSync(file);
  fs.rmSync(file, { force: true });
  return new NextResponse(data, {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="fricette-sauvegarde-${stamp}.db"`, "Cache-Control": "no-store" },
  });
}

// Envoyer tout de suite la sauvegarde par e-mail (comme celle du dimanche).
export async function POST() {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé à l'équipe." }, { status: 403 });
  if (!mailEnabled()) return NextResponse.json({ error: "L'envoi d'e-mails n'est pas configuré." }, { status: 503 });
  try {
    const n = await mailBackup();
    return NextResponse.json({ ok: !!n, ko: Math.round(n / 1024) });
  } catch (e) {
    return NextResponse.json({ error: "Envoi impossible : " + (e?.message || "erreur") }, { status: 500 });
  }
}
