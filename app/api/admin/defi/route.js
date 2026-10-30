// Choisir le défi de la semaine (administrateurs). { cle, titre, accroche } ou { auto: true }.
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { currentAdmin } from "@/lib/admin";
import { setDefi, currentDefi } from "@/lib/defi";
import { ingredientPages } from "@/lib/carnet-server";

export const dynamic = "force-dynamic";
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (!(await currentAdmin())) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  if (b.auto) setDefi(null);
  else {
    if (!ingredientPages().some((p) => p.cle === b.cle)) return NextResponse.json({ error: "Ingrédient inconnu." }, { status: 400 });
    setDefi({ cle: b.cle, titre: clean(b.titre, 60) || undefined, accroche: clean(b.accroche, 200) || undefined });
  }
  return NextResponse.json(currentDefi());
}
