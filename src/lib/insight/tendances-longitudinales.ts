import type { DailySession } from "@prisma/client";

export type TendanceLongitudinale = {
  titre: string;
  constat: string;
  preuve: string;
  ton: "NEUTRAL" | "POSITIF" | "ATTENTION";
};

const MIN_DAILY_TENDANCE = 5;
const MIN_GROUP_RECOVERY = 3;

export function buildTendancesDaily(dailies: DailySession[]): TendanceLongitudinale[] {
  const tendances: TendanceLongitudinale[] = [];
  const avecCheckin = dailies.filter((daily) => daily.sleep != null && daily.energy != null);
  if (avecCheckin.length >= MIN_DAILY_TENDANCE) {
    const terminees = avecCheckin.filter((daily) => daily.completedAt != null).length;
    const taux = Math.round(terminees / avecCheckin.length * 100);
    tendances.push({
      titre: "Régularité Daily",
      constat: `${taux} % des séances ouvertes ont été terminées.`,
      preuve: `${terminees} séances terminées sur ${avecCheckin.length} check-ins quotidiens`,
      ton: taux >= 75 ? "POSITIF" : taux < 50 ? "ATTENTION" : "NEUTRAL",
    });
  }

  const avecRessenti = dailies.filter((daily) => daily.workoutRating != null);
  if (avecRessenti.length >= MIN_DAILY_TENDANCE) {
    const comptes = new Map<string, number>();
    for (const daily of avecRessenti) comptes.set(String(daily.workoutRating), (comptes.get(String(daily.workoutRating)) ?? 0) + 1);
    const dominant = [...comptes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] / avecRessenti.length >= 0.5) {
      const labels: Record<string, string> = { TROP_FACILE: "plutôt faciles", BIEN_DOSEE: "bien dosées", TROP_DURE: "plutôt difficiles" };
      tendances.push({
        titre: "Dosage des séances",
        constat: `Tes séances sont le plus souvent ressenties comme ${labels[dominant[0]] ?? "variables"}.`,
        preuve: `${dominant[1]} ressentis identiques sur ${avecRessenti.length} séances évaluées`,
        ton: dominant[0] === "BIEN_DOSEE" ? "POSITIF" : dominant[0] === "TROP_DURE" ? "ATTENTION" : "NEUTRAL",
      });
    }
  }

  const faibleRecuperation = avecRessenti.filter((daily) =>
    ["TRES_MAUVAIS", "MAUVAIS"].includes(String(daily.sleep)) || ["TRES_BASSE", "BASSE"].includes(String(daily.energy))
  );
  const bonneRecuperation = avecRessenti.filter((daily) =>
    ["BON", "EXCELLENT"].includes(String(daily.sleep)) && ["NORMALE", "HAUTE", "TRES_HAUTE"].includes(String(daily.energy))
  );
  if (faibleRecuperation.length >= MIN_GROUP_RECOVERY && bonneRecuperation.length >= MIN_GROUP_RECOVERY) {
    const dureFaible = faibleRecuperation.filter((daily) => daily.workoutRating === "TROP_DURE").length / faibleRecuperation.length;
    const dureBonne = bonneRecuperation.filter((daily) => daily.workoutRating === "TROP_DURE").length / bonneRecuperation.length;
    const ecart = Math.round((dureFaible - dureBonne) * 100);
    if (Math.abs(ecart) >= 25) {
      tendances.push({
        titre: "Récupération & ressenti",
        constat: ecart > 0
          ? "Les jours de faible récupération sont plus souvent ressentis comme difficiles."
          : "Pour l’instant, une faible récupération n’est pas associée à des séances plus difficiles.",
        preuve: `${faibleRecuperation.length} séances après faible récupération comparées à ${bonneRecuperation.length} après bonne récupération (écart ${Math.abs(ecart)} points)`,
        ton: ecart > 0 ? "ATTENTION" : "NEUTRAL",
      });
    }
  }
  return tendances;
}
