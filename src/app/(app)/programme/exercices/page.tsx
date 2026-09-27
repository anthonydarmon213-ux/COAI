import { ExerciceCatalogue } from "@/components/exercices/exercice-catalogue";

export default function ExercicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="coai-app-page-header animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-3xl font-normal tracking-tight sm:text-5xl">Exercices</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-300">
          Trouve un mouvement et regarde sa démonstration COAI.
        </p>
      </div>
      <ExerciceCatalogue />
    </div>
  );
}
