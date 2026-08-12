import { prisma } from "@/lib/db/client";
import { LABEL_PAR_EXERCICE } from "@/lib/tests-maxi/labels";
import { MIN_JOURS_NEAT } from "@/lib/neat/signaux";
import { buildTendancesDaily, type TendanceLongitudinale } from "@/lib/insight/tendances-longitudinales";
import type { DailySession, RepasLog, SeanceLog, TestMaxi } from "@prisma/client";

export type ProfilApprisItem = {
  label: string;
  valeur: string;
  preuve: string;
  maturite: "EN_OBSERVATION" | "ETABLI";
};

export type AxeApprentissage = {
  label: string;
  actuel: number;
  cible: number;
};

export type ProfilIntelligence = {
  items: ProfilApprisItem[];
  progression: number;
  axes: AxeApprentissage[];
  tendances: TendanceLongitudinale[];
};

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
const MIN_DAILY_TEMPS = 5;

const JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SEMAINE_MS = 7 * 24 * 60 * 60 * 1000;

function semaineIso(date: Date): number {
  return Math.floor(date.getTime() / SEMAINE_MS);
}

function frequenceHabituelle(seances: SeanceLog[]): ProfilApprisItem | null {
  if (seances.length < MIN_SEANCES_FREQUENCE) return null;
  const semaines = seances.map((seance) => semaineIso(seance.date));
  const premiereSemaine = Math.min(...semaines);
  const derniereSemaine = Math.max(...semaines);
  // Les semaines sans séance entre la première et la dernière comptent
  // aussi : sinon 6 séances concentrées sur une seule semaine pourraient
  // être présentées à tort comme une habitude durable.
  const nombreSemainesObservees = Math.max(1, derniereSemaine - premiereSemaine + 1);
  const frequence = Math.round((seances.length / nombreSemainesObservees) * 10) / 10;
  return {
    label: "Fréquence habituelle",
    valeur: `~${frequence} séance${frequence > 1 ? "s" : ""} / semaine`,
    preuve: `${seances.length} séances observées sur ${nombreSemainesObservees} semaines consécutives`,
    maturite: seances.length >= MIN_SEANCES_FREQUENCE * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
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
  return {
    label: "Jour le plus régulier",
    valeur: JOURS_FR[index] ?? "Non déterminé",
    preuve: `${max} séance${max > 1 ? "s" : ""} ce jour sur ${seances.length} observées`,
    maturite: seances.length >= MIN_SEANCES_MEILLEUR_JOUR * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

function exerciceEnProgression(tests: TestMaxi[]): ProfilApprisItem | null {
  const parExercice = new Map<string, TestMaxi[]>();
  tests.forEach((t) => {
    const liste = parExercice.get(t.exercice) ?? [];
    liste.push(t);
    parExercice.set(t.exercice, liste);
  });

  let meilleur: { exercice: string; hausse: number; nombreTests: number } | null = null;
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
      meilleur = { exercice, hausse, nombreTests: liste.length };
    }
  }
  if (!meilleur) return null;
  return {
    label: "Exercice en progression",
    valeur: LABEL_PAR_EXERCICE[meilleur.exercice as keyof typeof LABEL_PAR_EXERCICE] ?? meilleur.exercice,
    preuve: `${meilleur.nombreTests} tests, progression mesurée de ${Math.round(meilleur.hausse * 100)} %`,
    maturite: meilleur.nombreTests >= MIN_TESTS_PROGRESSION * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

function dureeMoyenne(seances: SeanceLog[]): ProfilApprisItem | null {
  const durees = seances.map((s) => s.dureeMinutes).filter((v): v is number => v != null);
  if (durees.length < MIN_SEANCES_DUREE) return null;
  const moyenne = Math.round(durees.reduce((a, b) => a + b, 0) / durees.length);
  return {
    label: "Durée moyenne",
    valeur: `${moyenne} minutes`,
    preuve: `${durees.length} séances avec une durée renseignée`,
    maturite: durees.length >= MIN_SEANCES_DUREE * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

// Phase 3 (11/08/2026) — adhérence au plan nutrition, à partir des
// check-ins repas (RepasLog). "Comme prévu" compte seul comme respecté :
// un petit ou gros écart reste un écart, même partiel.
function adherenceNutrition(repas: RepasLog[]): ProfilApprisItem | null {
  if (repas.length < MIN_REPAS_ADHERENCE) return null;
  const commePrevu = repas.filter((r) => r.statut === "COMME_PREVU").length;
  const pourcent = Math.round((commePrevu / repas.length) * 100);
  return {
    label: "Adhérence nutrition",
    valeur: `${pourcent} %`,
    preuve: `${repas.length} repas renseignés sur les 90 derniers jours`,
    maturite: repas.length >= MIN_REPAS_ADHERENCE * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

// Phase 3, bloc NEAT (11/08/2026) — activité quotidienne hors séances.
// Même seuil minimum que le reste du bloc (MIN_JOURS_NEAT) pour rester
// cohérent avec la carte "Activité quotidienne" du dashboard.
function activiteQuotidienne(pasParJour: number[]): ProfilApprisItem | null {
  if (pasParJour.length < MIN_JOURS_NEAT) return null;
  const moyenne = Math.round(pasParJour.reduce((a, b) => a + b, 0) / pasParJour.length);
  return {
    label: "Activité quotidienne",
    valeur: `~${moyenne} pas / jour en moyenne`,
    preuve: `${pasParJour.length} journées avec un nombre de pas`,
    maturite: pasParJour.length >= MIN_JOURS_NEAT * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
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
  return {
    label: "Zone à surveiller",
    valeur: plusFrequente[0],
    preuve: `${plusFrequente[1]} gênes signalées sur cette zone`,
    maturite: plusFrequente[1] >= MIN_MENTIONS_ZONE * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

function tempsDisponibleHabituel(dailies: DailySession[]): ProfilApprisItem | null {
  const temps = dailies.map((daily) => daily.availableMinutes).filter((value): value is number => value != null);
  if (temps.length < MIN_DAILY_TEMPS) return null;
  const comptes = new Map<number, number>();
  for (const minutes of temps) comptes.set(minutes, (comptes.get(minutes) ?? 0) + 1);
  const favori = [...comptes.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!favori) return null;
  const [minutes, occurrences] = favori;
  return {
    label: "Temps disponible habituel",
    valeur: minutes === 75 ? "60+ minutes" : `${minutes} minutes`,
    preuve: `Choisi ${occurrences} fois sur ${temps.length} check-ins quotidiens`,
    maturite: temps.length >= MIN_DAILY_TEMPS * 2 ? "ETABLI" : "EN_OBSERVATION",
  };
}

// Construit "Ce que COAI apprend sur toi" (section dédiée, 11/08/2026) —
// chaque item n'apparaît que si assez de données réelles le soutiennent ;
// une liste vide signifie "COAI apprend encore à te connaître" côté UI,
// jamais une conclusion fabriquée pour remplir l'espace.
export async function buildProfilIntelligence(userId: string): Promise<ProfilIntelligence> {
  const depuis90Jours = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [seances, checkins, tests, repas, activites, dailies] = await Promise.all([
    prisma.seanceLog.findMany({ where: { userId, date: { gte: depuis90Jours } }, orderBy: { date: "asc" } }),
    prisma.weeklyCheckin.findMany({ where: { userId }, orderBy: { semaineDebut: "desc" }, take: 8 }),
    prisma.testMaxi.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.repasLog.findMany({ where: { userId, date: { gte: depuis90Jours } } }),
    prisma.activiteJournaliere.findMany({ where: { userId, date: { gte: depuis90Jours } } }),
    prisma.dailySession.findMany({ where: { userId, date: { gte: depuis90Jours } }, orderBy: { date: "desc" } }),
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
      preuve: `${energies.length} bilans hebdomadaires avec énergie renseignée`,
      maturite: energies.length >= MIN_CHECKINS_RECUPERATION * 2 ? "ETABLI" : "EN_OBSERVATION",
    });
  }

  const exerciceProgression = exerciceEnProgression(tests);
  if (exerciceProgression) items.push(exerciceProgression);

  const zone = zoneASurveiller(seances);
  if (zone) items.push(zone);

  const adherence = adherenceNutrition(repas);
  if (adherence) items.push(adherence);

  const pasParJour = activites.map((a) => a.pas).filter((v): v is number => v != null);
  const activite = activiteQuotidienne(pasParJour);
  if (activite) items.push(activite);

  const tempsHabituel = tempsDisponibleHabituel(dailies);
  if (tempsHabituel) items.push(tempsHabituel);

  const testsParExercice = new Map<string, number>();
  for (const test of tests) testsParExercice.set(test.exercice, (testsParExercice.get(test.exercice) ?? 0) + 1);
  const meilleurEchantillonTests = Math.max(0, ...testsParExercice.values());

  const axes: AxeApprentissage[] = [
    { label: "Entraînement", actuel: seances.length, cible: MIN_SEANCES_FREQUENCE },
    { label: "Récupération", actuel: energies.length, cible: MIN_CHECKINS_RECUPERATION },
    { label: "Progression", actuel: meilleurEchantillonTests, cible: MIN_TESTS_PROGRESSION },
    { label: "Nutrition", actuel: repas.length, cible: MIN_REPAS_ADHERENCE },
    { label: "Activité", actuel: pasParJour.length, cible: MIN_JOURS_NEAT },
    { label: "Daily", actuel: dailies.filter((daily) => daily.availableMinutes != null).length, cible: MIN_DAILY_TEMPS },
  ];
  const progression = Math.round(
    axes.reduce((total, axe) => total + Math.min(1, axe.actuel / axe.cible), 0) / axes.length * 100
  );

  return { items, progression, axes, tendances: buildTendancesDaily(dailies) };
}

export async function buildProfilAppris(userId: string): Promise<ProfilApprisItem[]> {
  return (await buildProfilIntelligence(userId)).items;
}
