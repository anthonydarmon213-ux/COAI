import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { GrowthChart } from "@/components/admin/growth-chart";
import { AdminNav } from "@/components/admin/admin-nav";
import { CapacityPanel } from "@/components/admin/capacity-panel";
import { getCapacitySnapshot } from "@/lib/admin/capacity";
import { AIEconomicsPanel } from "@/components/admin/ai-economics-panel";
import { getAIEconomics } from "@/lib/admin/ai-economics";
import { getRevenueMetrics } from "@/lib/admin/revenue-metrics";

// Prix des paliers payants (cf. commentaire SubscriptionPlan dans le schema).
const PRIX_IMPULSION = 19;
const PRIX_STANDARD = 49;
const PRIX_PREMIUM = 199;
const NB_SEMAINES = 12;

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCents = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default async function AdminBusinessPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const [totalUsers, subscriptions, programmesCount, seancesCount, signupDates, capacity, aiEconomics, revenue, churnReasons] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({
      select: { plan: true, status: true, cancelAtPeriodEnd: true, trialEnd: true, updatedAt: true },
    }),
    prisma.programmeGenerated.count(),
    prisma.seanceLog.count(),
    prisma.user.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
    getCapacitySnapshot(),
    getAIEconomics(),
    getRevenueMetrics(),
    prisma.churnFeedback.groupBy({
      by: ["reason"],
      _count: { _all: true },
      orderBy: { _count: { reason: "desc" } },
    }),
  ]);

  const maintenant = new Date();
  const ilYA30Jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
  const essaisActifs = activeSubs.filter((s) => s.trialEnd && s.trialEnd > maintenant);
  const abonnesPayants = activeSubs.filter((s) => !s.trialEnd || s.trialEnd <= maintenant);
  const nbImpulsion = abonnesPayants.filter((s) => s.plan === "GRATUIT").length;
  const nbStandard = abonnesPayants.filter((s) => s.plan === "STANDARD").length;
  const nbPremium = abonnesPayants.filter((s) => s.plan === "PREMIUM").length;
  const nbActifs = activeSubs.length;
  const nbResiliationsPrevues = activeSubs.filter((s) => s.cancelAtPeriodEnd).length;
  const nbPaiementsEnRetard = subscriptions.filter((s) => s.status === "PAST_DUE").length;
  const nbAnnulations30Jours = subscriptions.filter(
    (s) => s.status === "CANCELED" && s.updatedAt >= ilYA30Jours
  ).length;
  const churnFeedbackCount = churnReasons.reduce((total, item) => total + item._count._all, 0);
  const topChurnReason = churnReasons[0]?.reason ?? "Aucun retour";
  const churnReasonLabels: Record<string, string> = {
    PRIX: "Prix",
    UTILISATION: "Usage insuffisant",
    RESULTATS: "Résultats",
    TECHNIQUE: "Problème technique",
    COACHING: "Coaching",
    AUTRE: "Autre",
  };

  // MRR conservateur : exclut les essais non encore facturés et inclut bien
  // Impulsion, qui était auparavant oubliée du calcul.
  const mrr = nbImpulsion * PRIX_IMPULSION + nbStandard * PRIX_STANDARD + nbPremium * PRIX_PREMIUM;
  const arr = mrr * 12;
  const tauxConversion = totalUsers > 0 ? (abonnesPayants.length / totalUsers) * 100 : 0;

  const semaineMs = 7 * 24 * 60 * 60 * 1000;
  const debut = new Date(Date.now() - (NB_SEMAINES - 1) * semaineMs);
  const croissance = Array.from({ length: NB_SEMAINES }, (_, i) => {
    const finSemaine = new Date(debut.getTime() + (i + 1) * semaineMs);
    const total = signupDates.filter((u) => u.createdAt < finSemaine).length;
    return {
      periode: finSemaine.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      valeur: total,
    };
  });

  const genereLe = new Date().toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <AdminNav current="/admin/business" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <div className="flex items-center gap-2.5">
            <SectionLabel>Espace coach</SectionLabel>
            <Badge tone="warning">Confidentiel</Badge>
          </div>
          <h1 className="font-editorial text-3xl font-normal tracking-tight sm:text-4xl">
            Dashboard business COAI
          </h1>
          <p className="text-sm text-graphite-400">
            Données réelles en direct depuis la base — généré le {genereLe}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Abonnés actifs" value={String(nbActifs)} sublabel={`${nbImpulsion} Impulsion · ${nbStandard} Transformation · ${essaisActifs.length} essai(s)`} highlight />
          <StatCard label="MRR" value={eur.format(mrr)} sublabel="Revenu mensuel récurrent" highlight />
          <StatCard label="ARR projeté" value={eur.format(arr)} sublabel="MRR × 12" />
          <StatCard
            label="Taux de conversion"
            value={`${tauxConversion.toFixed(1)}%`}
            sublabel="Abonnés facturés / inscrits"
          />
          <StatCard label="Utilisateurs inscrits" value={String(totalUsers)} sublabel="Tous paliers confondus" />
          <StatCard label="Programmes générés" value={String(programmesCount)} sublabel="IA + validation coach" />
          <StatCard label="Séances loggées" value={String(seancesCount)} sublabel="Preuve d'usage réel" />
          <StatCard
            label="Résiliations prévues"
            value={String(nbResiliationsPrevues)}
            sublabel="Fin d'abonnement programmée"
          />
          <StatCard label="Essais actifs" value={String(essaisActifs.length)} sublabel="Pas encore inclus dans le MRR" />
          <StatCard label="Paiements en retard" value={String(nbPaiementsEnRetard)} sublabel="Abonnements PAST_DUE" />
          <StatCard label="Annulations · 30 j" value={String(nbAnnulations30Jours)} sublabel="Indicateur de churn récent" />
          <StatCard
            label="Encaissé · 30 j"
            value={eurCents.format(revenue.collectedCents30d / 100)}
            sublabel={`${revenue.successfulPayments30d} paiement(s) réussi(s)`}
            highlight
          />
          <StatCard
            label="Clients payeurs · 30 j"
            value={String(revenue.uniquePayingCustomers30d)}
            sublabel="Clients uniques réellement débités"
          />
          <StatCard
            label="Échecs de paiement · 30 j"
            value={String(revenue.failedPayments30d)}
            sublabel="À relancer ou surveiller"
          />
          <StatCard
            label="Conversion essai · 30 j"
            value={`${revenue.trialConversionRate30d.toFixed(1)}%`}
            sublabel={`${revenue.convertedTrials30d}/${revenue.endedTrials30d} essai(s) devenu(s) payant(s)`}
          />
          <StatCard
            label="Retours résiliation"
            value={String(churnFeedbackCount)}
            sublabel={`Motif principal : ${churnReasonLabels[topChurnReason] ?? topChurnReason}`}
          />
        </div>

        <GrowthChart label={`Croissance des inscriptions — ${NB_SEMAINES} dernières semaines`} points={croissance} />
        <CapacityPanel capacity={capacity} />
        <AIEconomicsPanel economics={aiEconomics} mrrEur={mrr} />
      </div>
    </main>
  );
}
