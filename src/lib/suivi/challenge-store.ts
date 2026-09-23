const PREFIX = "coai_defi_7_jours_v1_";
const EVENT = "coai-challenge-change";

export function completedDays(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [...new Set(value.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 7))]
      : [];
  } catch { return []; }
}

export function challengeStore(userId: string, createdAt: string) {
  const key = PREFIX + userId;
  let unsaved: string | null = null;
  const read = () => {
    if (unsaved !== null) return unsaved;
    try { return localStorage.getItem(key) ?? "[]"; } catch { return "[]"; }
  };
  return {
    read,
    day: () => {
      const start = new Date(createdAt).getTime();
      return Number.isFinite(start) ? Math.max(1, Math.min(7, Math.floor((Date.now() - start) / 86400000) + 1)) : 1;
    },
    subscribe: (refresh: () => void) => {
      const timer = window.setInterval(refresh, 60000);
      const storage = (event: StorageEvent) => { if (event.key === key || event.key === null) refresh(); };
      window.addEventListener("storage", storage);
      window.addEventListener(EVENT, refresh);
      window.addEventListener("pageshow", refresh);
      document.addEventListener("visibilitychange", refresh);
      return () => {
        window.clearInterval(timer);
        window.removeEventListener("storage", storage);
        window.removeEventListener(EVENT, refresh);
        window.removeEventListener("pageshow", refresh);
        document.removeEventListener("visibilitychange", refresh);
      };
    },
    toggle: (day: number) => {
      if (!Number.isInteger(day) || day < 1 || day > 7) return false;
      const previous = completedDays(read());
      const added = !previous.includes(day);
      const next = JSON.stringify(added ? [...previous, day] : previous.filter(value => value !== day));
      try { localStorage.setItem(key, next); unsaved = null; } catch { unsaved = next; }
      window.dispatchEvent(new Event(EVENT));
      return added;
    },
  };
}

export const serverChallengeDays = () => "[]";
export const serverChallengeDay = () => 0;
