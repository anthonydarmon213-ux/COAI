import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";
import { buildMiniDiagnostic, type ReponsesDiagnostic } from "@/lib/diagnostic/mini-diagnostic";
import { buildWhatsAppLinkVersLead } from "@/lib/email/lead-notification";

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
            leads.map((lead) => {
              const reponses = lead.reponses as ReponsesDiagnostic;
              const diagnostic = buildMiniDiagnostic(reponses);
              const objectif = typeof reponses.objectif === "string" ? reponses.objectif : "Objectif non renseigné";
              const source = lead.utmSource
                ? [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" · ")
                : "Accès direct";

              return (
              <div key={lead.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-graphite-50">{lead.email}</span>
                    {diagnostic && (
                      <Badge tone="success">Score {diagnostic.indiceCoai.score}/100</Badge>
                    )}
                  </div>
                  <p className="text-sm text-graphite-300">{objectif}</p>
                  {diagnostic && (
                    <div className="grid gap-1 text-xs leading-5 text-graphite-400 sm:grid-cols-2 sm:gap-4">
                      <p><strong className="text-graphite-200">Besoins :</strong> {diagnostic.pointsATravailler.slice(0, 2).join(" · ") || "À préciser"}</p>
                      <p><strong className="text-graphite-200">Solutions :</strong> {diagnostic.pointsResolus.slice(0, 2).join(" · ") || "Diagnostic COAI"}</p>
                    </div>
                  )}
                  <span className="font-mono text-xs text-graphite-500">
                    {lead.createdAt.toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {` · ${source}`}
                  </span>
                  {lead.telephone && (
                    <a href={`tel:${lead.telephone}`} className="w-fit text-sm font-medium text-laiton-300 hover:underline">
                      {lead.telephone}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge tone={lead.resultEmailSentAt ? "success" : "warning"}>
                    {lead.resultEmailSentAt ? "Email résultat envoyé" : "Email résultat non envoyé"}
                  </Badge>
                  {emailsAvecCompte.has(lead.email) && <Badge tone="success">Compte créé</Badge>}
                  {lead.telephone && (
                    <a
                      href={buildWhatsAppLinkVersLead(lead.telephone, lead.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#25d366] px-4 py-2 text-xs font-bold text-graphite-950"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              );
            })
          )}
        </Card>
      </div>
    </main>
  );
}
