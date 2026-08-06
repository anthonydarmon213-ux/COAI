import type { ProfilUtilisateur } from "@/lib/ai/client";
import type { JourRecuperation } from "@/lib/ai/prompts/programme-recuperation-structure";

// Étape 2/2 de la génération RÉCUPÉRATION : détail complet d'UN jour.
// Génère chaque jour séparément (en parallèle depuis la route) plutôt qu'un
// seul gros appel pour toute la semaine, pour rester sous la limite de temps
// d'une fonction Vercel.
export function buildProgrammeRecuperationJourPrompt(
  profil: ProfilUtilisateur,
  jour: JourRecuperation
): string {
  return `Tu es le coach IA de COAI, fondé sur la méthode d'Anthony Darmon.
Génère le détail des recommandations de récupération du ${jour.jour} (${jour.type}) pour cet
utilisateur.

Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Qualité de sommeil actuelle : ${profil.qualiteSommeil ?? "non renseignée"}

${
  jour.type === "Jour d'entraînement"
    ? `Ce jour suit une séance d'entraînement : concentre-toi sur la récupération active
(mobilité/étirements ciblés, retour au calme) adaptée à l'effort fourni.`
    : `Ce jour est un jour de repos : concentre-toi sur la récupération complète (repos actif
léger optionnel, sommeil, gestion de la fatigue).`
}

Réponds au format JSON avec : "jour" ("${jour.jour}"), "type" ("${jour.type}"), et pour ce jour
précis :
- "mobiliteEtirements" : recommandation concrète et courte (ex: durée, zones ciblées)
- "sommeil" : un conseil concret pour ce jour, adapté à la qualité de sommeil déclarée
- "gestionFatigue" : un conseil concret pour ce jour (ex: respiration, marche, repos actif)`;
}
