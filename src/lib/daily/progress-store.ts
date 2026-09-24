type Progress = { started: boolean; steps: string[]; failed: boolean };
const EMPTY: Progress = { started: false, steps: [], failed: false };

// Only step identifiers are persisted, scoped to a server-owned daily snapshot.
export function createDailyProgressStore(key: string | null, allowedKeys: string, storage: () => Storage = () => window.localStorage) {
  const allowed: string[] = JSON.parse(allowedKeys);
  let current: Progress | null = null;
  const listeners = new Set<() => void>();
  function snapshot(): Progress {
    if (current) return current;
    current = EMPTY;
    if (!key) return current;
    try {
      const raw = storage().getItem(key);
      if (!raw) return current;
      const value = JSON.parse(raw);
      if (value?.version !== 1 || typeof value.started !== "boolean" || !Array.isArray(value.steps) ||
          !Number.isFinite(value.savedAt) || Date.now() - value.savedAt > 72 * 3600_000 || value.savedAt > Date.now() + 60_000) return current;
      current = { started: value.started, steps: [...new Set<string>(value.steps.filter((step: unknown): step is string => typeof step === "string" && allowed.includes(step)))], failed: false };
    } catch { current = { ...EMPTY, failed: true }; }
    return current;
  }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    serverSnapshot: () => EMPTY,
    snapshot,
    update(change: (previous: Progress) => Pick<Progress, "started" | "steps">) {
      const next = change(snapshot());
      current = { ...next, failed: false };
      if (key) {
        try { storage().setItem(key, JSON.stringify({version: 1, started: next.started, steps: next.steps, savedAt: Date.now()})); }
        catch { current.failed = true; }
      }
      listeners.forEach(listener => listener());
    },
  };
}
