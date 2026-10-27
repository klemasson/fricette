import { NextResponse } from "next/server";
import { visitorId, visitorIp } from "@/lib/session";
import { currentPro } from "@/lib/billing";
import { limits, consume } from "@/lib/quota";
import { cleanRequest, makeRecipes, AI_ENABLED } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request) {
  if (!AI_ENABLED) return NextResponse.json({ error: "Cette fonction n'est pas activée." }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const req = cleanRequest(body);
  if (!req.fridge.length) {
    return NextResponse.json({ error: "Ajoute au moins un ingrédient." }, { status: 400 });
  }

  const id = await visitorId();
  const ip = await visitorIp();
  const pro = !!(await currentPro());
  const quota = await consume("recipes", id, ip, limits(pro).recipes);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: pro
          ? "Tu as atteint le maximum de recettes pour aujourd'hui. Reviens demain !"
          : "Ta recette sur mesure offerte aujourd'hui est utilisée. Le carnet, lui, reste illimité.",
        code: pro ? "pro_limit" : "free_limit",
      },
      { status: 429 }
    );
  }

  try {
    const recipes = await makeRecipes(req);
    return NextResponse.json({ recipes, recipesLeft: quota.left, pro });
  } catch (e) {
    await quota.release();
    console.error("[recipes]", e?.status || "", e?.message);
    return NextResponse.json(
      { error: "Le chef n'a pas pu répondre. Réessaie dans un instant (cet essai ne t'est pas décompté)." },
      { status: 502 }
    );
  }
}
