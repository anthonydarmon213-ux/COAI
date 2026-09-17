import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

// Structured account data only. Media binaries, unlinked diagnostic leads,
// provider records and private coach notes need a separate access workflow.
// Never join another user's referral record or accept an ID from the caller.
export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers });
    }

    const data = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: {
        profile: true,
        subscription: true,
        programmes: true,
        seances: true,
        mesures: true,
        whatsappEvents: true,
        repasLogs: true,
        avis: true,
        testsMaxi: true,
        weeklyCheckins: true,
        adaptations: true,
        activitesJournalieres: true,
        dailySessions: true,
        recuperationsMusculaires: true,
        programmePurchases: true,
        routines: true,
        formChecks: true,
        churnFeedback: true,
      },
    });

    if (!data) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404, headers });
    }

    return NextResponse.json(data, { headers });
  } catch {
    // Do not expose DB messages or return a partial export as a success.
    return NextResponse.json(
      { error: "L’export est temporairement indisponible. Réessaie dans quelques instants." },
      { status: 503, headers },
    );
  }
}
