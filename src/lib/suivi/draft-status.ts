/** Per-editor storage status; never shared across accounts or requests. */
export function createDraftStatus() {
  let failed = false;
  const listeners = new Set<() => void>();
  return {
    snapshot: () => failed,
    serverSnapshot: () => false,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    report: (next: boolean) => {
      if (failed === next) return;
      failed = next;
      listeners.forEach(listener => listener());
    },
  };
}
