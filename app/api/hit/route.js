// Statistiques de visite sans cookie : on compte des pages vues, des recettes ouvertes et des
// ingrédients cherchés. Les visiteurs uniques sont comptés avec une empreinte qui change chaque
// jour (sel aléatoire gardé en mémoire), comme Plausible : on ne peut pas suivre quelqu'un d'un jour à l'autre.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { recordVisit, recordEvent } from "@/lib/db";
import { tooManyAttempts } from "@/lib/auth";

export const dynamic = "force-dynamic";

const KINDS = new Set(["page", "open", "ing", "unknown", "share", "cook", "courses"]);
const salts = globalThis.__frcSalts || (globalThis.__frcSalts = new Map());
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python|monitor/i;

function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" }); // AAAA-MM-JJ
}

export async function POST(request) {
  try {
    const h = await headers();
    const ua = h.get("user-agent") || "";
    if (BOTS.test(ua)) return new NextResponse(null, { status: 204 });
    const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
    const day = today();
    if (!salts.has(day)) { salts.clear(); salts.set(day, crypto.randomBytes(16).toString("hex")); }
    const hash = crypto.createHash("sha256").update(salts.get(day) + ip + ua).digest("hex").slice(0, 20);
    if (tooManyAttempts("hit:" + hash, 400)) return new NextResponse(null, { status: 204 });

    const body = JSON.parse((await request.text()) || "{}");
    const kind = String(body.kind || "");
    const value = String(body.value || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
    if (!KINDS.has(kind) || !value) return new NextResponse(null, { status: 204 });

    if (kind === "page") {
      recordVisit(day, hash);
      const ref = String(body.ref || "");
      try {
        const host = new URL(ref).hostname.replace(/^www\./, "");
        const self = (h.get("host") || "").split(":")[0].replace(/^www\./, "");
        if (host && host !== self) recordEvent(day, "ref", host.slice(0, 60));
      } catch {}
    }
    recordEvent(day, kind, value);
  } catch {}
  return new NextResponse(null, { status: 204 });
}
