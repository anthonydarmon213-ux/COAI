import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db/client';
import { appleServerVerifier } from '@/lib/subscription/apple-server-config';
import { deliverAppleTransaction } from '@/lib/subscription/apple-delivery';
import { persistVerifiedAppleTransaction } from '@/lib/subscription/apple-ledger';
import { readEffectiveAccess } from '@/lib/subscription/read-effective-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: object, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' },
});

/** Native API: explicit bearer session required, never cookie-only fallback.
 * No client-chosen user/token/environment/plan participates in authorization.
 */
export async function POST(request: Request) {
  if (!/^Bearer \S+$/.test(request.headers.get('authorization') || '')) {
    return json({ error: 'Connexion requise' }, 401);
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return json({ error: 'Requête JSON requise' }, 415);
  }
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return json({ error: 'Connexion requise' }, 401);
    const config = appleServerVerifier();
    const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id },
      select: { id: true, applePurchaseAccount: { select: { accountToken: true } } } });
    if (!user?.applePurchaseAccount) return json({ error: 'Prépare ton compte avant de restaurer cet achat.' }, 409);
    // Bound actual bytes, including chunked bodies, before parsing JSON.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Achat manquant' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 70000) { await reader.cancel(); return json({ error: 'Requête trop volumineuse' }, 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return json({ error: 'Requête invalide' }, 400); }
    if (!body || typeof body.signedTransaction !== 'string' ||
        !body.signedTransaction.length || body.signedTransaction.length > 65536) {
      return json({ error: 'Achat manquant ou invalide' }, 400);
    }
    const result = await deliverAppleTransaction({ userId: user.id,
      accountToken: user.applePurchaseAccount.accountToken, signedTransaction: body.signedTransaction }, {
      verify: config.verify,
      persist: (userId, facts) => persistVerifiedAppleTransaction(prisma, userId, facts),
      readAccess: userId => readEffectiveAccess(prisma, userId, config.environment),
    });
    return json(result);
  } catch {
    // Includes verifier outages: never finish a transaction on an ambiguous
    // failure, nor expose receipt/token/database details in errors or logs.
    return json({ error: 'Achat non confirmé. Réessaie dans quelques instants.' }, 503);
  }
}
