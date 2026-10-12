import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getWorkoutForDate } from "@/lib/daily/session";
import { accessibleTraining } from "@/lib/programmes/access";
import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
};

function safeText(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return jsonError("Connecte-toi pour ouvrir ta séance.", 401);

    const [validated, latest] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT", statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
      select: { contenu: true, statut: true },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT" },
      orderBy: { generatedAt: "desc" },
      select: { contenu: true, statut: true },
    }),
  ]);
    const programme = accessibleTraining(validated, latest);
    if (!programme) return jsonError("Ton programme d’entraînement n’est pas encore disponible.", 404);

    const search = new URL(request.url).searchParams;
    const content = object(programme.contenu);
    const sessions = content && Array.isArray(content.seances)
      ? content.seances.map(object).filter((value): value is Record<string, unknown> => value !== null)
      : [];
    const selectedValues = search.getAll("seance");
    const selected = selectedValues.length === 1 ? selectedValues[0] : undefined;
    if (selectedValues.length > 1 || (selected !== undefined && !/^\d{1,3}$/.test(selected))) {
      return jsonError("Le numéro de séance est invalide. Réessaie depuis ton planning.", 400);
    }
    const session = selected !== undefined
      ? sessions[Number(selected)] ?? null
      : object(getWorkoutForDate(programme.contenu, new Date()));
    if (!session) return jsonError("Aucune séance n’est prévue aujourd’hui. Consulte ton planning pour en choisir une.", 404);

    const rawExercises = Array.isArray(session.exercices) ? session.exercices : [];
    const exercises = filtrerExercicesAvecMedias(rawExercises).flatMap((exercise) => {
    const name = safeText(exercise.nom, 120);
    if (!name) return [];
    const photo = photoCoaiPourNom(name);
    const video = videoCoaiPourNom(name);
    if (!photo || !video || !/^[a-z0-9-]+$/.test(video.fichier)) return [];

    return [{
      name,
      sets: safeText(exercise.series, 80),
      reps: safeText(exercise.repetitions, 80),
      rest: safeText(exercise.repos, 80),
      coachCue: safeText(exercise.consigne, 500),
      photo: photoCoaiPourNom(name, search.get("visuels") === "femme" ? "femme" : "homme") ?? photo,
      video: urlVideoCoai(video.fichier),
      videoDescription: video.description,
    }];
    });
    if (exercises.length === 0) {
      return jsonError("Les démonstrations COAI ne sont pas disponibles pour cette séance.", 409);
    }
    if (exercises.length < rawExercises.length) {
      return NextResponse.json({
        code: "WORKOUT_MEDIA_INCOMPLETE",
        error: "Certaines démonstrations de cette séance ne sont pas encore validées. Elle n’a pas été lancée. Choisis une autre séance ou contacte ton coach.",
        missingMediaCount: rawExercises.length - exercises.length,
      }, { status: 409, headers });
    }

    return NextResponse.json({
    ownerId: user.id,
    name: safeText(session.nom, 120) ?? "Séance du jour",
    status: programme.statut,
    coachReviewNotice: programme.statut === "EN_ATTENTE"
      ? "Programme non relu par le coach. Tu peux commencer ; cela ne vaut pas validation humaine."
      : null,
    warmup: safeText(session.echauffement, 1000),
    cooldown: safeText(session.retourAuCalme, 1000),
    exercises,
    }, { headers });
  } catch (error) {
    console.error("[ios-workout] Could not load session", error instanceof Error ? error.name : "UnknownError");
    return jsonError("Impossible de charger ta séance pour le moment. Réessaie dans un instant.", 503);
  }
}
