import type { ProfilUtilisateur } from "@/lib/ai/client";
import type { SignauxAdaptation } from "@/lib/adaptation/signals";
import type { Pilier } from "@prisma/client";

export type ChangementAdaptation = {
  // CALORIES (Phase 3, nutrition) : cible "Calories journalières" ou
  // "Protéines"/"Glucides"/"Lipides", clampé de façon bidirectionnelle en
  // code (cf. engine.ts) — contrairement à LOAD qui n'est plafonné qu'à la
  // hausse.
  type: "LOAD" | "VOLUME" | "EXERCICE" | "CONTRAINTE" | "CALORIES";
  cible: string;
  avant: string | number | null;
  apres: string | number | null;
  raison: string;
};

export type DecisionAdaptationIA = {
  decision: "GARDER" | "PROGRESSER" | "REDUIRE" | "MODIFIER" | "ADAPTER";
  confiance: number;
  changements: ChangementAdaptation[];
  resume: string;
};

const PILIER_LABEL: Record<Pilier, string> = {
  ENTRAINEMENT: "entraînement",
  NUTRITION: "nutrition",
  RECUPERATION: "récupération",
};

// Décision structurée du moteur d'adaptation — reçoit un contexte déjà
// calculé (signaux, cf. signals.ts) plutôt que des données brutes, et doit
// répondre dans un schéma JSON fixe pour rester exploitable par le code
// (contrairement aux prompts de génération de programme, cette réponse
// n'est jamais affichée telle quelle). Les règles de sécurité listées ici
// sont un premier filtre : engine.ts les revérifie et les applique en code,
// ne fait jamais confiance uniquement à ce que l'IA affirme avoir respecté.
export function buildProgrammeAdaptationDecisionPrompt(
  pilier: Pilier,
  profil: ProfilUtilisateur,
  signaux: SignauxAdaptation,
  contenuActuelResume: string,
  directiveUtilisateur?: string | null
): string {
  return `Tu es le moteur d'adaptation de COAI, fondé sur la méthode d'Anthony Darmon (coach diplômé
d'État, 17 ans d'expérience). Analyse si le programme de ${PILIER_LABEL[pilier]} de cet utilisateur
doit évoluer, à partir de signaux réels — jamais d'invention.

PROFIL
Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}

PROGRAMME ACTUEL (version ${signaux.versionActuelle ?? "1"}, généré il y a ${signaux.joursDepuisDerniereVersion ?? "un nombre inconnu de"} jours)
${contenuActuelResume}

SIGNAUX RÉELS (${signaux.nombreSeancesRecentes} séance(s) loguée(s) sur les 14 derniers jours)
Difficulté moyenne ressentie : ${signaux.moyenneDifficulte ?? "non renseignée"} / 5
Énergie moyenne en séance : ${signaux.moyenneEnergie ?? "non renseignée"} / 5
Douleur récente : ${
    signaux.douleurRecente
      ? `${signaux.douleurRecente.niveau === "IMPORTANTE" ? "IMPORTANTE" : "légère"}${signaux.douleurRecente.zone ? ` (${signaux.douleurRecente.zone})` : ""}, le ${signaux.douleurRecente.date}`
      : "aucune signalée"
  }
Tendance du poids : ${signaux.tendancePoidsKg != null ? `${signaux.tendancePoidsKg > 0 ? "+" : ""}${signaux.tendancePoidsKg} kg entre les 2 dernières mesures` : "non renseignée"}
Performance : ${
    signaux.regressionPerf
      ? `baisse de ${signaux.regressionPerf.baissePourcent}% sur ${signaux.regressionPerf.exercice}`
      : "pas de régression détectée"
  }
Dernier check-in hebdomadaire : ${
    signaux.checkinHebdo
      ? `sommeil ${signaux.checkinHebdo.sommeil ?? "non renseigné"}, énergie ${signaux.checkinHebdo.energie ?? "non renseignée"}/5, stress ${signaux.checkinHebdo.stress ?? "non renseigné"}/5, motivation ${signaux.checkinHebdo.motivation ?? "non renseignée"}/5, douleurs cette semaine : ${signaux.checkinHebdo.douleurs === true ? "oui" : signaux.checkinHebdo.douleurs === false ? "non" : "non renseigné"}, séances réalisées : ${signaux.checkinHebdo.seancesRealisees ?? "non renseigné"}`
      : "aucun check-in hebdomadaire enregistré"
  }
Adhérence au plan nutrition (check-ins repas, 14 derniers jours) : ${
    signaux.adherenceRepas
      ? `${signaux.adherenceRepas.commePrevu}/${signaux.adherenceRepas.total} comme prévu, ${signaux.adherenceRepas.petitEcart} petit(s) écart(s), ${signaux.adherenceRepas.grosEcart} gros écart(s)`
      : "aucun check-in repas enregistré"
  }
${directiveUtilisateur ? `\nCONTRAINTE PONCTUELLE SIGNALÉE PAR L'UTILISATEUR : "${directiveUtilisateur}" — le programme doit s'y adapter temporairement (decision "ADAPTER").` : ""}

RÈGLES STRICTES (obligatoires)
- Ne jamais inventer une donnée non fournie : si une valeur est "non renseignée", n'en tiens pas compte pour ta décision.
- Si une douleur IMPORTANTE est signalée, la décision doit être "REDUIRE" ou "GARDER", jamais "PROGRESSER".
- Toute augmentation de charge doit rester modérée (maximum +10% par rapport à la valeur actuelle).
- Pour le pilier nutrition, tout changement calorique ou de macronutriment (type "CALORIES") doit rester modéré (maximum ±10% par rapport à la valeur actuelle) — jamais une restriction ou un surplus extrême, même si l'adhérence est mauvaise ou le poids stagne depuis longtemps.
- Si les signaux sont insuffisants ou ambigus, choisis "GARDER" et explique-le dans "resume" plutôt que de forcer un changement.
- Chaque élément de "changements" doit avoir une raison concrète, appuyée sur un signal listé ci-dessus — jamais une justification générique.

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "decision": "GARDER" | "PROGRESSER" | "REDUIRE" | "MODIFIER" | "ADAPTER",
  "confiance": 0.75,
  "changements": [
    { "type": "LOAD" | "VOLUME" | "EXERCICE" | "CONTRAINTE" | "CALORIES", "cible": "ex: Développé couché ou Calories journalières", "avant": "70 kg ou 2500 kcal", "apres": "72.5 kg ou 2400 kcal", "raison": "phrase courte, appuyée sur un signal réel" }
  ],
  "resume": "1-2 phrases résumant la décision et pourquoi, dans un ton de coach — cette phrase sera montrée telle quelle à l'utilisateur"
}
"changements" doit être un tableau vide si decision est "GARDER". Utilise le type "CALORIES" uniquement pour le pilier nutrition (calories, protéines, glucides, lipides) — jamais pour l'entraînement ou la récupération.`;
}
