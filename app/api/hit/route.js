// Statistiques de visite sans cookie : on compte des pages vues, des recettes ouvertes et des
// ingrédients cherchés. Les visiteurs uniques sont comptés avec une empreinte qui change chaque
// jour (sel aléatoire gardé en mémoire), comme Plausible : on ne peut pas suivre quelqu'un d'un jour à l'autre.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { recordVisit, recordEvent } from "@/lib/db";
import { tooManyAttempts, currentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

// Les visites des administrateurs (et des appareils exclus depuis /stats) ne sont pas comptées.
const EXCLU = "frc_exclu";
const TEN_YEARS = 10 * 365 * 24 * 3600;

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
    const jar = await cookies();
    if (jar.get(EXCLU)?.value === "1") return new NextResponse(null, { status: 204 });
    const user = await currentUser();
    if (user && isAdminEmail(user.email)) {
      // On retient aussi l'appareil : il restera exclu même après déconnexion.
      const res = new NextResponse(null, { status: 204 });
      res.cookies.set(EXCLU, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TEN_YEARS });
      return res;
    }
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
