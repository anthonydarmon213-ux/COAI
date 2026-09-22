// Reprise du diagnostic en cas d'abandon (Phase 5B, section 14, 11/08/2026)
// — distinct du pont pré-inscription (storage.ts, écrit une seule fois au
// clic "Créer mon compte") : celui-ci sauvegarde la progression EN COURS à
// chaque étape, pour proposer "Continuer mon diagnostic" si la personne
// revient avant d'avoir terminé. Effacé dès que le résultat est atteint
// (plus rien à reprendre) ou explicitement au clic "Recommencer à zéro".
const STORAGE_KEY = "coai_diagnostic_progress";
const PROGRESS_EVENT = "coai:diagnostic-progress";

export function subscribeDiagnosticProgress(refresh: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) refresh();
  };
  window.addEventListener(PROGRESS_EVENT, refresh);
  window.addEventListener("storage", onStorage);
  window.addEventListener("pageshow", refresh);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, refresh);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pageshow", refresh);
  };
}

// Snapshot primitif et stable : pas de nouvel objet à chaque rendu React.
export function diagnosticProgressStep(): string | null {
  const saved = readDiagnosticProgress<Record<string, unknown>>();
  return saved && typeof saved.step === "string" ? saved.step : null;
}
export const serverDiagnosticProgressStep = (): null => null;

export function saveDiagnosticProgress(progress: Record<string, unknown>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : le quiz
    // reste utilisable, seule la reprise est perdue.
  }
}

export function readDiagnosticProgress<T = Record<string, unknown>>(): T | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved as T : null;
  } catch {
    return null;
  }
}

export function clearDiagnosticProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // rien à faire
  }
}
