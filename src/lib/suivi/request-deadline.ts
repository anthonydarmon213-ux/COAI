/** Covers headers AND response body. No automatic retry of a write. */
export async function withRequestDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  milliseconds = 20_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
