import { prisma } from "@/lib/db/client";

// Streak et badges (22/08/2026, demande Anthony) — entièrement calculés à
// partir de ce que l'utilisateur a réellement enregistré. Aucun badge ne se
// débloque sur une action que COAI ne peut pas prouver : pas de "badge de
// bienvenue" offert d'office, qui dévaloriserait les vrais.

export type Badge = {
  id: string;
  nom: string;
  description: string;
  icone: string;
  obtenu: boolean;
  /** Progression vers l'obtention, pour les badges à palier. */
  progression?: { actuel: number; cible: number };
};

export type Gamification = {
  streakJours: number;
  /** Vrai si une activité a été enregistrée aujourd'hui — sinon le streak
   *  est encore "sauvable" jusqu'à ce soir. */
  actifAujourdhui: boolean;
  meilleurStreak: number;
  badges: Badge[];
  badgesObtenus: number;
};

function jourUTC(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Streak = jours calendaires consécutifs avec au moins une activité
 * (séance loguée OU check-in quotidien rempli). On accepte que le streak
 * "tienne" tant que la journée d'hier est couverte : couper le compteur à
 * minuit alors que la personne peut encore s'entraîner ce soir serait
 * punitif et faux.
 */
function calculerStreak(jours: Set<string>): { actuel: number; actifAujourdhui: boolean } {
  const aujourdhui = new Date();
  const cleAujourdhui = jourUTC(aujourdhui);
  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);
  const cleHier = jourUTC(hier);

  const actifAujourdhui = jours.has(cleAujourdhui);
  // Point de départ : aujourd'hui si actif, sinon hier (streak encore
  // sauvable). Si ni l'un ni l'autre, le streak est bel et bien rompu.
  if (!actifAujourdhui && !jours.has(cleHier)) {
    return { actuel: 0, actifAujourdhui: false };
  }

  let compte = 0;
  const curseur = new Date(actifAujourdhui ? aujourdhui : hier);
  while (jours.has(jourUTC(curseur))) {
    compte += 1;
    curseur.setDate(curseur.getDate() - 1);
  }
  return { actuel: compte, actifAujourdhui };
}

function meilleurStreakHistorique(jours: Set<string>): number {
  const tries = [...jours].sort();
  let meilleur = 0;
  let courant = 0;
  let precedent: Date | null = null;
  for (const cle of tries) {
    const jour = new Date(`${cle}T00:00:00Z`);
    if (precedent) {
      const ecartJours = Math.round((jour.getTime() - precedent.getTime()) / 86400000);
      courant = ecartJours === 1 ? courant + 1 : 1;
    } else {
      courant = 1;
    }
    meilleur = Math.max(meilleur, courant);
    precedent = jour;
  }
  return meilleur;
}

export async function getGamification(userId: string): Promise<Gamification> {
  const [seances, dailies, mesures] = await Promise.all([
    prisma.seanceLog.findMany({
      where: { userId },
      select: { date: true, exercices: true },
      orderBy: { date: "desc" },
    }),
    prisma.dailySession.findMany({
      where: { userId, sleep: { not: null } },
      select: { date: true },
    }),
    prisma.mesure.count({ where: { userId } }).catch(() => 0),
  ]);

  const jours = new Set<string>();
  for (const s of seances) jours.add(jourUTC(s.date));
  for (const d of dailies) jours.add(jourUTC(d.date));

  const { actuel, actifAujourdhui } = calculerStreak(jours);

  // Volume total soulevé : somme de (charge × séries × répétitions) sur
  // toutes les séances où ces trois valeurs ont été réellement saisies.
  // Une séance loguée sans charge ne compte pas — mieux vaut un total
  // sous-estimé qu'un chiffre gonflé par des valeurs supposées.
  let volumeTotalKg = 0;
  for (const seance of seances) {
    if (!Array.isArray(seance.exercices)) continue;
    for (const ex of seance.exercices) {
      if (typeof ex !== "object" || ex === null) continue;
      const item = ex as Record<string, unknown>;
      const charge = typeof item.chargeKg === "number" ? item.chargeKg : 0;
      const series = typeof item.series === "number" ? item.series : 1;
      const reps = typeof item.repetitions === "number" ? item.repetitions : 1;
      if (charge > 0) volumeTotalKg += charge * series * reps;
    }
  }

  const nbSeances = seances.length;
  const nbCheckins = dailies.length;

  const badges: Badge[] = [
    {
      id: "premiere-seance",
      nom: "Premier pas",
      description: "Ta première séance enregistrée",
      icone: "🎯",
      obtenu: nbSeances >= 1,
      progression: nbSeances < 1 ? { actuel: nbSeances, cible: 1 } : undefined,
    },
    {
      id: "cinq-seances",
      nom: "Ça devient une habitude",
      description: "5 séances enregistrées",
      icone: "🔥",
      obtenu: nbSeances >= 5,
      progression: nbSeances < 5 ? { actuel: nbSeances, cible: 5 } : undefined,
    },
    {
      id: "vingt-seances",
      nom: "Régularité installée",
      description: "20 séances enregistrées",
      icone: "🏆",
      obtenu: nbSeances >= 20,
      progression: nbSeances < 20 ? { actuel: nbSeances, cible: 20 } : undefined,
    },
    {
      id: "streak-7",
      nom: "Une semaine pleine",
      description: "7 jours d'affilée avec une activité",
      icone: "⚡️",
      obtenu: meilleurStreakHistorique(jours) >= 7,
      progression: actuel < 7 ? { actuel, cible: 7 } : undefined,
    },
    {
      id: "streak-30",
      nom: "Un mois sans lâcher",
      description: "30 jours d'affilée avec une activité",
      icone: "👑",
      obtenu: meilleurStreakHistorique(jours) >= 30,
      progression: actuel < 30 ? { actuel, cible: 30 } : undefined,
    },
    {
      id: "checkins-10",
      nom: "COAI te connaît",
      description: "10 check-ins quotidiens remplis",
      icone: "🧠",
      obtenu: nbCheckins >= 10,
      progression: nbCheckins < 10 ? { actuel: nbCheckins, cible: 10 } : undefined,
    },
    {
      id: "volume-10t",
      nom: "10 tonnes soulevées",
      description: "10 000 kg cumulés sur tes séances",
      icone: "🏋️",
      obtenu: volumeTotalKg >= 10000,
      progression: volumeTotalKg < 10000 ? { actuel: Math.round(volumeTotalKg), cible: 10000 } : undefined,
    },
    {
      id: "mesures-3",
      nom: "Suivi assidu",
      description: "3 relevés de mesures enregistrés",
      icone: "📏",
      obtenu: mesures >= 3,
      progression: mesures < 3 ? { actuel: mesures, cible: 3 } : undefined,
    },
  ];

  return {
    streakJours: actuel,
    actifAujourdhui,
    meilleurStreak: meilleurStreakHistorique(jours),
    badges,
    badgesObtenus: badges.filter((b) => b.obtenu).length,
  };
}
