import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { hasStreamingAccess } from "@/lib/subscription/plan";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export default async function VideosPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const aAcces = hasStreamingAccess(user, user.subscription);
  const videos =
    aAcces ? await prisma.video.findMany({ orderBy: { createdAt: "desc" } }) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-reveal flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Bibliothèque</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Vidéos exclusives.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Yoga, mobilité et récupération — des séances enregistrées par votre coach Anthony.
        </p>
      </div>

      <Card id="bonus-mobilite" className="animate-reveal overflow-hidden border-emerald-300/30 bg-gradient-to-br from-emerald-950/40 via-[#111518] to-[#111518] p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
          <div className="relative aspect-video overflow-hidden bg-black lg:aspect-auto lg:min-h-[20rem]">
            <video
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
              poster="/videos/streaming/routine-mobilite-exclusive-poster.jpg"
              src="/videos/streaming/routine-mobilite-exclusive.mp4"
              aria-label="Routine mobilité exclusive COAI"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
            <Badge tone="success">Bonus offert · Programme Mobilité</Badge>
            <h2 className="font-editorial text-3xl font-normal tracking-tight text-white">Routine mobilité exclusive</h2>
            <p className="text-sm leading-6 text-graphite-300">
              Une routine guidée d&apos;environ 1 min 40 pour délier les hanches, la colonne et les épaules avant ou après ta séance.
            </p>
            <p className="text-xs leading-5 text-graphite-500">
              Vidéo tournée par Anthony · accès inclus avec le programme Mobilité offert.
            </p>
          </div>
        </div>
      </Card>

      {!aAcces ? (
        <Card className="flex flex-col items-start gap-3">
          <Badge tone="warning">Réservé aux membres COAI</Badge>
          <p className="text-sm text-graphite-300">
            Active un Pass IA, Coaching Hybride ou VIP pour accéder aux cours exclusifs d&apos;Anthony.
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
