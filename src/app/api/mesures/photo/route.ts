import { NextResponse } from "next/server";
import { isReadablePhoto } from "@/lib/storage/photo-image";
import { getCurrentUser } from "@/lib/auth/server";
import { uploadProgressPhoto } from "@/lib/storage/progress-photos";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envoi incomplet. Sélectionne à nouveau la photo puis réessaie." }, { status: 400 });
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "L’image est vide. Sélectionne une autre photo." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formats acceptés : JPG, PNG ou WebP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse après optimisation (2 Mo max)" }, { status: 400 });
  }

  if (!(await isReadablePhoto(file))) {
    return NextResponse.json({ error: "Cette image est illisible ou non prise en charge. Choisis une photo JPG, PNG ou WebP de 16 mégapixels maximum." }, { status: 400 });
  }

  try {
    const result = await uploadProgressPhoto(authUser.id, file);
    if ("error" in result) throw new Error("photo_upload_failed");
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "L’envoi de la photo n’a pas pu être confirmé. Réessaie dans un instant." }, { status: 503 });
  }
}
