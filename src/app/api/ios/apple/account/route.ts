import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db/client';
import { getOrCreateAppleAccountToken } from '@/lib/subscription/apple-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers });

/** Account binding only. Does not sell a product or grant an entitlement.
 * Never accepts a user ID or an account token chosen by the requesting client.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  // Use the configured public origin: behind a reverse proxy request.url may
  // carry an internal hostname. Never trust a client-supplied forwarded host.
  const appURL = process.env.NEXT_PUBLIC_APP_URL;
  if (!appURL) return json({ error: 'Service temporairement indisponible' }, 503);
  let appOrigin: string;
  try { appOrigin = new URL(appURL).origin; }
  catch { return json({ error: 'Service temporairement indisponible' }, 503); }
  if (origin && origin !== appOrigin) {
    return json({ error: 'Origine non autorisée' }, 403);
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return json({ error: 'Requête JSON requise' }, 415);
  }
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return json({ error: 'Non authentifié' }, 401);
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id }, select: { id: true },
    });
    if (!user) return json({ error: 'Profil introuvable' }, 404);
    const appAccountToken = await getOrCreateAppleAccountToken(user.id);
    return json({ appAccountToken });
  } catch {
    // Do not leak tokens, account details or database errors to clients/logs.
    return json({ error: 'La préparation de ton compte Apple est temporairement indisponible. Réessaie.' }, 503);
  }
}
