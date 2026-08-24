export type WorkoutSession = Record<string, unknown> & {
  jour?: string;
  nom?: string;
  echauffement?: string;
  exercices?: Record<string, unknown>[];
  retourAuCalme?: string;
};

export type DailyCheckinInput = {
  sleep: "TRES_MAUVAIS" | "MAUVAIS" | "CORRECT" | "BON" | "EXCELLENT";
  energy: "TRES_BASSE" | "BASSE" | "NORMALE" | "HAUTE" | "TRES_HAUTE";
  // Charge mentale/agenda du jour, distincte du sommeil/énergie — une
  // journée peut être reposée mais chargée de stress/imprévus. Facultatif :
  // l'adaptation reste inchangée si non renseigné (comportement identique à
  // avant l'ajout de ce champ).
  chargeMentale?: "LEGERE" | "NORMALE" | "CHARGEE" | "SATUREE";
  food?: "PAS_ENCORE" | "LEGER" | "EQUILIBRE" | "LOURD";
  pain: boolean;
  painArea?: string;
  availableMinutes: 15 | 25 | 40 | 60 | 75;
  equipementDuJour?: string;
};

export type AdaptationSummary = {
  adapted: boolean;
  title: string;
  reason: string;
  changes: string[];
  originalExerciseCount: number;
  adaptedExerciseCount: number;
};

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function normalise(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const CORE_PATTERN = /(abdo|gainage|planche|crunch|core|dead bug|hollow|bird dog|pallof)/i;

export function isCoreExercise(exercise: Record<string, unknown>) {
  return CORE_PATTERN.test(String(exercise.nom ?? ""));
}

// Les toutes premières V1 ont parfois été générées avant que le prompt
// n'impose un finisher gainage et un retour au calme. Cette normalisation
// complète uniquement la séance du jour : elle ne modifie jamais le programme
// source. Le mouvement proposé est volontairement simple, sans charge, et
// demande explicitement d'arrêter au moindre inconfort.
export function ensureWorkoutCompleteness(session: WorkoutSession): WorkoutSession {
  const exercises = Array.isArray(session.exercices) ? session.exercices : [];
  if (exercises.length === 0) return session;

  const completedExercises = exercises.some(isCoreExercise)
    ? exercises
    : [
        ...exercises,
        {
          nom: "Dead bug contrôlé — gainage profond",
          series: "2",
          repetitions: "6 à 8 répétitions lentes par côté",
          repos: "45 sec",
          charge: "Poids du corps — garde le bas du dos stable et arrête au moindre inconfort",
          methode: "Série classique",
        },
      ];

  return {
    ...session,
    exercices: completedExercises,
    retourAuCalme:
      session.retourAuCalme ??
      "5 à 8 minutes : marche ou pédalage très léger, respiration calme, puis mobilité douce des zones travaillées. Aucun étirement ne doit provoquer de douleur.",
  };
}

export function getWorkoutForDate(contenu: unknown, date: Date): WorkoutSession | null {
  if (!contenu || typeof contenu !== "object" || Array.isArray(contenu)) return null;
  const seances = (contenu as { seances?: unknown }).seances;
  if (!Array.isArray(seances)) return null;
  const jour = JOURS[date.getDay()] ?? "";
  return (seances.find((seance) => {
    if (!seance || typeof seance !== "object" || Array.isArray(seance)) return false;
    const valeur = String((seance as { jour?: unknown }).jour ?? "");
    return normalise(valeur).includes(normalise(jour));
  }) ?? null) as WorkoutSession | null;
}

function reduceSeries(exercice: Record<string, unknown>) {
  const series = exercice.series;
  const parsed = typeof series === "number" ? series : Number.parseInt(String(series ?? ""), 10);
  return {
    ...exercice,
    ...(Number.isFinite(parsed) ? { series: String(Math.max(1, parsed - 1)) } : {}),
    methode: "Série classique",
  };
}

const MOTIFS_MATERIEL = [
  /halt[eè]re/i,
  /barre/i,
  /machine|poulie|smith|guid[ée]e?/i,
  /kettlebell/i,
  /trx|sangle/i,
  /[ée]lastique|bande de r[ée]sistance/i,
  /banc/i,
  /m[ée]decine.?ball|wall.?ball/i,
  /corde/i,
];

function exerciceCompatibleAvecMateriel(exercice: Record<string, unknown>, materiel: string) {
  if (materiel.includes("Salle de sport complète")) return true;
  const nom = String(exercice.nom ?? "");
  const exigeMateriel = MOTIFS_MATERIEL.some((motif) => motif.test(nom));
  if (!exigeMateriel) return true;
  if (/halt[eè]re|banc/i.test(nom) && materiel.includes("Matériel à la maison")) return true;
  if (/[ée]lastique|bande de r[ée]sistance/i.test(nom) && materiel.includes("Élastiques")) return true;
  if (/kettlebell/i.test(nom) && materiel.includes("Kettlebell")) return true;
  if (/trx|sangle/i.test(nom) && materiel.includes("TRX")) return true;
  return false;
}

export function adaptWorkout(
  source: WorkoutSession,
  checkin: DailyCheckinInput,
  expectedMinutes: number
): { session: WorkoutSession; summary: AdaptationSummary } {
  const completeSource = ensureWorkoutCompleteness(source);
  const exercices = Array.isArray(completeSource.exercices) ? completeSource.exercices : [];
  const changes: string[] = [];

  if (checkin.pain) {
    const zone = checkin.painArea ? ` au niveau ${checkin.painArea.toLowerCase()}` : "";
    return {
      session: {
        ...completeSource,
        nom: "Récupération prudente",
        exercices: [],
        echauffement: undefined,
        retourAuCalme:
          "Ne travaille pas à travers une douleur. Privilégie le repos et demande un avis médical si la gêne persiste, s'intensifie ou t'inquiète.",
      },
      summary: {
        adapted: true,
        title: "COAI a adapté ta séance",
        reason: `Tu as signalé une douleur ou une gêne${zone} — on met la séance en pause aujourd'hui, par prudence. Rien à prouver, mieux vaut laisser la gêne se calmer.`,
        changes: ["Séance d'entraînement suspendue aujourd'hui", "Aucune progression ni charge proposée"],
        originalExerciseCount: exercices.length,
        adaptedExerciseCount: 0,
      },
    };
  }

  // Charge mentale saturée (20/08/2026, piste "Real-Time Contextual Engine"
  // allégée) — priorité juste après la douleur : forcer un HIIT/renfo un
  // jour saturé ferait plus de mal que de bien. La séance devient une vraie
  // pause active plutôt qu'un entraînement au rabais, avec une explication
  // qui parle à la personne, pas à un tableau de métriques.
  if (checkin.chargeMentale === "SATUREE") {
    return {
      session: {
        ...completeSource,
        nom: "Mobilité douce & respiration",
        exercices: [],
        echauffement: undefined,
        retourAuCalme:
          "10 à 15 minutes de mobilité douce (hanches, épaules, colonne) suivies de respiration dirigée (inspire 4s, expire 6s, plusieurs minutes). L'objectif n'est pas de transpirer, c'est de faire redescendre la pression.",
      },
      summary: {
        adapted: true,
        title: "COAI a adapté ta séance",
        reason:
          "Ta journée s'annonce chargée et ton niveau de tension est élevé. On transforme la séance prévue en mouvement doux et respiration dirigée, pour souffler vraiment — sans te faire perdre ton sentiment d'accomplissement.",
        changes: ["Séance d'effort remplacée par de la mobilité et de la respiration", "Aucune charge ni intensité proposée aujourd'hui"],
        originalExerciseCount: exercices.length,
        adaptedExerciseCount: 0,
      },
    };
  }

  const lowRecovery = ["TRES_MAUVAIS", "MAUVAIS"].includes(checkin.sleep) ||
    ["TRES_BASSE", "BASSE"].includes(checkin.energy);
  const journeeChargee = checkin.chargeMentale === "CHARGEE";
  const needsFuelCaution = checkin.food === "PAS_ENCORE" || checkin.food === "LOURD";
  let adaptedExercises = [...exercices];
  let materielAjuste = false;

  if (checkin.equipementDuJour && !checkin.equipementDuJour.includes("Salle de sport complète")) {
    const compatibles = adaptedExercises.filter((exercice) =>
      exerciceCompatibleAvecMateriel(exercice, checkin.equipementDuJour ?? "")
    );
    if (compatibles.length > 0 && compatibles.length < adaptedExercises.length) {
      const retires = adaptedExercises.length - compatibles.length;
      adaptedExercises = compatibles;
      materielAjuste = true;
      changes.push(`${retires} exercice${retires > 1 ? "s" : ""} retiré${retires > 1 ? "s" : ""} car le matériel n'est pas disponible aujourd'hui`);
    }
  }

  if (checkin.availableMinutes < expectedMinutes && adaptedExercises.length > 0) {
    const targetCount = Math.max(1, Math.min(adaptedExercises.length, Math.floor(adaptedExercises.length * checkin.availableMinutes / expectedMinutes)));
    const coreExercise = adaptedExercises.find(isCoreExercise);
    const priorityCount = coreExercise ? targetCount - 1 : targetCount;
    adaptedExercises = adaptedExercises.filter((exercise) => exercise !== coreExercise).slice(0, priorityCount);
    if (coreExercise) adaptedExercises.push(coreExercise);
    changes.push(`Durée ramenée à ${checkin.availableMinutes === 75 ? "60+" : checkin.availableMinutes} min en gardant les exercices prioritaires`);
  }

  if (lowRecovery || journeeChargee) {
    adaptedExercises = adaptedExercises.map(reduceSeries);
    changes.push(
      lowRecovery
        ? "Volume réduit d'une série par exercice et méthodes d'intensification retirées"
        : "Volume légèrement réduit pour laisser de la place à ta journée chargée"
    );
  }

  if (needsFuelCaution) {
    changes.push(checkin.food === "PAS_ENCORE"
      ? "Départ progressif prévu : hydrate-toi et évite l’intensité si tu manques d’énergie"
      : "Échauffement progressif conseillé après un repas lourd");
  }

  const adapted = changes.length > 0;
  const reasonParts = [];
  if (checkin.availableMinutes < expectedMinutes) reasonParts.push(`tu disposes de ${checkin.availableMinutes === 75 ? "60+" : checkin.availableMinutes} minutes`);
  if (lowRecovery) reasonParts.push("ton sommeil ou ton énergie est faible aujourd'hui");
  if (journeeChargee) reasonParts.push("ta journée s'annonce chargée");
  if (needsFuelCaution) reasonParts.push(checkin.food === "PAS_ENCORE" ? "tu n'as pas encore mangé" : "tu viens de faire un repas lourd");
  if (materielAjuste) reasonParts.push("certains équipements ne sont pas disponibles");

  return {
    session: { ...completeSource, exercices: adaptedExercises },
    summary: {
      adapted,
      title: adapted ? "COAI a adapté ta séance" : "Ta séance reste inchangée",
      reason: adapted
        ? `On a ajusté ta séance parce que ${reasonParts.join(" et ")} — ton programme d'origine, lui, reste intact.`
        : "Ton check-in ne nécessite aucun ajustement aujourd'hui — profite de ta séance telle quelle.",
      changes,
      originalExerciseCount: exercices.length,
      adaptedExerciseCount: adaptedExercises.length,
    },
  };
}

export function getSessionDuration(session: WorkoutSession, fallback: number) {
  const exercices = Array.isArray(session.exercices) ? session.exercices.length : 0;
  return Math.max(15, fallback || exercices * 8 + 10);
}
