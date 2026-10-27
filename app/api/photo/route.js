import { NextResponse } from "next/server";
import { visitorId, visitorIp } from "@/lib/session";
import { currentPro } from "@/lib/billing";
import { limits, consume } from "@/lib/quota";
import { readFridgePhoto, AI_ENABLED } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request) {
  if (!AI_ENABLED) return NextResponse.json({ error: "Cette fonction n'est pas activée." }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Image trop lourde ou invalide." }, { status: 400 });
  }
  const m = String(body?.image || "").match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !TYPES.includes(m[1]) || m[2].length > 4_000_000) {
    return NextResponse.json({ error: "Envoie une photo JPEG, PNG ou WebP." }, { status: 400 });
  }

  const id = await visitorId();
  const ip = await visitorIp();
  const pro = !!(await currentPro());
  const quota = await consume("photos", id, ip, limits(pro).photos);
  if (!quota.ok) {
    return NextResponse.json(
      { error: "Ton analyse de photo offerte aujourd'hui est utilisée.", code: pro ? "pro_limit" : "free_limit" },
      { status: 429 }
    );
  }

  try {
    const items = await readFridgePhoto(m[2], m[1]);
    return NextResponse.json({ items, photosLeft: quota.left });
  } catch (e) {
    await quota.release();
    console.error("[photo]", e?.status || "", e?.message);
    return NextResponse.json({ error: "Impossible de lire cette photo. Essaie avec une image plus nette." }, { status: 502 });
  }
}
