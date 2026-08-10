import type { Metadata } from "next";
import { BackLink } from "@/components/marketing/back-link";
import { DiagnosticQuiz } from "@/components/marketing/diagnostic-quiz";

// Nombre de questions codé en dur ici (metadata = export statique, ne peut
// pas lire QUESTION_STEPS de diagnostic-quiz.tsx) — à garder synchronisé si
// le nombre de questions change à nouveau (cf. 10/08/2026 : oublié une
// première fois lors du passage de 6 à 10 questions).
export const metadata: Metadata = {
  title: "Diagnostic gratuit — quel programme te correspond ? — COAI",
  description:
    "10 questions rapides pour voir à quoi ton programme d'entraînement pourrait ressembler — gratuit, sans inscription.",
  alternates: { canonical: "/diagnostic" },
};

export default function DiagnosticPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-8 px-6 py-24">
      <div className="w-full max-w-lg">
        <BackLink />
      </div>
      <DiagnosticQuiz />
    </main>
  );
}
