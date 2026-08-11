import type { Metadata } from "next";
import { BackLink } from "@/components/marketing/back-link";
import { DiagnosticQuiz } from "@/components/marketing/diagnostic-quiz";
import { getCurrentAppUser } from "@/lib/auth/server";

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

export default async function DiagnosticPage() {
  // Parcours D (Phase 5B, 11/08/2026) : un abonné déjà connecté qui refait
  // le diagnostic n'a pas besoin de créer un compte ni de ressaisir son
  // email — cf. DiagnosticQuiz (prop `connecte`).
  const user = await getCurrentAppUser();

  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-8 px-6 py-24">
      <div className="w-full max-w-lg">
        <BackLink />
      </div>
      <DiagnosticQuiz connecte={!!user} />
    </main>
  );
}
