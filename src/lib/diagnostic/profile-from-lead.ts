import type { Prisma, StatutMaternite } from "@prisma/client";
import { AUCUNE_DOULEUR_LABEL } from "@/lib/diagnostic/mini-diagnostic";

type ProfileDepuisLead = Omit<
  Prisma.ProfileUncheckedCreateInput,
  "id" | "userId" | "updatedAt"
>;

const DUREES_EN_MINUTES: Record<string, number> = {
  "30 minutes": 30,
  "45 minutes": 45,
  "1 heure": 60,
  "1h30 ou plus": 90,
};

const FREQUENCES = new Set([
  "Jamais",
  "1 fois par semaine",
  "2 fois par semaine",
  "3 fois par semaine",
  "4 fois par semaine",
  "5 fois par semaine",
  "6 fois ou plus par semaine",
]);

const PREFERENCES_COACH = new Set(["FULL_IA", "HYBRIDE", "VIP_PRESENTIEL"]);
const STATUTS_MATERNITE = new Set<StatutMaternite>(["ENCEINTE", "POST_PARTUM"]);

function texte(value: unknown, maximum = 1000): string | undefined {
  if (typeof value !== "string") return undefined;
  const nettoye = value.trim();
  return nettoye ? nettoye.slice(0, maximum) : undefined;
}

function liste(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function nombreBorne(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return undefined;
  return value;
}

function dateValide(value: unknown): Date | undefined {
  const brut = texte(value, 40);
  if (!brut) return undefined;
  const date = new Date(brut);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Le lead conserve les réponses brutes nécessaires au calcul du bilan. Ce
// convertisseur reconstruit uniquement les champs Profile réellement
// exploitables, avec les mêmes libellés que le pont navigateur du quiz.
// Il est volontairement tolérant : une ancienne version du questionnaire
// peut manquer des champs sans empêcher la création du compte.
export function profileDepuisReponsesLead(reponses: Prisma.JsonValue): ProfileDepuisLead | null {
  if (!reponses || typeof reponses !== "object" || Array.isArray(reponses)) return null;
  const brut = reponses as Record<string, unknown>;
  if (texte(brut.type)) return null;

  const objectifsPrincipaux = liste(brut.objectifsPrincipaux);
  const objectifPrincipal = texte(brut.objectif);
  const objectifs = [
    ...(objectifsPrincipaux.length ? objectifsPrincipaux : objectifPrincipal ? [objectifPrincipal] : []),
    texte(brut.activiteQuotidienne) ? `activité quotidienne : ${texte(brut.activiteQuotidienne)}` : null,
    texte(brut.objectifPrincipalLibre) ? `objectif précisé : ${texte(brut.objectifPrincipalLibre)}` : null,
    texte(brut.objectifSecondaire) ? `objectif secondaire : ${texte(brut.objectifSecondaire)}` : null,
    texte(brut.importanceObjectif) ? `motivation : ${texte(brut.importanceObjectif)}` : null,
    liste(brut.freinsPrincipaux).length ? `freins : ${liste(brut.freinsPrincipaux).join(", ")}` : null,
    liste(brut.attentesCoai).length ? `attentes envers COAI : ${liste(brut.attentesCoai).join(", ")}` : null,
    texte(brut.prioriteOptimisation) ? `souhaite optimiser : ${texte(brut.prioriteOptimisation)}` : null,
    texte(brut.echeance) ? `échéance : ${texte(brut.echeance)}` : null,
    texte(brut.declencheur) ? `déclencheurs : ${texte(brut.declencheur)}` : null,
  ].filter((item): item is string => Boolean(item)).join(" — ").slice(0, 1000) || undefined;

  const contraintesSante = liste(brut.sante).filter((item) => item !== AUCUNE_DOULEUR_LABEL);
  const antecedentsMedicaux = [
    texte(brut.antecedentsMedicaux, 1000),
    texte(brut.mobiliteRepere) ? `Mobilité : ${texte(brut.mobiliteRepere)}` : null,
    texte(brut.cardioRepere) ? `Cardio : ${texte(brut.cardioRepere)}` : null,
    texte(brut.forceRepere) ? `Force fonctionnelle : ${texte(brut.forceRepere)}` : null,
    texte(brut.mouvementRepere) ? `Mouvements de base : ${texte(brut.mouvementRepere)}` : null,
  ].filter((item): item is string => Boolean(item)).join(" — ").slice(0, 2000) || undefined;

  const frequence = texte(brut.frequence, 100);
  const coachPreference = texte(brut.coachPreference, 40);
  const statutMaternite = texte(brut.statutMaternite, 40) as StatutMaternite | undefined;
  const sexe = texte(brut.sexe, 40);
  const duree = texte(brut.duree, 40);

  const profile: ProfileDepuisLead = {
    objectifs,
    persona: liste(brut.persona).join(", ").slice(0, 1000) || undefined,
    niveau: texte(brut.niveau, 100),
    equipementDisponible: liste(brut.equipement).join(", ").slice(0, 1000) || undefined,
    lieuEntrainement: texte(brut.lieu, 200),
    dureeSeanceMinutes: duree ? DUREES_EN_MINUTES[duree] : undefined,
    frequenceEntrainement: frequence && FREQUENCES.has(frequence) ? frequence : undefined,
    contraintesSante: contraintesSante.join(", ").slice(0, 1000) || undefined,
    antecedentsMedicaux,
    sportsPratiques: liste(brut.sport).join(", ").slice(0, 1000) || undefined,
    habitudesAlimentaires: texte(brut.habitudesAlimentaires, 1000),
    qualiteSommeil: texte(brut.qualiteSommeil, 500),
    age: nombreBorne(brut.age, 1, 120),
    tailleCm: nombreBorne(brut.tailleCm, 50, 300),
    poidsKg: nombreBorne(brut.poidsKg, 20, 400),
    sexe: sexe === "Homme" || sexe === "Femme" || sexe === "Préfère ne pas dire" ? sexe : undefined,
    coachPreference: coachPreference && PREFERENCES_COACH.has(coachPreference) ? coachPreference : undefined,
    cycleMenstruelSuivi: brut.cycleMenstruelSuivi === true ? true : undefined,
    dateDernieresRegles: brut.cycleMenstruelSuivi === true ? dateValide(brut.dateDernieresRegles) : undefined,
    dureeCycleJours: brut.cycleMenstruelSuivi === true ? nombreBorne(brut.dureeCycleJours, 15, 60) : undefined,
    reglesDouloureuses: brut.cycleMenstruelSuivi === true && typeof brut.reglesDouloureuses === "boolean"
      ? brut.reglesDouloureuses
      : undefined,
    statutMaternite: statutMaternite && STATUTS_MATERNITE.has(statutMaternite) ? statutMaternite : undefined,
    dateReferenceMaternite: statutMaternite && STATUTS_MATERNITE.has(statutMaternite)
      ? dateValide(brut.dateReferenceMaternite)
      : undefined,
  };

  return Object.values(profile).some((value) => value !== undefined) ? profile : null;
}
