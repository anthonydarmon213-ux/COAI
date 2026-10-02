// Reprise du diagnostic en cas d'abandon (Phase 5B, section 14, 11/08/2026)
// — distinct du pont pré-inscription (storage.ts, écrit une seule fois au
// clic "Créer mon compte") : celui-ci sauvegarde la progression EN COURS à
// chaque étape, pour proposer "Continuer mon diagnostic" si la personne
// revient avant d'avoir terminé. Le résultat connecté non enregistré est
// réservé au même compte et expire après 24 h ; effacé après sauvegarde.
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
export function diagnosticProgressStep(ownerId?: string | null): string | null {
  const saved = readDiagnosticProgress<Record<string, unknown>>(ownerId);
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

export function readDiagnosticProgress<T = Record<string, unknown>>(ownerId?: string | null): T | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
    if ("step" in saved && saved.step === "result") {
      const result = saved as Record<string, unknown>;
      if (!ownerId || result.ownerId !== ownerId) return null;
      if (typeof result.expiresAt !== "number" || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    return saved as T;
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
