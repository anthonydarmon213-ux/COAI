import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { appleClientCatalogue } from '@/lib/subscription/apple-catalogue';
import { applePurchasesAvailable } from '@/lib/subscription/apple-server-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };

/** Discovery only: no purchase, account creation, or entitlement mutation. */
export async function GET() {
  try {
    if (!await getCurrentUser()) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers });
    }
    return NextResponse.json({ ...appleClientCatalogue(), purchasesEnabled: applePurchasesAvailable() }, { headers });
  } catch {
    return NextResponse.json({ error: 'Offres temporairement indisponibles. Réessaie.' }, { status: 503, headers });
  }
}
