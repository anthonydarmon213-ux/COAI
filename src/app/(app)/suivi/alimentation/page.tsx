import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RepasForm } from "@/components/suivi/repas-form";
import { CompteurCalories } from "@/components/suivi/compteur-calories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import type { StatutRepas } from "@prisma/client";

const STATUT_LABELS: Record<StatutRepas, { label: string; tone: "success" | "warning" | "danger" }> = {
  COMME_PREVU: { label: "Comme prévu", tone: "success" },
  PETIT_ECART: { label: "Petit écart", tone: "warning" },
  GROS_ECART: { label: "Gros écart", tone: "danger" },
};

export default async function AlimentationSuiviPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  // Bornes du jour côté serveur : filtrer en JS obligerait à charger tout
  // l'historique pour n'en garder qu'une journée.
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date(debutJour);
  finJour.setDate(finJour.getDate() + 1);

  const [repasLogs, repasDuJour, programmeNutrition] = await Promise.all([
    prisma.repasLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.repasLog.findMany({
      where: { userId: user.id, date: { gte: debutJour, lt: finJour } },
      select: { calories: true, proteines: true, glucides: true, lipides: true },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "NUTRITION" },
      orderBy: { generatedAt: "desc" },
      select: { contenu: true },
    }),
  ]);

  // Même source que le tableau de bord : objectifsJournaliers à la racine du
  // contenu nutrition généré. Absent tant que le programme n'existe pas — le
  // compteur affiche alors le total sans jauge, plutôt qu'une cible inventée.
  const brut =
    programmeNutrition?.contenu && typeof programmeNutrition.contenu === "object" && !Array.isArray(programmeNutrition.contenu)
      ? (programmeNutrition.contenu as Record<string, unknown>).objectifsJournaliers
      : null;
  const nombre = (v: unknown): number | undefined => {
    const n = typeof v === "number" ? v : Number.parseInt(String(v ?? "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const o = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : null;
  const objectifs = o
    ? { calories: nombre(o.calories), proteines: nombre(o.proteines), glucides: nombre(o.glucides), lipides: nombre(o.lipides) }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Journal nutrition.</h1>
        <p className="text-sm text-graphite-400">
          Un bilan rapide par jour, pas un journal alimentaire complet à remplir à chaque repas.
        </p>
      </div>
      <CompteurCalories repasDuJour={repasDuJour} objectifs={objectifs} />
      <RepasForm />
      <div className="flex flex-col gap-2">
        {repasLogs.map((r) => {
          const { label, tone } = STATUT_LABELS[r.statut];
          return (
            <Card key={r.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="font-mono text-laiton-400">{r.date.toISOString().slice(0, 10)}</span>
              <Badge tone={tone}>{label}</Badge>
              {r.notes && <span className="text-graphite-300">{r.notes}</span>}
            </Card>
          );
        })}
        {repasLogs.length === 0 && <p className="text-graphite-400">Aucun bilan pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
