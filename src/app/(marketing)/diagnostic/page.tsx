import type { Metadata } from "next";
import { BackLink } from "@/components/marketing/back-link";
import { DiagnosticQuiz, type PilierPhotos } from "@/components/marketing/diagnostic-quiz";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { getStockPhotos } from "@/lib/media/pexels";

// Une photo par pilier sur "Aperçu de ton programme" (20/08/2026, retour
// Anthony : l'aperçu "ne donne pas envie, trop de texte") — générique par
// pilier, pas par réponse précise (le texte de chaque VoletCard dépend de la
// réponse de l'utilisateur, mais illustrer "Nutrition" avec une photo
// différente selon la réponse serait plus de travail que de valeur pour un
// simple repère visuel). Résolu ici, côté serveur, une fois pour tous les
// visiteurs de la page — même mécanisme que RecetteCard/ExerciceCard.
const PILIER_PHOTO_QUERIES: Record<keyof PilierPhotos, string> = {
  entrainement: "strength training gym athlete",
  nutrition: "healthy meal prep nutrition",
  recuperation: "yoga stretching recovery",
  hydratation: "water bottle hydration lifestyle",
};

// Nombre de questions codé en dur ici (metadata = export statique, ne peut
// pas lire QUESTION_STEPS de diagnostic-quiz.tsx) — à garder synchronisé si
// le nombre de questions change à nouveau (cf. 10/08/2026 : oublié une
// première fois lors du passage de 6 à 10 questions).
const TITLE = "Diagnostic gratuit — quel programme te correspond ? — COAI";
const DESCRIPTION =
  "10 questions rapides pour voir à quoi ton programme d'entraînement pourrait ressembler — gratuit, sans inscription.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/diagnostic" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/diagnostic" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function DiagnosticPage({
  searchParams,
}: {
  searchParams?: { utm_source?: string; challenge_score?: string };
}) {
  // Parcours D (Phase 5B, 11/08/2026) : un abonné déjà connecté qui refait
  // le diagnostic n'a pas besoin de créer un compte ni de ressaisir son
  // email — cf. DiagnosticQuiz (prop `connecte`).
  const user = await getCurrentAppUser();
  // Correction Anthony (11/08/2026) : un nouvel abonné sans programme
  // encore généré termine le diagnostic sur "Ton programme est prêt"
  // (génération automatique) — un abonné existant qui reprend le
  // diagnostic pour ajuster son profil garde le geste explicite habituel
  // ("Mettre à jour mon profil", régénération jamais silencieuse).
  const dejaUnProgramme = user
    ? Boolean(await prisma.programmeGenerated.findFirst({ where: { userId: user.id }, select: { id: true } }))
    : false;
  const inviteParUnMembre = !user && searchParams?.utm_source === "parrainage";
  const scorePartage = Number(searchParams?.challenge_score);
  const scoreDefi = Number.isInteger(scorePartage) && scorePartage >= 0 && scorePartage <= 100
    ? scorePartage
    : null;
  const arriveParDefi = !user && scoreDefi !== null;

  const photosResolues = await getStockPhotos(Object.values(PILIER_PHOTO_QUERIES));
  const pilierPhotos: PilierPhotos = {
    entrainement: photosResolues[PILIER_PHOTO_QUERIES.entrainement] ?? null,
    nutrition: photosResolues[PILIER_PHOTO_QUERIES.nutrition] ?? null,
    recuperation: photosResolues[PILIER_PHOTO_QUERIES.recuperation] ?? null,
    hydratation: photosResolues[PILIER_PHOTO_QUERIES.hydratation] ?? null,
  };

  return (
    <main className="coai-diagnostic-page flex min-h-screen flex-col items-center gap-8 px-5 py-8 sm:px-6 sm:py-14">
      {inviteParUnMembre && <TrackConversion name="referral_invitation_opened" />}
      {arriveParDefi && <TrackConversion name="score_challenge_opened" params={{ score_a_battre: scoreDefi }} />}
      <div className="relative z-10 w-full max-w-3xl">
        <BackLink />
      </div>
      {(inviteParUnMembre || arriveParDefi) && (
        <Card className="w-full max-w-lg border-laiton-400/30 bg-laiton-400/[0.05] px-5 py-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Défi COAI</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {scoreDefi !== null
              ? `Un proche a obtenu ${scoreDefi}/100. À toi de faire mieux.`
              : "Un membre COAI t’a invité à découvrir ton profil sportif."}
          </p>
          <p className="mt-1 text-xs leading-5 text-graphite-400">
            Moins de 5 minutes, gratuit et sans carte bancaire. Tu découvriras ton score avant de choisir quoi que ce soit.
          </p>
        </Card>
      )}
      <div className="relative z-10 w-full">
        <DiagnosticQuiz connecte={!!user} aDejaUnProgramme={dejaUnProgramme} pilierPhotos={pilierPhotos} />
      </div>
    </main>
  );
}
