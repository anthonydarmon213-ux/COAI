// Pont entre le quiz public (/diagnostic, visiteur anonyme) et le profil
// réel une fois le compte créé. Le quiz écrit ici juste avant de
// rediriger vers /sign-up ; ActivationFlow (rendu sur /bienvenue) lit et
// vide cette clé pour pré-remplir le Profile sans que l'utilisateur ait à
// tout ressaisir. localStorage plutôt qu'un cookie/la base : donnée jetable,
// anonyme, jamais utile après le premier remplissage du profil. Expiration
// après 24 h ; ceci ne constitue pas une preuve de propriété du brouillon.
const STORAGE_KEY = "coai_diagnostic_pre_signup";
const EMAIL_KEY = "coai_diagnostic_signup_email";

function normalizedEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

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
  coachPreference?: "FULL_IA" | "HYBRIDE" | "VIP_PRESENTIEL";
};

export function storeDiagnosticAnswers(answers: DiagnosticAnswers, email?: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      recipientEmail: normalizedEmail(email),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      answers,
    }));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : le quiz
    // reste utilisable, seul le pré-remplissage post-inscription est perdu.
  }
  try {
    // Préremplissage dans le même onglet uniquement, pas dans le profil
    // sportif ni dans les paramètres du paiement ou de l'analytique.
    if (typeof email === "string" && normalizedEmail(email)) window.sessionStorage.setItem(EMAIL_KEY, email.trim());
    else window.sessionStorage.removeItem(EMAIL_KEY);
  } catch { /* Le formulaire reste utilisable sans stockage. */ }
}

export function readDiagnosticSignupEmail(): string | null {
  try {
    const email = window.sessionStorage.getItem(EMAIL_KEY);
    return email && email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}

export function readDiagnosticAnswers(authenticatedEmail: string | null, onDifferentRecipient?: () => void): DiagnosticAnswers | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved: unknown = JSON.parse(raw);
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      const envelope = saved as Record<string, unknown>;
      if (envelope.version === 2 &&
          typeof envelope.expiresAt === "number" && Number.isFinite(envelope.expiresAt) &&
          envelope.expiresAt > Date.now() &&
          envelope.answers && typeof envelope.answers === "object" && !Array.isArray(envelope.answers)) {
        const recipient = normalizedEmail(envelope.recipientEmail);
        if (!recipient || recipient !== normalizedEmail(authenticatedEmail)) {
          if (recipient && normalizedEmail(authenticatedEmail)) onDifferentRecipient?.();
          return null;
        }
        return envelope.answers as DiagnosticAnswers;
      }
    }
    // Old unbounded transfers have no trustworthy creation date. Never
    // silently reapply them to the next account opened on this device.
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
    return null;
  }
}

export function clearDiagnosticAnswers(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
  try { window.sessionStorage.removeItem(EMAIL_KEY); } catch { /* rien à faire */ }
}
