// Enregistre la liste de courses ou le frigo d'un compte connecté.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
import { setUserData } from "@/lib/db";
import { ALLERGENS } from "@/data/allergens";

const ALLERGEN_KEYS = ALLERGENS.map((a) => a.key);

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

// Préférences : petit objet de réglages par défaut.
const PREFS = { rappels: [true, false], newsletter: [true, false], personnes: [1, 2, 3, 4, 6, 8], temps: ["0", "20", "40", "90"], regime: ["", "végétarien", "vegan", "sans gluten", "sans lactose", "sans porc", "halal"], placard: [true, false] };
function cleanPrefs(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = {};
  for (const [k, allowed] of Object.entries(PREFS)) if (allowed.includes(v[k])) o[k] = v[k];
  if (Array.isArray(v.sans)) o.sans = v.sans.filter((x) => ALLERGEN_KEYS.includes(x));
  return o;
}

export async function PUT(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const max = KINDS[body.kind];
  const value = body.kind === "prefs" ? cleanPrefs(body.value) : max ? clean(body.value, max) : null;
  if (!value) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  setUserData(user.id, body.kind, value);
  return NextResponse.json({ ok: true });
}
