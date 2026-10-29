// Enregistre la liste de courses ou le frigo d'un compte connecté.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
import { setUserData } from "@/lib/db";

export const dynamic = "force-dynamic";

const KINDS = { courses: 300, frigo: 200 }; // nombre maximum d'éléments

function clean(list, max) {
  if (!Array.isArray(list)) return null;
  const str = (v, n) => String(v ?? "").slice(0, n);
  return list.slice(0, max).filter((x) => x && typeof x === "object").map((x) => {
    const o = {};
    for (const [k, v] of Object.entries(x).slice(0, 10)) {
      if (typeof v === "string") o[k] = str(v, 160);
      else if (typeof v === "number" && Number.isFinite(v)) o[k] = v;
      else if (typeof v === "boolean" || v === null) o[k] = v;
    }
    return o;
  });
}

export async function PUT(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const max = KINDS[body.kind];
  const value = max ? clean(body.value, max) : null;
  if (!value) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  setUserData(user.id, body.kind, value);
  return NextResponse.json({ ok: true });
}
