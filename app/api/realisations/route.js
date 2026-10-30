// Photos des réalisations : liste pour une recette (GET) et envoi d'une nouvelle photo (POST).
import { NextResponse } from "next/server";
import { currentUser, sameOrigin } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { photoAdd, photosForRecipe, photosToday } from "@/lib/db";
import { recipeExists } from "@/lib/recipes";
import { getRecipe } from "@/lib/carnet-server";
import { MAX_BYTES, sniff, newPhotoId, savePhotoFile, notifyAdmins } from "@/lib/photos";

export const dynamic = "force-dynamic";

const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("recette");
  if (!recipeExists(id)) return NextResponse.json({ photos: [] });
  const user = await currentUser();
  const admin = user && isAdminEmail(user.email);
  const photos = photosForRecipe(id, user?.id).map((p) => ({
    id: p.id, prenom: p.prenom, texte: p.texte, created: p.created,
    attente: p.status !== "ok" || undefined,
    mine: (user && p.user_id === user.id) || admin || undefined,
  }));
  return NextResponse.json({ photos, user: !!user });
}

export async function POST(request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Requête refusée." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Connecte-toi pour partager une photo." }, { status: 401 });
  if (photosToday(user.id) >= 10) return NextResponse.json({ error: "Tu as déjà partagé 10 photos aujourd'hui. Reviens demain !" }, { status: 429 });

  let form;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Envoi invalide." }, { status: 400 }); }
  const recette = String(form.get("recette") || "");
  if (!recipeExists(recette)) return NextResponse.json({ error: "Recette inconnue." }, { status: 400 });
  if (form.get("accord") !== "1") return NextResponse.json({ error: "Coche la case pour confirmer que la photo est la tienne." }, { status: 400 });
  const file = form.get("photo");
  if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "Choisis une photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photo trop lourde (3 Mo maximum)." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return NextResponse.json({ error: "Ce fichier n'est pas une photo (JPEG, PNG ou WebP)." }, { status: 400 });

  const admin = isAdminEmail(user.email);
  const id = newPhotoId();
  savePhotoFile(id, ext, buf);
  photoAdd({ id, recipe_id: recette, user_id: user.id, prenom: clean(form.get("prenom"), 30), texte: clean(form.get("texte"), 160), status: admin ? "ok" : "attente" });
  if (!admin) notifyAdmins(getRecipe(recette)?.titre || recette);
  return NextResponse.json({ ok: true, id, attente: !admin });
}
