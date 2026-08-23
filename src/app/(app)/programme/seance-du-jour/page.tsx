import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getWorkoutForDate } from "@/lib/daily/session";
import { FicheSeance } from "@/components/programme/fiche-seance";
import { FicheActions } from "@/components/programme/fiche-actions";

// Fiche de séance imprimable et partageable (23/08/2026, format validé
// par Anthony) — page dédiée plutôt qu'un bloc de plus sur
// /programme/entrainement : l'impression navigateur produit un PDF propre
// seulement si la page ne contient rien d'autre que la fiche.
export const metadata = {
  title: "Ma séance du jour — COAI",
  robots: { index: false },
};

// Même définition que dans le dashboard : minuit local, pour que la séance
// du jour soit identique des deux côtés. Volontairement dupliquée plutôt
// qu'importée depuis la page dashboard — un composant de page n'a pas
// vocation à exporter des utilitaires.
function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function texte(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export default async function SeanceDuJourPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const programme = await prisma.programmeGenerated.findFirst({
    where: { userId: user.id, pilier: "ENTRAINEMENT" },
    orderBy: { generatedAt: "desc" },
    select: { contenu: true },
  });

  const seance = programme ? getWorkoutForDate(programme.contenu, today()) : null;

  if (!seance) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-editorial text-3xl text-white">Pas de séance aujourd&apos;hui</h1>
        <p className="max-w-xl text-sm leading-6 text-graphite-400">
          Ton programme prévoit du repos, ou il n&apos;a pas encore été généré. La fiche sera
          disponible dès ta prochaine séance planifiée.
        </p>
        <Link href="/programme/entrainement" className="text-sm text-laiton-300 underline">
          Voir mon programme →
        </Link>
      </div>
    );
  }

  const s = seance as Record<string, unknown>;
  const nom = texte(s.nom) ?? "Séance du jour";
  const exercices = Array.isArray(s.exercices) ? s.exercices : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="fiche-actions-barre flex flex-wrap items-center justify-between gap-3">
        <Link href="/programme/entrainement" className="text-sm text-graphite-400 hover:text-white">
          ← Mon programme
        </Link>
        <FicheActions nomSeance={nom} />
      </div>

      <FicheSeance
        nomSeance={nom}
        dureeMinutes={user.profile?.dureeSeanceMinutes}
        echauffement={texte(s.echauffement)}
        exercices={exercices}
        retourAuCalme={texte(s.retourAuCalme)}
        prenom={user.prenom}
      />
    </div>
  );
}
