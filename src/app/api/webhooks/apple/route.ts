import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { appleNotificationServerVerifier } from '@/lib/subscription/apple-server-config';
import { receiveAppleNotification } from '@/lib/subscription/apple-notification';
import { persistVerifiedAppleTransaction } from '@/lib/subscription/apple-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: object, status: number) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

/** Apple authenticates with its signed notification, not a browser session.
 * Kept closed until explicit deployment configuration and Apple testing.
 */
export async function POST(request: Request) {
  if (process.env.APPLE_NOTIFICATIONS_ENABLED !== 'true') return json({ error: 'Service indisponible' }, 503);
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return json({ error: 'Requête JSON requise' }, 415);
  }
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Notification manquante' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 140000) { await reader.cancel(); return json({ error: 'Requête trop volumineuse' }, 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return json({ error: 'Requête invalide' }, 400); }
    if (!body || typeof body.signedPayload !== 'string' || !body.signedPayload.length || body.signedPayload.length > 131072) {
      return json({ error: 'Notification invalide' }, 400);
    }
    await receiveAppleNotification(body.signedPayload, {
      verify: appleNotificationServerVerifier(),
      findOwner: async accountToken => (await prisma.applePurchaseAccount.findUnique({
        where: { accountToken }, select: { userId: true },
      }))?.userId ?? null,
      persist: (userId, facts) => persistVerifiedAppleTransaction(prisma, userId, facts),
    });
    return json({ received: true }, 200);
  } catch {
    // Never acknowledge a failed verification/persistence. Apple can retry.
    // No signed receipt, account token or internal detail is logged or returned.
    return json({ error: 'Notification non traitée' }, 503);
  }
}
