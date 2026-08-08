import type { ExerciceMaxi } from "@prisma/client";

export const LABEL_PAR_EXERCICE: Record<ExerciceMaxi, string> = {
  DEVELOPPE_COUCHE: "Développé couché",
  SQUAT: "Squat",
  SOULEVE_DE_TERRE: "Soulevé de terre",
  TRACTION: "Traction",
  SOUPLESSE: "Flexion antérieure",
  EQUILIBRE: "Appui unipodal (yeux fermés)",
  ENDURANCE: "Test de Cooper (12 min)",
  VITESSE: "Sprint 30m",
  PUISSANCE: "Saut vertical",
};

export type QualitePhysique =
  | "Force"
  | "Souplesse"
  | "Équilibre"
  | "Endurance"
  | "Vitesse"
  | "Puissance";

export const QUALITE_PAR_EXERCICE: Record<ExerciceMaxi, QualitePhysique> = {
  DEVELOPPE_COUCHE: "Force",
  SQUAT: "Force",
  SOULEVE_DE_TERRE: "Force",
  TRACTION: "Force",
  SOUPLESSE: "Souplesse",
  EQUILIBRE: "Équilibre",
  ENDURANCE: "Endurance",
  VITESSE: "Vitesse",
  PUISSANCE: "Puissance",
};

export const ORDRE_EXERCICES: ExerciceMaxi[] = [
  "DEVELOPPE_COUCHE",
  "SQUAT",
  "SOULEVE_DE_TERRE",
  "TRACTION",
  "SOUPLESSE",
  "EQUILIBRE",
  "ENDURANCE",
  "VITESSE",
  "PUISSANCE",
];

export const ORDRE_QUALITES: QualitePhysique[] = [
  "Force",
  "Vitesse",
  "Puissance",
  "Souplesse",
  "Équilibre",
  "Endurance",
];
