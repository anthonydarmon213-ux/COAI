import type { ExerciceMaxi } from "@prisma/client";

export const LABEL_PAR_EXERCICE: Record<ExerciceMaxi, string> = {
  DEVELOPPE_COUCHE: "Développé couché",
  SQUAT: "Squat",
  SOULEVE_DE_TERRE: "Soulevé de terre",
  TRACTION: "Traction",
};

export const ORDRE_EXERCICES: ExerciceMaxi[] = [
  "DEVELOPPE_COUCHE",
  "SQUAT",
  "SOULEVE_DE_TERRE",
  "TRACTION",
];
