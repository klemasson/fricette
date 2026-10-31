// Exclure (ou réinclure) cet appareil des statistiques de visite.
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const { exclu } = await request.json().catch(() => ({}));
  const res = NextResponse.json({ exclu: !!exclu });
  if (exclu) res.cookies.set("frc_exclu", "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 10 * 365 * 24 * 3600 });
  else res.cookies.delete("frc_exclu");
  return res;
}
