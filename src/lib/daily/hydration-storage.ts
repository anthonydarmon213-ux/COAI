const PREFIX = "coai_eau_locale_v2_";
const EVENT = "coai:hydration-change";
// Unsaved values stay usable for this page session, isolated by account/day.
const unsaved = new Map<string, number>();

function currentKey(userId: string) {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `${PREFIX}${encodeURIComponent(userId)}_${day}`;
}

function read(key: string): number {
  if (unsaved.has(key)) return unsaved.get(key)!;
  try {
    const value = Number(window.localStorage.getItem(key) ?? 0);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

export function hydrationSnapshot(userId: string): string {
  const key = currentKey(userId);
  return `${key}|${read(key)}|${unsaved.has(key) ? "unsaved" : "saved"}`;
}

export const serverHydrationSnapshot = () => "";

export function addHydrationGlass(userId: string): void {
  const key = currentKey(userId);
  const count = Math.min(Number.MAX_SAFE_INTEGER, read(key) + 1);
  try {
    window.localStorage.setItem(key, String(count));
    unsaved.delete(key);
  } catch { unsaved.set(key, count); }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeHydration(refresh: () => void): () => void {
  const storage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREFIX)) refresh();
  };
  const visible = () => { if (document.visibilityState === "visible") refresh(); };
  window.addEventListener(EVENT, refresh);
  window.addEventListener("storage", storage);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", visible);
  const timer = window.setInterval(visible, 60000);
  return () => {
    window.removeEventListener(EVENT, refresh);
    window.removeEventListener("storage", storage);
    window.removeEventListener("pageshow", refresh);
    document.removeEventListener("visibilitychange", visible);
    window.clearInterval(timer);
  };
}
