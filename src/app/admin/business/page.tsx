import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { GrowthChart } from "@/components/admin/growth-chart";
import { AdminNav } from "@/components/admin/admin-nav";

// Prix des paliers payants (cf. commentaire SubscriptionPlan dans le schema).
const PRIX_STANDARD = 49;
const PRIX_PREMIUM = 199;
const NB_SEMAINES = 12;

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default async function AdminBusinessPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const [totalUsers, activeSubs, programmesCount, seancesCount, signupDates] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: true, cancelAtPeriodEnd: true },
    }),
    prisma.programmeGenerated.count(),
    prisma.seanceLog.count(),
    prisma.user.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const nbStandard = activeSubs.filter((s) => s.plan === "STANDARD").length;
  const nbPremium = activeSubs.filter((s) => s.plan === "PREMIUM").length;
  const nbActifs = activeSubs.length;
  const nbResiliationsPrevues = activeSubs.filter((s) => s.cancelAtPeriodEnd).length;

  const mrr = nbStandard * PRIX_STANDARD + nbPremium * PRIX_PREMIUM;
  const arr = mrr * 12;
  const tauxConversion = totalUsers > 0 ? (nbActifs / totalUsers) * 100 : 0;

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
          <StatCard label="Abonnés actifs" value={String(nbActifs)} sublabel={`${nbStandard} Transformation · ${nbPremium} Ancien Premium`} highlight />
          <StatCard label="MRR" value={eur.format(mrr)} sublabel="Revenu mensuel récurrent" highlight />
          <StatCard label="ARR projeté" value={eur.format(arr)} sublabel="MRR × 12" />
          <StatCard
            label="Taux de conversion"
            value={`${tauxConversion.toFixed(1)}%`}
            sublabel="Abonnés actifs / inscrits"
          />
          <StatCard label="Utilisateurs inscrits" value={String(totalUsers)} sublabel="Tous paliers confondus" />
          <StatCard label="Programmes générés" value={String(programmesCount)} sublabel="IA + validation coach" />
          <StatCard label="Séances loggées" value={String(seancesCount)} sublabel="Preuve d'usage réel" />
          <StatCard
            label="Résiliations prévues"
            value={String(nbResiliationsPrevues)}
            sublabel="Fin d'abonnement programmée"
          />
        </div>

        <GrowthChart label={`Croissance des inscriptions — ${NB_SEMAINES} dernières semaines`} points={croissance} />
      </div>
    </main>
  );
}
