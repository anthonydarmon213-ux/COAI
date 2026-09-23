import "server-only";
import { cache } from "react";

// One timestamp per RSC request. Never use a process-wide memo or persistent
// Next cache here: expiry and rolling windows must advance on the next request.
export const requestTime = cache(() => Date.now());
