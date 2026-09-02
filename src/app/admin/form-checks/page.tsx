import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionLabel } from "@/components/ui/section-label";
import { FormCheckReponse } from "@/components/admin/form-check-reponse";
import { getSignedFormCheckUrl } from "@/lib/storage/form-checks";

export const dynamic = "force-dynamic";

// Corrections de mouvement à traiter. Les vidéos vivent dans un bucket privé :
// l'URL est signée à l'affichage et expire, elle n'est jamais stockée.
export default async function AdminFormChecksPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");
  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const demandes = await prisma.formCheck.findMany({
    orderBy: [{ statut: "asc" }, { createdAt: "asc" }],
    take: 50,
    include: { user: { select: { email: true, prenom: true } } },
  });

  const avecUrl = await Promise.all(
    demandes.map(async (d: (typeof demandes)[number]) => ({
      ...d,
      videoUrl: await getSignedFormCheckUrl(d.videoPath),
    }))
  );
  const enAttente = avecUrl.filter((d) => d.statut === "EN_ATTENTE");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10">
      <AdminNav current="/admin/form-checks" />
      <header>
        <SectionLabel>Corrections de mouvement</SectionLabel>
        <h1 className="mt-4 font-display text-3xl font-semibold text-white">
          {enAttente.length > 0
            ? `${enAttente.length} vidéo${enAttente.length > 1 ? "s" : ""} à regarder.`
            : "Aucune vidéo en attente."}
        </h1>
      </header>

      <ul className="flex flex-col gap-6">
        {avecUrl.map((d) => (
          <li
            key={d.id}
            className={`rounded-2xl border p-5 ${
              d.statut === "EN_ATTENTE"
                ? "border-amber-300/30 bg-amber-300/[0.04]"
                : "border-white/[0.08] bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">
                {d.exercice}
                <span className="ml-3 text-sm font-normal text-graphite-400">
                  {d.user.prenom ?? d.user.email}
                </span>
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-400">
                {d.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </span>
            </div>

            {d.question ? (
              <p className="mt-2 text-sm italic leading-6 text-graphite-300">« {d.question} »</p>
            ) : null}

            {d.videoUrl ? (
              <video src={d.videoUrl} controls playsInline className="mt-4 max-h-96 w-full rounded-xl bg-black" />
            ) : (
              <p className="mt-4 text-sm text-rose-300">Vidéo indisponible.</p>
            )}

            {d.statut === "REPONDU" ? (
              <div className="mt-4 border-l-2 border-emerald-300/50 pl-4">
                <p className="text-sm leading-6 text-white">{d.reponse}</p>
              </div>
            ) : (
              <FormCheckReponse id={d.id} />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
