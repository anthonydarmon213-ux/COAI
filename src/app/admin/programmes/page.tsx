import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { ValidateProgrammeCard } from "@/components/admin/validate-programme-card";

export default async function AdminProgrammesPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const enAttente = await prisma.programmeGenerated.findMany({
    where: { statut: "EN_ATTENTE" },
    include: { user: { select: { email: true } } },
    orderBy: { generatedAt: "asc" },
  });

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">
            Programmes en attente de validation
          </h1>
          <p className="text-sm text-graphite-400">
            {enAttente.length} programme{enAttente.length > 1 ? "s" : ""} à relire.
          </p>
        </div>

        {enAttente.length === 0 && (
          <p className="text-graphite-400">Aucun programme en attente pour le moment.</p>
        )}

        {enAttente.map((programme) => (
          <ValidateProgrammeCard
            key={programme.id}
            id={programme.id}
            pilier={programme.pilier}
            userEmail={programme.user.email}
            contenu={programme.contenu}
            generatedAt={programme.generatedAt.toISOString()}
          />
        ))}
      </div>
    </main>
  );
}
