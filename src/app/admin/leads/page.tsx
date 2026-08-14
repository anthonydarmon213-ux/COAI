import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";

const NB_RECENTS = 100;

// Vue de secours pour vérifier qu'un diagnostic a bien été capturé,
// indépendamment de la réception de l'email de notification (14/08/2026,
// suite à un nouveau signalement d'Anthony — même famille de doute que le
// bug diagnostic_leads du 10/08 : sans requête SQL manuelle, impossible de
// distinguer "personne n'a fait le diagnostic" de "le diagnostic a été fait
// mais l'email de notif/résultat a échoué ou est tombé en spam". Cette page
// lit directement DiagnosticLead, indépendamment de Resend.
export default async function AdminLeadsPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const leads = await prisma.diagnosticLead.findMany({
    orderBy: { createdAt: "desc" },
    take: NB_RECENTS,
  });

  const emails = leads.map((l) => l.email);
  const comptesExistants = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const emailsAvecCompte = new Set(comptesExistants.map((u) => u.email));

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <AdminNav current="/admin/leads" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">Diagnostics capturés</h1>
          <p className="text-sm text-graphite-400">
            Les {Math.min(NB_RECENTS, leads.length)} derniers diagnostics reçus, indépendamment de
            la réception des emails de notification — si un diagnostic apparaît ici mais que tu
            n&apos;as reçu ni notification ni email, le souci vient de l&apos;envoi (Resend/spam),
            pas de la capture elle-même. S&apos;il n&apos;apparaît pas du tout, le diagnostic n&apos;a
            pas été complété jusqu&apos;au bout (dernière étape avant le résultat).
          </p>
        </div>

        <Card className="flex flex-col gap-0 divide-y divide-white/[0.06] p-0">
          {leads.length === 0 ? (
            <p className="p-6 text-sm text-graphite-400">Aucun diagnostic capturé pour l&apos;instant.</p>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-graphite-50">{lead.email}</span>
                  <span className="font-mono text-xs text-graphite-500">
                    {lead.createdAt.toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {lead.utmSource ? ` · ${lead.utmSource}${lead.utmCampaign ? `/${lead.utmCampaign}` : ""}` : " · direct"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={lead.resultEmailSentAt ? "success" : "warning"}>
                    {lead.resultEmailSentAt ? "Email résultat envoyé" : "Email résultat non envoyé"}
                  </Badge>
                  {emailsAvecCompte.has(lead.email) && <Badge tone="success">Compte créé</Badge>}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </main>
  );
}
