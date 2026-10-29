// Télécharger une sauvegarde toute fraîche de la base (administrateurs seulement).
import fs from "node:fs";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { backupNow } from "@/lib/db";

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
