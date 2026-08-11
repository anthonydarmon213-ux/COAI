// Reprise du diagnostic en cas d'abandon (Phase 5B, section 14, 11/08/2026)
// — distinct du pont pré-inscription (storage.ts, écrit une seule fois au
// clic "Créer mon compte") : celui-ci sauvegarde la progression EN COURS à
// chaque étape, pour proposer "Continuer mon diagnostic" si la personne
// revient avant d'avoir terminé. Effacé dès que le résultat est atteint
// (plus rien à reprendre) ou explicitement au clic "Recommencer à zéro".
const STORAGE_KEY = "coai_diagnostic_progress";

export function saveDiagnosticProgress(progress: Record<string, unknown>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : le quiz
    // reste utilisable, seule la reprise est perdue.
  }
}

export function readDiagnosticProgress<T = Record<string, unknown>>(): T | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDiagnosticProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
}
