import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";
import { ValidateProgrammeCard } from "@/components/admin/validate-programme-card";
import { computeFlags, buildWhatsAppContactLink, FLAG_LABELS } from "@/lib/admin/flags";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

const PILIER_LABEL: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

const SOMMEIL_LABEL: Record<string, string> = {
  TRES_MAUVAIS: "Très mauvais",
  MAUVAIS: "Mauvais",
  CORRECT: "Correct",
  BON: "Bon",
  EXCELLENT: "Excellent",
};

// Page détail client (Phase 4, section 16 de la vision produit) — le coach
// clique sur un client depuis /admin ou /admin/suivi et voit : profil,
// historique, dernier programme par pilier, feedback récent, suggestion
// COAI en attente. Boutons Valider/Modifier déjà fournis par
// ValidateProgrammeCard (réutilisé tel quel) ; Contacter via WhatsApp.
export default async function AdminClientPage({ params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: { profile: true, subscription: true },
  });
  if (!client) notFound();

  const [
    programmesEnAttente,
    programmesActuels,
    seancesRecentes,
    dernierCheckin,
    dernieresMesures,
    flags,
  ] = await Promise.all([
    prisma.programmeGenerated.findMany({
      where: { userId: client.id, statut: "EN_ATTENTE" },
      orderBy: { generatedAt: "asc" },
    }),
    Promise.all(
      (["ENTRAINEMENT", "NUTRITION", "RECUPERATION"] as Pilier[]).map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: client.id, pilier, statut: { in: ["VALIDE", "GENERE_IA"] } },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
    prisma.seanceLog.findMany({ where: { userId: client.id }, orderBy: { date: "desc" }, take: 5 }),
    prisma.weeklyCheckin.findFirst({ where: { userId: client.id }, orderBy: { semaineDebut: "desc" } }),
    prisma.mesure.findMany({ where: { userId: client.id }, orderBy: { date: "desc" }, take: 3 }),
    computeFlags(client.id),
  ]);

  const adaptations = await prisma.programmeAdaptation.findMany({
    where: { programmeSuivantId: { in: programmesEnAttente.map((p) => p.id) } },
  });
  const adaptationParProgrammeId = new Map(adaptations.map((a) => [a.programmeSuivantId, a]));

  const plan = getEffectivePlan(client.subscription);
  const contactLink = buildWhatsAppContactLink(client.phoneWhatsapp, client.prenom, flags);

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminNav current="/admin/suivi" />

        <div className="flex flex-col gap-2 border-b border-acier/25 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionLabel>Fiche client</SectionLabel>
            <h1 className="text-2xl font-semibold text-graphite-50">
              {client.prenom ? `${client.prenom} — ` : ""}
              {client.email}
            </h1>
            <p className="text-sm text-graphite-400">{PLAN_LABELS[plan]}</p>
          </div>
          {contactLink && (
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start rounded-full border border-laiton-400/25 bg-laiton-400/10 px-4 py-2 text-sm font-medium text-laiton-300 transition hover:bg-laiton-400/20"
            >
              Contacter sur WhatsApp
            </a>
          )}
        </div>

        {flags.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Alertes</SectionLabel>
            <div className="flex flex-col gap-2">
              {flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge tone={FLAG_LABELS[flag.type].tone}>{FLAG_LABELS[flag.type].label}</Badge>
                  <p className="text-sm text-graphite-300">{flag.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <SectionLabel>Profil</SectionLabel>
          <Card className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-graphite-500">Objectifs</p>
              <p className="text-graphite-200">{client.profile?.objectifs ?? "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500">Niveau</p>
              <p className="text-graphite-200">{client.profile?.niveau ?? "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500">Contraintes de santé</p>
              <p className="text-graphite-200">{client.profile?.contraintesSante ?? "Aucune connue"}</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500">Équipement</p>
              <p className="text-graphite-200">{client.profile?.equipementDisponible ?? "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500">Fréquence d&apos;entraînement</p>
              <p className="text-graphite-200">{client.profile?.frequenceEntrainement ?? "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-xs text-graphite-500">Allergies</p>
              <p className="text-graphite-200">{client.profile?.allergiesAlimentaires ?? "Aucune connue"}</p>
            </div>
          </Card>
          <Link href="/admin/business" className="text-xs text-graphite-500 underline hover:text-white">
            Voir les métriques business →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Programme actuel</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["ENTRAINEMENT", "NUTRITION", "RECUPERATION"] as Pilier[]).map((pilier, i) => {
              const p = programmesActuels[i];
              return (
                <Card key={pilier} className="flex flex-col gap-1">
                  <span className="text-xs text-graphite-500">{PILIER_LABEL[pilier]}</span>
                  {p ? (
                    <>
                      <span className="text-sm text-white">V{p.version}</span>
                      <span className="text-xs text-graphite-500">
                        {p.generatedAt.toLocaleDateString("fr-FR")}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-graphite-600">Pas encore généré</span>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Feedback récent</SectionLabel>
          {seancesRecentes.length === 0 && dernierCheckin === null && (
            <p className="text-sm text-graphite-400">Aucune activité récente.</p>
          )}
          {seancesRecentes.length > 0 && (
            <Card className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-graphite-500">Dernières séances</span>
              {seancesRecentes.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-2 text-sm text-graphite-300">
                  <span className="text-graphite-500">{s.date.toLocaleDateString("fr-FR")}</span>
                  {s.difficulte != null && <Badge tone="neutral">Difficulté {s.difficulte}/5</Badge>}
                  {s.energie != null && <Badge tone="neutral">Énergie {s.energie}/5</Badge>}
                  {s.douleur && s.douleur !== "AUCUNE" && (
                    <Badge tone={s.douleur === "IMPORTANTE" ? "danger" : "warning"}>
                      Douleur{s.douleurZone ? ` — ${s.douleurZone}` : ""}
                    </Badge>
                  )}
                  {s.notes && <span className="text-graphite-400">{s.notes}</span>}
                </div>
              ))}
            </Card>
          )}
          {dernierCheckin && (
            <Card className="flex flex-wrap gap-2 text-sm text-graphite-300">
              <span className="text-xs uppercase tracking-wider text-graphite-500">
                Check-in du {dernierCheckin.semaineDebut.toLocaleDateString("fr-FR")}
              </span>
              {dernierCheckin.sommeil && <Badge tone="neutral">Sommeil {SOMMEIL_LABEL[dernierCheckin.sommeil]}</Badge>}
              {dernierCheckin.energie != null && <Badge tone="neutral">Énergie {dernierCheckin.energie}/5</Badge>}
              {dernierCheckin.stress != null && <Badge tone="neutral">Stress {dernierCheckin.stress}/5</Badge>}
              {dernierCheckin.motivation != null && (
                <Badge tone="neutral">Motivation {dernierCheckin.motivation}/5</Badge>
              )}
            </Card>
          )}
          {dernieresMesures.length > 0 && (
            <Card className="flex flex-col gap-1 text-sm text-graphite-300">
              <span className="text-xs uppercase tracking-wider text-graphite-500">Dernières mesures</span>
              {dernieresMesures.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <span className="text-graphite-500">{m.date.toLocaleDateString("fr-FR")}</span>
                  {m.poidsKg != null && <span>{m.poidsKg} kg</span>}
                </div>
              ))}
            </Card>
          )}
        </div>

        {programmesEnAttente.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionLabel>Suggestion COAI — en attente de validation</SectionLabel>
            {programmesEnAttente.map((programme) => {
              const adaptation = adaptationParProgrammeId.get(programme.id);
              return (
                <ValidateProgrammeCard
                  key={programme.id}
                  id={programme.id}
                  pilier={programme.pilier}
                  userEmail={client.email}
                  contenu={programme.contenu}
                  generatedAt={programme.generatedAt.toISOString()}
                  suggestionCoai={
                    adaptation
                      ? {
                          resume: adaptation.resume,
                          changements: Array.isArray(adaptation.changements)
                            ? (adaptation.changements as unknown as {
                                cible: string;
                                avant: string | number | null;
                                apres: string | number | null;
                                raison: string;
                              }[])
                            : [],
                        }
                      : null
                  }
                />
              );
            })}
          </div>
        )}

        <Link href="/admin/suivi" className="text-sm text-laiton-400 underline">
          ← Retour au suivi
        </Link>
      </div>
    </main>
  );
}
