import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { AdminVideosManager } from "@/components/admin/admin-videos-manager";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminVideosPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminNav current="/admin/videos" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">Bibliothèque vidéo</h1>
          <p className="text-sm text-graphite-400">
            Vidéos YouTube non répertoriées, visibles par les abonnés Coaching Hybride.
          </p>
        </div>

        <AdminVideosManager
          videos={videos.map((v) => ({
            id: v.id,
            titre: v.titre,
            description: v.description,
            youtubeId: v.youtubeId,
            categorie: v.categorie,
            youtubeIdApercu: v.youtubeIdApercu,
            dureeMinutes: v.dureeMinutes,
            apercuMinutes: v.apercuMinutes,
          }))}
        />
      </div>
    </main>
  );
}
