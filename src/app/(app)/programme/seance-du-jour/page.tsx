import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getShareableWorkoutForDate } from "@/lib/daily/session";
import { FicheSeance } from "@/components/programme/fiche-seance";
import { FicheActions } from "@/components/programme/fiche-actions";
import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";
import { nettoyerSupersets } from "@/lib/programmes/supersets";

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

  const fiche = programme ? getShareableWorkoutForDate(programme.contenu, today()) : null;
  const seance = fiche?.session ?? null;

  if (!seance) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-editorial text-3xl text-white">Fiche séance bientôt disponible</h1>
        <p className="max-w-xl text-sm leading-6 text-graphite-400">
          Ton programme n&apos;a pas encore de séance exploitable. Dès qu&apos;une séance est générée,
          cette page restera disponible pour l&apos;enregistrer ou la partager.
        </p>
        <Link href="/programme/entrainement" className="text-sm text-laiton-300 underline">
          Voir mon programme →
        </Link>
      </div>
    );
  }

  const s = seance as Record<string, unknown>;
  const nom = texte(s.nom) ?? "Séance du jour";
  const exercices = Array.isArray(s.exercices)
    ? nettoyerSupersets(filtrerExercicesAvecMedias(s.exercices))
    : [];
  const isToday = fiche?.timing === "today";
  const ficheLabel = isToday ? "Séance du jour · COAI" : "Fiche séance · COAI";

  return (
    <div className="flex flex-col gap-5">
      <div className="fiche-actions-barre flex flex-wrap items-center justify-between gap-3">
        <Link href="/programme/entrainement" className="text-sm text-graphite-400 hover:text-white">
          ← Mon programme
        </Link>
        <FicheActions
          nomSeance={nom}
          partageLabel={isToday ? "Ma séance COAI du jour" : "Ma prochaine séance COAI"}
        />
      </div>

      {!isToday && (
        <div className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.08] px-5 py-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
            Aujourd&apos;hui récupération
          </p>
          <p className="mt-1 text-sm leading-6 text-graphite-200">
            La fiche reste disponible : voici ta prochaine séance planifiée
            {fiche?.label ? ` (${fiche.label})` : ""}, prête à enregistrer en PDF ou à partager.
          </p>
        </div>
      )}

      <FicheSeance
        label={ficheLabel}
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
