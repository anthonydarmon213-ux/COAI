// Pont entre le quiz public (/diagnostic, visiteur anonyme) et le profil
// réel une fois le compte créé et payé. Le quiz écrit ici juste avant de
// rediriger vers /sign-up ; DiagnosticAutofill (rendu sur /bienvenue) lit et
// vide cette clé pour pré-remplir le Profile sans que l'utilisateur ait à
// tout ressaisir. localStorage plutôt qu'un cookie/la base : donnée jetable,
// anonyme, jamais utile après le premier remplissage du profil.
const STORAGE_KEY = "coai_diagnostic_pre_signup";

export type DiagnosticAnswers = {
  niveau?: string;
  objectifs?: string;
  persona?: string;
  equipementDisponible?: string;
  lieuEntrainement?: string;
  dureeSeanceMinutes?: number;
  frequenceEntrainement?: string;
  contraintesSante?: string;
  sexe?: string;
  // Cycle menstruel / maternité (14/08/2026) — opt-in, cf. reponsesEnProfil
  // dans diagnostic-quiz.tsx pour la logique de construction de ces champs.
  cycleMenstruelSuivi?: boolean;
  dateDernieresRegles?: string;
  dureeCycleJours?: number;
  reglesDouloureuses?: boolean;
  statutMaternite?: "ENCEINTE" | "POST_PARTUM";
  dateReferenceMaternite?: string;
  sportsPratiques?: string;
  habitudesAlimentaires?: string;
  qualiteSommeil?: string;
  age?: number;
  tailleCm?: number;
  poidsKg?: number;
};

export function storeDiagnosticAnswers(answers: DiagnosticAnswers): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : le quiz
    // reste utilisable, seul le pré-remplissage post-inscription est perdu.
  }
}

export function readDiagnosticAnswers(): DiagnosticAnswers | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiagnosticAnswers) : null;
  } catch {
    return null;
  }
}

export function clearDiagnosticAnswers(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
}
