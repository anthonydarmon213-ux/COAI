import type { ExerciceMaxi } from "@prisma/client";

export const LABEL_PAR_EXERCICE: Record<ExerciceMaxi, string> = {
  DEVELOPPE_COUCHE: "Développé couché",
  SQUAT: "Squat",
  SOULEVE_DE_TERRE: "Soulevé de terre",
  TRACTION: "Traction",
  SOUPLESSE: "Flexion antérieure",
  EQUILIBRE: "Appui unipodal (yeux fermés)",
  ENDURANCE: "Test de Cooper (12 min)",
};

export type QualitePhysique = "Force" | "Souplesse" | "Équilibre" | "Endurance";

export const QUALITE_PAR_EXERCICE: Record<ExerciceMaxi, QualitePhysique> = {
  DEVELOPPE_COUCHE: "Force",
  SQUAT: "Force",
  SOULEVE_DE_TERRE: "Force",
  TRACTION: "Force",
  SOUPLESSE: "Souplesse",
  EQUILIBRE: "Équilibre",
  ENDURANCE: "Endurance",
};

export const ORDRE_EXERCICES: ExerciceMaxi[] = [
  "DEVELOPPE_COUCHE",
  "SQUAT",
  "SOULEVE_DE_TERRE",
  "TRACTION",
  "SOUPLESSE",
  "EQUILIBRE",
  "ENDURANCE",
];

export const ORDRE_QUALITES: QualitePhysique[] = ["Force", "Souplesse", "Équilibre", "Endurance"];
