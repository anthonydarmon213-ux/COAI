export const COACH_QUOTA_LIMIT = 4;
export const COACH_QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function getCoachQuotaState(used: number, resetAt: Date | null) {
  const expired = !resetAt || Date.now() - resetAt.getTime() >= COACH_QUOTA_WINDOW_MS;
  const effectiveUsed = expired ? 0 : used;
  return {
    expired,
    used: effectiveUsed,
    remaining: Math.max(0, COACH_QUOTA_LIMIT - effectiveUsed),
  };
}
