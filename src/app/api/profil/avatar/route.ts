import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getSignedProgressPhotoUrl, uploadAvatar } from "@/lib/storage/progress-photos";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envoi incomplet. Sélectionne à nouveau ta photo puis réessaie." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Photo manquante" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "L’image est vide. Sélectionne une autre photo." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Formats acceptés : JPG, PNG ou WebP" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "Photo trop volumineuse (2 Mo max)" }, { status: 400 });

  try {
    const uploaded = await uploadAvatar(user.supabaseAuthId, file);
    if ("error" in uploaded) throw new Error("avatar_upload_unconfirmed");

    await prisma.user.update({ where: { id: user.id }, data: { avatarPath: uploaded.path } });
    const url = await getSignedProgressPhotoUrl(user.supabaseAuthId, uploaded.path);
    if (!url) throw new Error("avatar_preview_unconfirmed");
    return NextResponse.json({ url }, { status: 201 });
  } catch {
    // The file may already be stored. Do not claim rollback or expose provider
    // messages; the user can safely retry the same avatar replacement.
    return NextResponse.json({ error: "L’envoi de ta photo n’a pas pu être confirmé. Réessaie dans un instant." }, { status: 503 });
  }
}
