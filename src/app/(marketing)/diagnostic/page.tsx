import type { Metadata } from "next";
import { BackLink } from "@/components/marketing/back-link";
import { DiagnosticQuiz } from "@/components/marketing/diagnostic-quiz";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { TrackConversion } from "@/components/analytics/track-conversion";

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

export default async function DiagnosticPage({ searchParams }: { searchParams?: { utm_source?: string } }) {
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

  return (
    <main className="coai-diagnostic-page flex min-h-screen flex-col items-center gap-8 px-5 py-8 sm:px-6 sm:py-14">
      {inviteParUnMembre && <TrackConversion name="referral_invitation_opened" />}
      <div className="relative z-10 w-full max-w-3xl">
        <BackLink />
      </div>
      {inviteParUnMembre && (
        <Card className="w-full max-w-lg border-laiton-400/30 bg-laiton-400/[0.05] px-5 py-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Invitation COAI</p>
          <p className="mt-2 text-sm font-medium text-white">Un membre COAI t&apos;a invité à découvrir ton profil sportif.</p>
          <p className="mt-1 text-xs leading-5 text-graphite-400">
            Le diagnostic prend environ 2 minutes. Il est gratuit et tu découvriras ton résultat avant de choisir quoi que ce soit.
          </p>
        </Card>
      )}
      <div className="relative z-10 w-full">
        <DiagnosticQuiz connecte={!!user} aDejaUnProgramme={dejaUnProgramme} />
      </div>
    </main>
  );
}
