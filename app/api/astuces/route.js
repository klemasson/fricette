// Astuces des membres : liste pour une recette (GET) et envoi (POST, compte requis, validées avant publication).
import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { tipAdd, tipsForRecipe, tipsToday, kvGet, kvSet, getDb } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";
import { getRecipe } from "@/lib/carnet-server";
import { sendMail, mailEnabled, siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";
const clean = (s, n) => String(s || "").replace(/[\u0000-\u0009\u000b-\u001f<>]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("recette");
  if (!recipeExists(id)) return NextResponse.json({ astuces: [] });
  const user = await currentUser();
  const admin = user && isAdminEmail(user.email);
  const astuces = tipsForRecipe(id, user?.id).map((t) => ({
    id: t.id, prenom: t.prenom, texte: t.texte, created: t.created,
    attente: t.status !== "ok" || undefined,
    mine: (user && t.user_id === user.id) || admin || undefined,
  }));
  return NextResponse.json({ astuces, user: !!user });
}

async function notify(title) {
  try {
    if (!mailEnabled()) return;
    if (Date.now() - Number(kvGet("astuces:notified") || 0) < 3600000) return;
    const to = getDb().prepare("SELECT email FROM users").all().map((u) => u.email).filter(isAdminEmail);
    if (!to.length) return;
    kvSet("astuces:notified", Date.now());
    await sendMail({ to: to.join(","), subject: "💡 Nouvelle astuce à valider sur Fricette", text: `Quelqu'un a proposé une astuce pour « ${title} ».\n\nPour la valider : ${siteUrl()}/admin/photos#astuces\n` });
  } catch (e) { console.error("[astuces]", e.message); }
}

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Connecte-toi pour partager une astuce." }, { status: 401 });
  if (tipsToday(user.id) >= 10) return NextResponse.json({ error: "Tu as déjà partagé 10 astuces aujourd'hui. Reviens demain !" }, { status: 429 });
  const b = await request.json().catch(() => ({}));
  if (!recipeExists(b.recette)) return NextResponse.json({ error: "Recette inconnue." }, { status: 400 });
  const texte = clean(b.texte, 400);
  if (texte.length < 10) return NextResponse.json({ error: "Ton astuce est un peu courte : quelques mots de plus ?" }, { status: 400 });
  if (/https?:\/\/|www\./i.test(texte)) return NextResponse.json({ error: "Les liens ne sont pas acceptés dans les astuces." }, { status: 400 });
  const admin = isAdminEmail(user.email);
  const id = tipAdd({ recipe_id: b.recette, user_id: user.id, prenom: clean(b.prenom, 30).replace(/\n/g, " "), texte, status: admin ? "ok" : "attente" });
  if (!admin) notify(getRecipe(b.recette)?.titre || b.recette);
  return NextResponse.json({ ok: true, id, attente: !admin });
}
