import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getWorkoutForDate } from "@/lib/daily/session";
import { FicheSeance } from "@/components/programme/fiche-seance";
import { FicheActions } from "@/components/programme/fiche-actions";
import { storySeance } from "@/lib/programmes/story-seance";
import { accessibleTraining } from "@/lib/programmes/access";
import { illustrerStory } from "@/lib/programmes/story-photos";

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

export default async function SeanceDuJourPage({ searchParams }: { searchParams?: { seance?: string; visuels?: string } }) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [validated, latest] = await Promise.all([
    prisma.programmeGenerated.findFirst({ where: { userId: user.id, pilier: "ENTRAINEMENT", statut: "VALIDE" }, orderBy: { generatedAt: "desc" }, select: { contenu: true, statut: true } }),
    prisma.programmeGenerated.findFirst({ where: { userId: user.id, pilier: "ENTRAINEMENT" }, orderBy: { generatedAt: "desc" }, select: { contenu: true, statut: true } }),
  ]);
  const programme = accessibleTraining(validated, latest);

  const contenu = programme?.contenu;
  const liste = contenu && typeof contenu === "object" && !Array.isArray(contenu) && Array.isArray(contenu.seances)
    ? contenu.seances.filter((s): s is Prisma.JsonObject => !!s && typeof s === "object" && !Array.isArray(s)) : [];
  const selected = searchParams?.seance;
  const index = selected && /^\d+$/.test(selected) ? Number(selected) : -1;
  const seance = liste[index] ?? (programme ? getWorkoutForDate(programme.contenu, today()) : null);
  const choix = liste.length > 0 ? <nav aria-label="Choisir une fiche séance" className="fiche-actions flex flex-wrap gap-2">{liste.map((s, i) => <Link key={i} href={`/programme/seance-du-jour?seance=${i}`} className="rounded-xl border border-laiton-400/30 px-4 py-3 text-sm text-laiton-200">{texte(s.nom) ?? `Séance ${i + 1}`}</Link>)}</nav> : null;

  if (!seance) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-editorial text-3xl text-white">
          {programme ? "Pas de séance planifiée aujourd’hui" : "Ton programme n’est pas encore disponible"}
        </h1>
        <p className="max-w-xl text-sm leading-6 text-graphite-400">
          {programme
              ? "Aucune séance n’est prévue à cette date dans ton programme. Consulte ton entraînement pour retrouver ton planning."
              : "Consulte ton espace entraînement pour connaître la prochaine étape et préparer ta première séance."}
        </p>
        <Link href="/programme/entrainement" className="text-sm text-laiton-300 underline">
          Voir mon programme →
        </Link>
        {choix}
      </div>
    );
  }

  const s = seance as Record<string, unknown>;
  const nom = texte(s.nom) ?? "Séance du jour";
  const exercices = Array.isArray(s.exercices) ? s.exercices : [];
  const genre = searchParams?.visuels === "femme" || searchParams?.visuels === "homme" ? searchParams.visuels : user.profile?.sexe?.toLowerCase() === "femme" ? "femme" : "homme";
  const story = illustrerStory(storySeance(exercices, s.echauffement, s.retourAuCalme), genre);

  return (
    <div className="flex flex-col gap-5">
      {choix}
      <nav aria-label="Version des visuels" className="fiche-actions flex gap-4 text-sm text-laiton-200">{(["homme", "femme"] as const).map(v => <Link key={v} aria-current={genre === v ? "true" : undefined} className={genre === v ? "font-bold underline" : ""} href={`/programme/seance-du-jour?visuels=${v}${index >= 0 ? `&seance=${index}` : ""}`}>Visuels {v}</Link>)}</nav>
      <div className="fiche-actions-barre flex flex-wrap items-center justify-between gap-3">
        <Link href="/programme/entrainement" className="text-sm text-graphite-400 hover:text-white">
          ← Mon programme
        </Link>
        <FicheActions key={`${nom}-${genre}`} nomSeance={nom} story={story} />
      </div>
      {programme?.statut === "EN_ATTENTE" && <p className="text-sm text-amber-200">Programme non relu par le coach. La fiche est accessible ; cela ne vaut pas validation humaine.</p>}

      <FicheSeance
        nomSeance={nom}
        dureeMinutes={user.profile?.dureeSeanceMinutes}
        echauffement={texte(s.echauffement)}
        exercices={exercices}
        retourAuCalme={texte(s.retourAuCalme)}
        prenom={user.prenom}
        photos={story.exercices.map(ex => ex.photo ?? null)}
      />
    </div>
  );
}
