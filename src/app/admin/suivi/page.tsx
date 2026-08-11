import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";
import { computeFlags, buildWhatsAppContactLink, FLAG_LABELS } from "@/lib/admin/flags";

export default async function AdminSuiviPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  // Périmètre Transformation uniquement — Impulsion n'a aucun suivi humain
  // (positionnement du palier), pas de raison de le faire remonter ici.
  const abonnesTransformation = await prisma.user.findMany({
    where: { subscription: { plan: "STANDARD", status: { in: ["ACTIVE", "PAST_DUE"] } } },
    select: { id: true, email: true, prenom: true, phoneWhatsapp: true },
  });

  const avecFlags = await Promise.all(
    abonnesTransformation.map(async (u) => ({ user: u, flags: await computeFlags(u.id) }))
  );
  const aSuivre = avecFlags
    .filter((x) => x.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminNav current="/admin/suivi" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">Suivi à risque — Transformation</h1>
          <p className="text-sm text-graphite-400">
            {aSuivre.length} abonné{aSuivre.length > 1 ? "s" : ""} sur {abonnesTransformation.length} avec un
            signal à vérifier — inactivité, gêne mentionnée dans une séance, ou pas de mesure récente.
          </p>
        </div>

        {aSuivre.length === 0 && (
          <p className="text-graphite-400">Rien à signaler pour le moment.</p>
        )}

        {aSuivre.map(({ user, flags }) => {
          const contactLink = buildWhatsAppContactLink(user.phoneWhatsapp, user.prenom, flags);
          return (
            <Card key={user.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/clients/${user.id}`}
                  className="text-sm font-medium text-graphite-50 underline-offset-2 hover:text-laiton-300 hover:underline"
                >
                  {user.prenom ? `${user.prenom} — ` : ""}
                  {user.email}
                </Link>
                {contactLink && (
                  <a
                    href={contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-xs font-medium text-laiton-300 transition hover:bg-laiton-400/20"
                  >
                    Contacter sur WhatsApp
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge tone={FLAG_LABELS[flag.type].tone}>{FLAG_LABELS[flag.type].label}</Badge>
                    <p className="text-sm text-graphite-300">{flag.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
