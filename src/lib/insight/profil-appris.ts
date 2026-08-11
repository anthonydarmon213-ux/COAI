import { prisma } from "@/lib/db/client";
import { LABEL_PAR_EXERCICE } from "@/lib/tests-maxi/labels";
import type { RepasLog, SeanceLog, TestMaxi } from "@prisma/client";

export type ProfilApprisItem = { label: string; valeur: string };

// Seuils minimum avant d'afficher une conclusion — jamais une conclusion
// tirée d'un échantillon trop faible pour être honnête (exigence explicite
// de la vision produit : "afficher uniquement des conclusions soutenues
// par suffisamment de données").
const MIN_SEANCES_FREQUENCE = 6;
const MIN_SEANCES_MEILLEUR_JOUR = 6;
const MIN_CHECKINS_RECUPERATION = 2;
const MIN_TESTS_PROGRESSION = 2;
const MIN_MENTIONS_ZONE = 2;
const MIN_SEANCES_DUREE = 4;
const MIN_REPAS_ADHERENCE = 5;

const JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SEMAINE_MS = 7 * 24 * 60 * 60 * 1000;

function semaineIso(date: Date): number {
  return Math.floor(date.getTime() / SEMAINE_MS);
}

function frequenceHabituelle(seances: SeanceLog[]): ProfilApprisItem | null {
  if (seances.length < MIN_SEANCES_FREQUENCE) return null;
  const semaines = new Set(seances.map((s) => semaineIso(s.date)));
  const frequence = Math.round((seances.length / semaines.size) * 10) / 10;
  return { label: "Fréquence habituelle", valeur: `~${frequence} séance${frequence > 1 ? "s" : ""} / semaine` };
}

function meilleurJour(seances: SeanceLog[]): ProfilApprisItem | null {
  if (seances.length < MIN_SEANCES_MEILLEUR_JOUR) return null;
  const compteParJour = new Array(7).fill(0) as number[];
  seances.forEach((s) => {
    const jour = s.date.getUTCDay();
    compteParJour[jour] = (compteParJour[jour] ?? 0) + 1;
  });
  const max = Math.max(...compteParJour);
  const index = compteParJour.indexOf(max);
  return { label: "Meilleur jour", valeur: JOURS_FR[index] ?? "Non déterminé" };
}

function exerciceEnProgression(tests: TestMaxi[]): ProfilApprisItem | null {
  const parExercice = new Map<string, TestMaxi[]>();
  tests.forEach((t) => {
    const liste = parExercice.get(t.exercice) ?? [];
    liste.push(t);
    parExercice.set(t.exercice, liste);
  });

  let meilleur: { exercice: string; hausse: number } | null = null;
  for (const [exercice, liste] of parExercice) {
    if (liste.length < MIN_TESTS_PROGRESSION) continue;
    const premierTest = liste[0];
    const dernierTest = liste[liste.length - 1];
    if (!premierTest || !dernierTest) continue;
    const premier = premierTest.valeur;
    const dernier = dernierTest.valeur;
    if (premier <= 0) continue;
    const hausse = (dernier - premier) / premier;
    if (hausse > 0 && (!meilleur || hausse > meilleur.hausse)) {
      meilleur = { exercice, hausse };
    }
  }
  if (!meilleur) return null;
  return {
    label: "Exercice en progression",
    valeur: LABEL_PAR_EXERCICE[meilleur.exercice as keyof typeof LABEL_PAR_EXERCICE] ?? meilleur.exercice,
  };
}

function dureeMoyenne(seances: SeanceLog[]): ProfilApprisItem | null {
  const durees = seances.map((s) => s.dureeMinutes).filter((v): v is number => v != null);
  if (durees.length < MIN_SEANCES_DUREE) return null;
  const moyenne = Math.round(durees.reduce((a, b) => a + b, 0) / durees.length);
  return { label: "Durée moyenne", valeur: `${moyenne} minutes` };
}

// Phase 3 (11/08/2026) — adhérence au plan nutrition, à partir des
// check-ins repas (RepasLog). "Comme prévu" compte seul comme respecté :
// un petit ou gros écart reste un écart, même partiel.
function adherenceNutrition(repas: RepasLog[]): ProfilApprisItem | null {
  if (repas.length < MIN_REPAS_ADHERENCE) return null;
  const commePrevu = repas.filter((r) => r.statut === "COMME_PREVU").length;
  const pourcent = Math.round((commePrevu / repas.length) * 100);
  return { label: "Adhérence nutrition", valeur: `${pourcent} %` };
}

function zoneASurveiller(seances: SeanceLog[]): ProfilApprisItem | null {
  const compteParZone = new Map<string, number>();
  seances.forEach((s) => {
    if (s.douleur && s.douleur !== "AUCUNE" && s.douleurZone) {
      compteParZone.set(s.douleurZone, (compteParZone.get(s.douleurZone) ?? 0) + 1);
    }
  });
  const plusFrequente = [...compteParZone.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!plusFrequente || plusFrequente[1] < MIN_MENTIONS_ZONE) return null;
  return { label: "Zone à surveiller", valeur: plusFrequente[0] };
}

// Construit "Ce que COAI apprend sur toi" (section dédiée, 11/08/2026) —
// chaque item n'apparaît que si assez de données réelles le soutiennent ;
// une liste vide signifie "COAI apprend encore à te connaître" côté UI,
// jamais une conclusion fabriquée pour remplir l'espace.
export async function buildProfilAppris(userId: string): Promise<ProfilApprisItem[]> {
  const depuis90Jours = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [seances, checkins, tests, repas] = await Promise.all([
    prisma.seanceLog.findMany({ where: { userId, date: { gte: depuis90Jours } }, orderBy: { date: "asc" } }),
    prisma.weeklyCheckin.findMany({ where: { userId }, orderBy: { semaineDebut: "desc" }, take: 8 }),
    prisma.testMaxi.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.repasLog.findMany({ where: { userId, date: { gte: depuis90Jours } } }),
  ]);

  const items: ProfilApprisItem[] = [];

  const frequence = frequenceHabituelle(seances);
  if (frequence) items.push(frequence);

  const jour = meilleurJour(seances);
  if (jour) items.push(jour);

  const duree = dureeMoyenne(seances);
  if (duree) items.push(duree);

  const energies = checkins.map((c) => c.energie).filter((v): v is number => v != null);
  if (energies.length >= MIN_CHECKINS_RECUPERATION) {
    const moyenne = energies.reduce((a, b) => a + b, 0) / energies.length;
    items.push({
      label: "Récupération",
      valeur: moyenne >= 3.5 ? "Bonne" : moyenne >= 2.5 ? "Correcte" : "À surveiller",
    });
  }

  const progression = exerciceEnProgression(tests);
  if (progression) items.push(progression);

  const zone = zoneASurveiller(seances);
  if (zone) items.push(zone);

  const adherence = adherenceNutrition(repas);
  if (adherence) items.push(adherence);

  return items;
}
