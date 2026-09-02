import { RepCount } from "@/components/suivi/repcount";
import { EXERCICES } from "@/lib/exercices/catalogue";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata = {
  title: "RepCount | COAI",
  description: "Note tes séries, tes charges et ton repos. Vois ta progression semaine après semaine.",
};

// RepCount (02/09/2026, demande Anthony — "fonction primordiale, en avant sur
// mobile"). La saisie existait déjà dans le lecteur de séance, mais seulement
// pour les exercices d'une séance générée : impossible de noter une série
// libre. Les données sont écrites dans SeanceLog via /api/seances, au même
// format que le lecteur — elles alimentent donc les graphiques de
// progression et le volume par muscle sans traitement supplémentaire.
export default function RepCountPage() {
  // Date rendue sur le serveur, forcee sur Europe/Paris : l'hebergeur tourne
  // en UTC et afficherait la veille en soiree. C'est bien ce jour-la que les
  // series seront enregistrees.
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>RepCount</SectionLabel>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-200">
            {aujourdhui}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Note ta série.
        </h1>
        <p className="mt-2 text-sm leading-6 text-graphite-300">
          Répétitions, charge, repos. Tu vois ce que tu avais fait la dernière
          fois, et ce que ça donne d&apos;une semaine à l&apos;autre.
        </p>
      </header>

      <RepCount exercices={EXERCICES.map((e) => e.nom)} />
    </main>
  );
}
