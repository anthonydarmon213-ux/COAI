import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same approved Story mark as the iPhone icon, baked by build-app-icons.cjs.
export default function Icon() {
  return new Response(new Uint8Array(readFileSync(join(process.cwd(), "public/brand/coai-app-premium-32.png"))), {
    headers: { "Content-Type": contentType },
  });
}
