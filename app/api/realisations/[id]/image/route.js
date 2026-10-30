// Fichier image d'une réalisation. Une photo pas encore validée n'est visible que par son auteur et les administrateurs.
import { currentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { photoGet } from "@/lib/db";
import { readPhotoFile } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = await params;
  const p = photoGet(id);
  if (!p) return new Response("Introuvable", { status: 404 });
  const ok = p.status === "ok";
  if (!ok) {
    const user = await currentUser();
    if (!user || (user.id !== p.user_id && !isAdminEmail(user.email))) return new Response("Introuvable", { status: 404 });
  }
  const f = readPhotoFile(id);
  if (!f) return new Response("Introuvable", { status: 404 });
  return new Response(f.buf, {
    headers: {
      "Content-Type": f.type,
      "Cache-Control": ok ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
