import { draftKey, parseDraft, type RepCountDraft } from "./repcount-draft";

type InitialDraft = { restored: RepCountDraft | null; failed: boolean };
/** One read per mounted account editor, never reapply storage over active typing. */
export function createInitialRepCountDraft(userId?: string) {
  let cached: InitialDraft | null = null;
  return {
    subscribe: () => () => {},
    serverSnapshot: () => null,
    snapshot: (): InitialDraft => {
      if (cached) return cached;
      try {
        cached = { restored: userId ? parseDraft(window.localStorage.getItem(draftKey(userId))) : null, failed: false };
      } catch { cached = { restored: null, failed: true }; }
      return cached;
    },
  };
}
