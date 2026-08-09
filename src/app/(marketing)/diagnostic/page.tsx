import type { Metadata } from "next";
import { BackLink } from "@/components/marketing/back-link";
import { DiagnosticQuiz } from "@/components/marketing/diagnostic-quiz";

export const metadata: Metadata = {
  title: "Diagnostic gratuit — quel programme te correspond ? — COAI",
  description:
    "6 questions rapides pour voir à quoi ton programme d'entraînement pourrait ressembler — gratuit, sans inscription.",
  alternates: { canonical: "/diagnostic" },
};

export default function DiagnosticPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-8 px-6 py-16 sm:py-24">
      <div className="w-full max-w-lg">
        <BackLink />
      </div>
      <DiagnosticQuiz />
    </main>
  );
}
