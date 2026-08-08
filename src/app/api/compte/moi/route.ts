import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";

// Résumé compte/abonnement au format JSON — utilisé par l'app mobile
// (dashboard + écran compte), qui n'a pas accès aux Server Components du
// site web.
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const plan = getEffectivePlan(user.subscription);

  return NextResponse.json({
    prenom: user.prenom,
    email: user.email,
    plan,
    planLabel: PLAN_LABELS[plan],
    statut: user.subscription?.status ?? null,
    trialEnd: user.subscription?.trialEnd ?? null,
    currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd ?? false,
  });
}
