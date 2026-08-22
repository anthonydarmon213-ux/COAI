import { prisma } from "@/lib/db/client";

// Débrief hebdomadaire affiché sur /coach (21/08/2026, demande Anthony :
// "volume total validé, progression sur les exercices clés, score de
// récupération"). Entièrement calculé à partir de ce que l'utilisateur a
// réellement enregistré (SeanceLog, DailySession) — chaque puce vaut null
// quand la donnée n'existe pas encore, et l'écran affiche alors "pas encore
// de donnée" plutôt qu'un zéro ou une moyenne inventée.

export type PuceDebrief = {
  valeur: string;
  detail: string;
} | null;

export type DebriefSemaine = {
  volume: PuceDebrief;
  progression: PuceDebrief;
  recuperation: PuceDebrief;
  aDesDonnees: boolean;
};

function debutDeSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay();
  // Lundi comme premier jour (getDay() renvoie 0 pour dimanche).
  const decalage = jour === 0 ? 6 : jour - 1;
  d.setDate(d.getDate() - decalage);
  d.setHours(0, 0, 0, 0);
  return d;
}

const ENERGIE_SCORE: Record<string, number> = { BASSE: 1, MOYENNE: 2, HAUTE: 3 };
const SOMMEIL_SCORE: Record<string, number> = { MAUVAIS: 1, MOYEN: 2, BON: 3 };

export async function getDebriefSemaine(userId: string): Promise<DebriefSemaine> {
  const debutSemaine = debutDeSemaine(new Date());
  const debutSemainePrecedente = new Date(debutSemaine);
  debutSemainePrecedente.setDate(debutSemainePrecedente.getDate() - 7);

  const [seancesSemaine, seancesPrecedentes, dailies] = await Promise.all([
    prisma.seanceLog.findMany({
      where: { userId, date: { gte: debutSemaine } },
      select: { exercices: true, dureeMinutes: true },
    }),
    prisma.seanceLog.findMany({
      where: { userId, date: { gte: debutSemainePrecedente, lt: debutSemaine } },
      select: { exercices: true },
    }),
    prisma.dailySession.findMany({
      where: { userId, date: { gte: debutSemaine } },
      select: { sleep: true, energy: true, pain: true },
    }),
  ]);

  // --- Volume validé ---
  const minutes = seancesSemaine.reduce((total, s) => total + (s.dureeMinutes ?? 0), 0);
  const volume: PuceDebrief = seancesSemaine.length
    ? {
        valeur: `${seancesSemaine.length} séance${seancesSemaine.length > 1 ? "s" : ""}`,
        detail: minutes > 0 ? `${minutes} minutes enregistrées cette semaine` : "durée non renseignée",
      }
    : null;

  // --- Progression sur les charges ---
  // Compare la charge maximale par exercice entre cette semaine et la
  // précédente. N'affiche une progression que si le MÊME exercice existe
  // dans les deux semaines — sinon on comparerait deux mouvements
  // différents, ce qui ne veut rien dire.
  const chargesMax = (seances: { exercices: unknown }[]) => {
    const map = new Map<string, number>();
    for (const seance of seances) {
      if (!Array.isArray(seance.exercices)) continue;
      for (const ex of seance.exercices) {
        if (typeof ex !== "object" || ex === null) continue;
        const item = ex as Record<string, unknown>;
        const nom = typeof item.nom === "string" ? item.nom.trim().toLowerCase() : null;
        const charge = typeof item.chargeKg === "number" ? item.chargeKg : null;
        if (!nom || charge === null || charge <= 0) continue;
        map.set(nom, Math.max(map.get(nom) ?? 0, charge));
      }
    }
    return map;
  };

  const actuelles = chargesMax(seancesSemaine);
  const precedentes = chargesMax(seancesPrecedentes);
  let meilleurNom: string | null = null;
  let meilleurGain = 0;
  for (const [nom, charge] of actuelles) {
    const avant = precedentes.get(nom);
    if (avant === undefined || avant <= 0) continue;
    const gain = charge - avant;
    if (gain > meilleurGain) {
      meilleurGain = gain;
      meilleurNom = nom;
    }
  }

  const progression: PuceDebrief = meilleurNom
    ? {
        valeur: `+${meilleurGain % 1 === 0 ? meilleurGain : meilleurGain.toFixed(1)} kg`,
        detail: `sur ${meilleurNom}, par rapport à la semaine dernière`,
      }
    : null;

  // --- Score de récupération ---
  // Moyenne du sommeil et de l'énergie déclarés dans les check-ins de la
  // semaine, ramenée sur 100. Les jours sans check-in sont ignorés, jamais
  // comptés comme neutres.
  const scores: number[] = [];
  for (const d of dailies) {
    const sommeil = d.sleep ? SOMMEIL_SCORE[d.sleep] : undefined;
    const energie = d.energy ? ENERGIE_SCORE[d.energy] : undefined;
    const dispo = [sommeil, energie].filter((v): v is number => typeof v === "number");
    if (dispo.length === 0) continue;
    scores.push(dispo.reduce((a, b) => a + b, 0) / dispo.length);
  }
  const douleurs = dailies.filter((d) => d.pain).length;
  const recuperation: PuceDebrief = scores.length
    ? {
        valeur: `${Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 3) * 100)}/100`,
        detail: douleurs > 0
          ? `${scores.length} check-in${scores.length > 1 ? "s" : ""} · ${douleurs} jour${douleurs > 1 ? "s" : ""} avec douleur signalée`
          : `sur ${scores.length} check-in${scores.length > 1 ? "s" : ""} cette semaine`,
      }
    : null;

  return {
    volume,
    progression,
    recuperation,
    aDesDonnees: Boolean(volume || progression || recuperation),
  };
}
