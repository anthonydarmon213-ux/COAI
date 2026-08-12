import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
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

  const [totalUsers, subscriptions, programmesCount, seancesCount, signupDates, capacity, aiEconomics, revenue, churnReasons, liensParrainage, filleuls, diagnosticLeads30d, usersAvecAbonnement] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({
      select: { plan: true, billingInterval: true, status: true, cancelAtPeriodEnd: true, trialEnd: true, trialActivationReminderSentAt: true, updatedAt: true, user: { select: { _count: { select: { programmes: true, seances: true } } } } },
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
    prisma.user.count({ where: { codeParrainage: { not: null } } }),
    prisma.user.findMany({
      where: { parraineParId: { not: null } },
      select: {
        createdAt: true,
        recompenseParrainageAppliquee: true,
        subscription: { select: { status: true, trialEnd: true } },
      },
    }),
    prisma.diagnosticLead.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { email: true, utmSource: true, utmCampaign: true, utmContent: true, conversionReminderSentAt: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      select: { email: true, createdAt: true, subscription: { select: { status: true, trialEnd: true } } },
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
  const essaisAvecProgramme = essaisActifs.filter((subscription) => subscription.user._count.programmes > 0).length;
  const essaisAvecSeance = essaisActifs.filter((subscription) => subscription.user._count.seances > 0).length;
  const tauxActivationProgramme = essaisActifs.length > 0 ? (essaisAvecProgramme / essaisActifs.length) * 100 : 0;
  const tauxActivationSeance = essaisActifs.length > 0 ? (essaisAvecSeance / essaisActifs.length) * 100 : 0;
  const relancesActivationEnvoyees = subscriptions.filter((subscription) => subscription.trialActivationReminderSentAt).length;
  const [checkoutsCommences30d, relancesCheckout30d, relancesPaiement30d] = await Promise.all([
    prisma.user.count({ where: { checkoutStartedAt: { gte: ilYA30Jours } } }),
    prisma.user.count({ where: { checkoutReminderSentAt: { gte: ilYA30Jours } } }),
    prisma.subscription.count({ where: { paymentRecoveryReminderSentAt: { gte: ilYA30Jours } } }),
  ]);
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
  const mrr = abonnesPayants.reduce((total, subscription) => {
    const monthlyPrice = subscription.plan === "GRATUIT" ? PRIX_IMPULSION : subscription.plan === "STANDARD" ? PRIX_STANDARD : PRIX_PREMIUM;
    const annualPrice = subscription.plan === "GRATUIT" ? 190 : subscription.plan === "STANDARD" ? 490 : PRIX_PREMIUM * 12;
    return total + (subscription.billingInterval === "ANNUAL" ? annualPrice / 12 : monthlyPrice);
  }, 0);
  const arr = mrr * 12;
  const tauxConversion = totalUsers > 0 ? (abonnesPayants.length / totalUsers) * 100 : 0;
  const filleuls30Jours = filleuls.filter((f) => f.createdAt >= ilYA30Jours);
  const filleulsConvertis = filleuls.filter((f) => f.recompenseParrainageAppliquee).length;
  const filleulsEnEssai = filleuls.filter(
    (f) => !f.recompenseParrainageAppliquee && f.subscription?.trialEnd && f.subscription.trialEnd > maintenant
  ).length;
  const conversionParrainage = filleuls.length > 0 ? (filleulsConvertis / filleuls.length) * 100 : 0;
  const emailsLeads = new Set(diagnosticLeads30d.map((lead) => lead.email.toLowerCase()));
  const inscritsDepuisDiagnostic = usersAvecAbonnement.filter((user) => emailsLeads.has(user.email.toLowerCase()));
  const essaisDepuisDiagnostic = inscritsDepuisDiagnostic.filter((user) => user.subscription?.status === "ACTIVE");
  const payantsDepuisDiagnostic = essaisDepuisDiagnostic.filter(
    (user) => !user.subscription?.trialEnd || user.subscription.trialEnd <= maintenant
  );
  const leadsUniques = emailsLeads.size;
  const tauxLeadInscription = leadsUniques > 0 ? (inscritsDepuisDiagnostic.length / leadsUniques) * 100 : 0;
  const tauxInscriptionEssai = inscritsDepuisDiagnostic.length > 0 ? (essaisDepuisDiagnostic.length / inscritsDepuisDiagnostic.length) * 100 : 0;
  const tauxLeadPayant = leadsUniques > 0 ? (payantsDepuisDiagnostic.length / leadsUniques) * 100 : 0;
  const relancesDiagnosticEnvoyees = new Set(
    diagnosticLeads30d.filter((lead) => lead.conversionReminderSentAt).map((lead) => lead.email.toLowerCase())
  ).size;
  const utilisateurParEmail = new Map(usersAvecAbonnement.map((user) => [user.email.toLowerCase(), user]));
  const premierLeadParEmail = new Map<string, (typeof diagnosticLeads30d)[number]>();
  for (const lead of diagnosticLeads30d) {
    const emailNormalise = lead.email.toLowerCase();
    if (!premierLeadParEmail.has(emailNormalise)) premierLeadParEmail.set(emailNormalise, lead);
  }
  const campagnes = new Map<string, { source: string; campagne: string; diagnostics: number; comptes: number; essais: number; payants: number }>();
  for (const [emailNormalise, lead] of premierLeadParEmail) {
    const source = lead.utmSource?.trim() || "direct";
    const campagne = lead.utmCampaign?.trim() || "sans campagne";
    const key = `${source}\u0000${campagne}`;
    const ligne = campagnes.get(key) ?? { source, campagne, diagnostics: 0, comptes: 0, essais: 0, payants: 0 };
    ligne.diagnostics++;
    const user = utilisateurParEmail.get(emailNormalise);
    if (user) ligne.comptes++;
    if (user?.subscription?.status === "ACTIVE") {
      ligne.essais++;
      if (!user.subscription.trialEnd || user.subscription.trialEnd <= maintenant) ligne.payants++;
    }
    campagnes.set(key, ligne);
  }
  const campagnesTriees = [...campagnes.values()].sort((a, b) => b.diagnostics - a.diagnostics || b.payants - a.payants);

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
            label="Revenu récupéré · 30 j"
            value={eurCents.format(revenue.recoveredCents30d / 100)}
            sublabel={`${revenue.recoveredPayments30d} paiement(s) régularisé(s)`}
            highlight
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

        <section className="flex flex-col gap-3">
          <div>
            <SectionLabel>Tunnel revenus · 30 jours</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">
              Mesure interne par email : diagnostic terminé → compte → essai actif → premier paiement.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Diagnostics" value={String(leadsUniques)} sublabel="Prospects uniques" highlight />
            <StatCard label="Comptes créés" value={String(inscritsDepuisDiagnostic.length)} sublabel={`${tauxLeadInscription.toFixed(1)} % des diagnostics`} />
            <StatCard label="Essais actifs" value={String(essaisDepuisDiagnostic.length)} sublabel={`${tauxInscriptionEssai.toFixed(1)} % des comptes`} />
            <StatCard label="Clients payants" value={String(payantsDepuisDiagnostic.length)} sublabel={`${tauxLeadPayant.toFixed(1)} % des diagnostics`} highlight />
          </div>
          <p className="text-xs text-graphite-500">{relancesDiagnosticEnvoyees} relance{relancesDiagnosticEnvoyees > 1 ? "s" : ""} diagnostic envoyée{relancesDiagnosticEnvoyees > 1 ? "s" : ""} sur la période.</p>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <SectionLabel>Récupération Checkout · 30 jours</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">Aucune donnée bancaire n&apos;est stockée dans COAI.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Checkouts commencés" value={String(checkoutsCommences30d)} sublabel="Sessions Stripe créées" />
            <StatCard label="Relances envoyées" value={String(relancesCheckout30d)} sublabel="Après 2 h sans conversion" />
            <StatCard label="Paiements échoués" value={String(revenue.failedPayments30d)} sublabel="Déjà relancés par webhook" />
            <StatCard label="Relances à 48 h" value={String(relancesPaiement30d)} sublabel="Uniquement si toujours impayé" />
            <StatCard label="Paiements récupérés" value={String(revenue.recoveredPayments30d)} sublabel={eurCents.format(revenue.recoveredCents30d / 100)} highlight />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <SectionLabel>Activation des essais</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">Un essai activé découvre la valeur avant le premier prélèvement.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Essais en cours" value={String(essaisActifs.length)} sublabel="Fenêtre de 7 jours" />
            <StatCard label="Programme généré" value={String(essaisAvecProgramme)} sublabel={`${tauxActivationProgramme.toFixed(1)} % des essais`} highlight />
            <StatCard label="Première séance" value={String(essaisAvecSeance)} sublabel={`${tauxActivationSeance.toFixed(1)} % des essais`} highlight />
            <StatCard label="Relances activation" value={String(relancesActivationEnvoyees)} sublabel="Essais sans programme" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <SectionLabel>Acquisition par campagne · 30 jours</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">Attribution au premier diagnostic connu. Une campagne rentable doit produire des payants, pas seulement des diagnostics.</p>
          </div>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs text-graphite-500">
                <tr><th className="px-4 py-3">Source / campagne</th><th className="px-3 py-3">Diagnostics</th><th className="px-3 py-3">Comptes</th><th className="px-3 py-3">Essais</th><th className="px-3 py-3">Payants</th><th className="px-4 py-3">Conv.</th></tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {campagnesTriees.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-graphite-500">Aucune campagne attribuée sur cette période.</td></tr>
                ) : campagnesTriees.map((campagne) => (
                  <tr key={`${campagne.source}-${campagne.campagne}`}>
                    <td className="px-4 py-3"><span className="font-medium text-white">{campagne.source}</span><span className="block text-xs text-graphite-500">{campagne.campagne}</span></td>
                    <td className="px-3 py-3 text-graphite-200">{campagne.diagnostics}</td>
                    <td className="px-3 py-3 text-graphite-200">{campagne.comptes}</td>
                    <td className="px-3 py-3 text-graphite-200">{campagne.essais}</td>
                    <td className="px-3 py-3 font-semibold text-laiton-300">{campagne.payants}</td>
                    <td className="px-4 py-3 text-graphite-200">{campagne.diagnostics > 0 ? `${((campagne.payants / campagne.diagnostics) * 100).toFixed(1)} %` : "0 %"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Liens prêts pour les publicités Meta</p>
            <p className="break-all font-mono text-xs text-graphite-300">https://coai.fr/diagnostic?utm_source=meta&amp;utm_medium=paid_social&amp;utm_campaign=acquisition_coai&amp;utm_content=video_1</p>
            <p className="break-all font-mono text-xs text-graphite-300">https://coai.fr/diagnostic?utm_source=meta&amp;utm_medium=paid_social&amp;utm_campaign=acquisition_coai&amp;utm_content=video_2</p>
            <p className="break-all font-mono text-xs text-graphite-300">https://coai.fr/diagnostic?utm_source=meta&amp;utm_medium=paid_social&amp;utm_campaign=acquisition_coai&amp;utm_content=video_3</p>
            <p className="text-xs text-graphite-500">Utilise un contenu différent par publicité pour comparer les trois vidéos dans GA4, tout en gardant la même campagne dans ce tableau.</p>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <SectionLabel>Acquisition virale</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">
              Données d&apos;attribution réelles en base. Les clics et partages sont suivis séparément dans GA4.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Liens personnels créés" value={String(liensParrainage)} sublabel="Membres ayant activé le parrainage" />
            <StatCard label="Filleuls inscrits" value={String(filleuls.length)} sublabel={`+${filleuls30Jours.length} sur les 30 derniers jours`} highlight />
            <StatCard label="Filleuls en essai" value={String(filleulsEnEssai)} sublabel="Conversion encore en cours" />
            <StatCard label="Conversion parrainage" value={`${conversionParrainage.toFixed(1)}%`} sublabel={`${filleulsConvertis} filleul(s) devenu(s) payant(s)`} highlight />
          </div>
        </section>

        <CapacityPanel capacity={capacity} />
        <AIEconomicsPanel economics={aiEconomics} mrrEur={mrr} />
      </div>
    </main>
  );
}
