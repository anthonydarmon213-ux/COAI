import type { ExerciceMaxi } from "@prisma/client";
import { LABEL_PAR_EXERCICE } from "@/lib/tests-maxi/labels";

export type RepereCapitalPhysique = {
  id: "force" | "mobilite" | "equilibre" | "coordination" | "endurance" | "posture";
  label: string;
  statut: "MESURE" | "A_EVALUER" | "A_OBSERVER";
  detail: string;
};

type TestPhysique = {
  exercice: ExerciceMaxi;
  valeur: number;
  unite: string;
  date: Date;
};

type ProfilCapital = {
  vo2Max?: number | null;
  observationsPosture?: string | null;
  derniereAnalysePhoto?: Date | null;
};

const FORCE: ExerciceMaxi[] = [
  "DEVELOPPE_COUCHE",
  "SQUAT",
  "SOULEVE_DE_TERRE",
  "TRACTION",
];

function dernierTest(tests: TestPhysique[], exercices: ExerciceMaxi[]) {
  return tests.find((test) => exercices.includes(test.exercice));
}

function detailTest(test: TestPhysique) {
  return `${LABEL_PAR_EXERCICE[test.exercice]} · ${test.valeur.toLocaleString("fr-FR")} ${test.unite}`;
}

function repereTest(
  id: RepereCapitalPhysique["id"],
  label: string,
  tests: TestPhysique[],
  exercices: ExerciceMaxi[],
  detailAbsent: string
): RepereCapitalPhysique {
  const test = dernierTest(tests, exercices);
  return test
    ? { id, label, statut: "MESURE", detail: detailTest(test) }
    : { id, label, statut: "A_EVALUER", detail: detailAbsent };
}

/**
 * Cartographie factuelle des qualités déjà observées par COAI.
 * Elle mesure la couverture du suivi, jamais le niveau physique : tant
 * qu'une qualité n'a pas de test dédié, aucune note n'est inventée.
 */
export function construireCapitalPhysique(tests: TestPhysique[], profil: ProfilCapital | null) {
  const testsRecents = [...tests].sort((a, b) => b.date.getTime() - a.date.getTime());
  const endurance = dernierTest(testsRecents, ["ENDURANCE"]);
  const postureDisponible = Boolean(profil?.observationsPosture?.trim());

  const reperes: RepereCapitalPhysique[] = [
    repereTest("force", "Force", testsRecents, FORCE, "Premier test à réaliser"),
    repereTest("mobilite", "Mobilité", testsRecents, ["SOUPLESSE"], "Souplesse à évaluer"),
    repereTest("equilibre", "Équilibre", testsRecents, ["EQUILIBRE"], "Stabilité à évaluer"),
    {
      id: "coordination",
      label: "Coordination",
      statut: "A_OBSERVER",
      detail: "Observée au fil des séances",
    },
    endurance
      ? { id: "endurance", label: "Endurance", statut: "MESURE", detail: detailTest(endurance) }
      : typeof profil?.vo2Max === "number"
        ? {
            id: "endurance",
            label: "Endurance",
            statut: "MESURE",
            detail: `VO₂ max · ${profil.vo2Max.toLocaleString("fr-FR")}`,
          }
        : {
            id: "endurance",
            label: "Endurance",
            statut: "A_EVALUER",
            detail: "Capacité cardio à évaluer",
          },
    postureDisponible
      ? {
          id: "posture",
          label: "Posture",
          statut: "MESURE",
          detail: profil?.derniereAnalysePhoto
            ? `Analyse du ${profil.derniereAnalysePhoto.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
            : "Analyse posturale active",
        }
      : {
          id: "posture",
          label: "Posture",
          statut: "A_EVALUER",
          detail: "Analyse à réaliser",
        },
  ];

  return {
    reperes,
    nombreMesures: reperes.filter((repere) => repere.statut === "MESURE").length,
  };
}
