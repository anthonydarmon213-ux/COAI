import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getSignedProgressPhotoUrl, uploadAvatar } from "@/lib/storage/progress-photos";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Photo manquante" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Formats acceptés : JPG, PNG ou WebP" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "Photo trop volumineuse (2 Mo max)" }, { status: 400 });

  const uploaded = await uploadAvatar(user.supabaseAuthId, file);
  if ("error" in uploaded) return NextResponse.json({ error: uploaded.error }, { status: 500 });

  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: uploaded.path } });
  const url = await getSignedProgressPhotoUrl(uploaded.path);
  return NextResponse.json({ url }, { status: 201 });
}
