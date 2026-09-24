/** Local cleanup only, after confirmed logout/deletion. No account data or token. */
export function notifyNativeSessionEnded() {
  if (typeof window === "undefined") return;
  try {
    const native = window as Window & {
      webkit?: { messageHandlers?: { coaiSessionEnded?: { postMessage: (value: string) => void } } };
    };
    native.webkit?.messageHandlers?.coaiSessionEnded?.postMessage("session-ended-v1");
  } catch {
    // A missing/old native shell must not turn confirmed logout into failure.
  }
}
