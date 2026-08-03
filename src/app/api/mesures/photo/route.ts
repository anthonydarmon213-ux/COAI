import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { uploadProgressPhoto } from "@/lib/storage/progress-photos";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (10 Mo max)" }, { status: 400 });
  }

  const result = await uploadProgressPhoto(authUser.id, file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
