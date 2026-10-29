// Notes « je l'ai faite » : 1 à 5 étoiles par recette, une note par compte ou par visiteur.
import { NextResponse } from "next/server";
import { currentUser, sameOrigin, tooManyAttempts } from "@/lib/auth";
import { rate, ratingSummary, myRatings } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";
import { visitorId, visitorIp } from "@/lib/session";

export const dynamic = "force-dynamic";

let cache = null;
function summary() {
  if (!cache) cache = ratingSummary();
  return cache;
}

async function voters() {
  const user = await currentUser();
  const v = ["v:" + (await visitorId())];
  return user ? ["u:" + user.id, ...v] : v;
}

export async function GET() {
  return NextResponse.json({ all: summary(), mine: myRatings(await voters()) });
}

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  if (tooManyAttempts("rate:" + (await visitorIp()), 60)) {
    return NextResponse.json({ error: "Doucement ! Réessaie dans quelques minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const stars = Number(body.stars);
  if (!recipeExists(body.id) || !Number.isInteger(stars) || stars < 0 || stars > 5) {
    return NextResponse.json({ error: "Note invalide." }, { status: 400 });
  }
  const [me, ...others] = await voters();
  rate(me, body.id, stars);
  for (const o of others) rate(o, body.id, 0); // une seule note par personne
  cache = null;
  return NextResponse.json({ all: summary(), mine: myRatings([me, ...others]) });
}
