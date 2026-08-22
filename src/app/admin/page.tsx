import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";
import { buildWhatsAppContactLink, computeFlags, FLAG_LABELS, getFlagsPriority, getPriorityLabel } from "@/lib/admin/flags";

// Dashboard coach (Phase 4, 11/08/2026 — "COAI HUMAN" de la vision produit)
// — n'existait pas : les pages /admin/* étaient chacune accessibles
// séparément mais sans vue d'ensemble "voilà ce qui a besoin de toi".
export default async function AdminDashboardPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const [clientsTransformation, programmesEnAttente, adaptationsEnAttenteCount] = await Promise.all([
    prisma.user.findMany({
      where: { subscription: { plan: "STANDARD", status: { in: ["ACTIVE", "PAST_DUE"] } } },
      select: { id: true, email: true, prenom: true, phoneWhatsapp: true },
    }),
    prisma.programmeGenerated.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.programmeAdaptation.count({ where: { statut: "EN_ATTENTE" } }),
  ]);

  const avecFlags = await Promise.all(
    clientsTransformation.map(async (u) => ({ user: u, flags: await computeFlags(u.id) }))
  );
  const aSuivre = avecFlags
    .filter((x) => x.flags.length > 0)
    .sort((a, b) => getFlagsPriority(b.flags) - getFlagsPriority(a.flags));
  const totalFlags = aSuivre.reduce((acc, x) => acc + x.flags.length, 0);

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminNav current="/admin" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">
            Bonjour{admin.prenom ? ` ${admin.prenom}` : ""}.
          </h1>
          <p className="text-sm text-graphite-400">Voilà ce qui a besoin de toi aujourd&apos;hui.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
              Clients Coaching Hybride
            </span>
            <span className="text-3xl font-semibold text-white">{clientsTransformation.length}</span>
          </Card>
          <Link href="/admin/programmes">
            <Card className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                Programmes à valider
              </span>
              <span className="text-3xl font-semibold text-white">{programmesEnAttente}</span>
              {adaptationsEnAttenteCount > 0 && (
                <span className="text-xs text-graphite-500">
                  dont {adaptationsEnAttenteCount} adaptation{adaptationsEnAttenteCount > 1 ? "s" : ""}
                </span>
              )}
            </Card>
          </Link>
          <Link href="/admin/suivi">
            <Card className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                Alertes actives
              </span>
              <span className="text-3xl font-semibold text-white">{totalFlags}</span>
              <span className="text-xs text-graphite-500">
                sur {aSuivre.length} client{aSuivre.length > 1 ? "s" : ""}
              </span>
            </Card>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>File quotidienne du coach</SectionLabel>
            <p className="mt-2 text-xs text-graphite-500">Sécurité, performance, inactivité, puis qualité des données.</p>
          </div>
          {aSuivre.length === 0 && programmesEnAttente === 0 && adaptationsEnAttenteCount === 0 && <p className="text-sm text-graphite-400">Rien à traiter pour le moment.</p>}
          {(programmesEnAttente > 0 || adaptationsEnAttenteCount > 0) && (
            <Link href="/admin/programmes">
              <Card className="flex items-center justify-between gap-4 border-laiton-400/25">
                <div><Badge tone="warning">Validation</Badge><p className="mt-2 text-sm font-medium text-white">{programmesEnAttente} programme{programmesEnAttente > 1 ? "s" : ""} à relire</p><p className="mt-1 text-xs text-graphite-500">Les plus anciens sont présentés en premier.</p></div><span className="text-laiton-300">Ouvrir →</span>
              </Card>
            </Link>
          )}
          {aSuivre.slice(0, 7).map(({ user, flags }) => {
            const priority = getPriorityLabel(flags);
            const contactLink = buildWhatsAppContactLink(user.phoneWhatsapp, user.prenom, flags);
            return (
              <Card key={user.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><Badge tone={priority.tone}>{priority.label}</Badge><p className="mt-2 text-sm font-medium text-graphite-50">{user.prenom ? `${user.prenom} — ` : ""}{user.email}</p></div>
                  <div className="flex gap-2"><Link href={`/admin/clients/${user.id}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-graphite-200 hover:border-laiton-400/30">Voir le dossier</Link>{contactLink && <a href={contactLink} target="_blank" rel="noopener noreferrer" className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-xs text-laiton-300">WhatsApp</a>}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {flags.map((flag, i) => (
                    <Badge key={i} tone={FLAG_LABELS[flag.type].tone}>
                      {FLAG_LABELS[flag.type].label}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
          {aSuivre.length > 7 && (
            <Link href="/admin/suivi" className="text-sm text-laiton-400 underline">
              Voir les {aSuivre.length} clients à suivre →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
