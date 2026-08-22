import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export default async function VideosPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);
  const videos =
    plan !== "GRATUIT" ? await prisma.video.findMany({ orderBy: { createdAt: "desc" } }) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-reveal flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Bibliothèque</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Streaming.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Cours en streaming — yoga, mobilité, récupération — enregistrés par votre coach Anthony.
        </p>
      </div>

      {plan === "GRATUIT" ? (
        <Card className="flex flex-col items-start gap-3">
          <Badge tone="warning">Réservé à l&apos;offre Coaching Hybride</Badge>
          <p className="text-sm text-graphite-300">
            Passe à l&apos;offre Coaching Hybride (99€/mois) pour accéder à la bibliothèque de streaming.
          </p>
          <Link href="/pricing">
            <Button>Voir les offres</Button>
          </Link>
        </Card>
      ) : videos.length === 0 ? (
        <p className="text-sm text-graphite-400">Aucune vidéo pour le moment — reviens bientôt.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id} className="flex flex-col gap-3">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.titre}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div>
                {video.categorie && (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
                    {video.categorie}
                  </p>
                )}
                <p className="text-sm font-medium text-graphite-50">{video.titre}</p>
                {video.description && (
                  <p className="mt-1 text-sm text-graphite-400">{video.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
