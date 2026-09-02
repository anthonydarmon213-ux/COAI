import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";
import {
  TAILLE_MAX_OCTETS,
  TYPES_ACCEPTES,
  getSignedFormCheckUrl,
  uploadFormCheckVideo,
} from "@/lib/storage/form-checks";

// Une correction de mouvement mobilise du stockage vidéo et surtout du temps
// de coach : elle est réservée aux formules payantes, sinon chaque visiteur
// gratuit pourrait déclencher un travail humain non facturé.
const TYPES = new Set<string>(TYPES_ACCEPTES);

// Plafond volontairement bas : au-delà, la file d'attente d'Anthony devient
// intenable et le membre attend une réponse qui n'arrive plus.
const EN_ATTENTE_MAX = 3;

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  if (!hasPaidSubscription(user.subscription)) {
    return NextResponse.json(
      { error: "La correction de mouvement est incluse à partir du Coaching Hybride." },
      { status: 403 }
    );
  }

  const enAttente = await prisma.formCheck.count({
    where: { userId: user.id, statut: "EN_ATTENTE" },
  });
  if (enAttente >= EN_ATTENTE_MAX) {
    return NextResponse.json(
      { error: `Tu as déjà ${EN_ATTENTE_MAX} vidéos en attente de réponse. Attends le retour d'Anthony avant d'en envoyer une autre.` },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const exercice = String(formData.get("exercice") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Vidéo manquante" }, { status: 400 });
  }
  if (!TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formats acceptés : MP4, MOV ou WebM" }, { status: 400 });
  }
  if (file.size > TAILLE_MAX_OCTETS) {
    return NextResponse.json({ error: "Vidéo trop lourde (60 Mo maximum)" }, { status: 400 });
  }
  if (!exercice) {
    return NextResponse.json({ error: "Indique l'exercice concerné" }, { status: 400 });
  }

  const upload = await uploadFormCheckVideo(user.id, file);
  if ("error" in upload) {
    return NextResponse.json({ error: upload.error }, { status: 500 });
  }

  const formCheck = await prisma.formCheck.create({
    data: {
      userId: user.id,
      exercice,
      videoPath: upload.path,
      question: question || null,
    },
  });

  return NextResponse.json({ id: formCheck.id }, { status: 201 });
}

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const demandes = await prisma.formCheck.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // L'URL signée expire : elle est régénérée à chaque lecture plutôt que
  // stockée, sinon un lien copié resterait valable indéfiniment.
  const avecUrl = await Promise.all(
    demandes.map(async (d: (typeof demandes)[number]) => ({
      id: d.id,
      exercice: d.exercice,
      question: d.question,
      statut: d.statut,
      reponse: d.reponse,
      createdAt: d.createdAt,
      repondueAt: d.repondueAt,
      videoUrl: await getSignedFormCheckUrl(d.videoPath),
    }))
  );

  return NextResponse.json({ demandes: avecUrl });
}
