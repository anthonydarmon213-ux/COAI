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

  // SÉCURITÉ (01/09/2026) : l'identifiant YouTube est visible dans le HTML
  // de la page. On ne le sélectionne donc même pas pour un non-abonné —
  // il ne reçoit que `youtubeIdApercu`, l'extrait offert, qui est une
  // AUTRE vidéo. Un minuteur côté client serait contournable en ouvrant
  // simplement la vidéo sur youtube.com.
  const videos = aAcces
    ? await prisma.video.findMany({ orderBy: { createdAt: "desc" } })
    : await prisma.video.findMany({
        where: { youtubeIdApercu: { not: null } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, titre: true, description: true, categorie: true,
          youtubeIdApercu: true, dureeMinutes: true, apercuMinutes: true,
        },
      });

  const total = await prisma.video.count();
  const restantes = aAcces ? 0 : total - videos.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-reveal flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Bibliothèque</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Vidéos exclusives.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Yoga, mobilité et récupération — des séances enregistrées par votre coach Anthony.
        </p>
      </div>

      {!aAcces && videos.length === 0 ? (
        <Card className="flex flex-col items-start gap-3">
          <Badge tone="warning">Réservé aux membres COAI</Badge>
          <p className="text-sm text-graphite-300">
            Active un Standard IA, Premium Remote ou VIP Présentiel pour accéder aux cours exclusifs d&apos;Anthony.
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
                  // "youtubeId" in video : la requête non-abonné ne sélectionne
                  // pas ce champ, donc il est absent de l'objet. Le test de
                  // présence rend l'erreur impossible à commettre plus tard —
                  // un cast l'aurait masquée.
                  src={`https://www.youtube.com/embed/${"youtubeId" in video ? video.youtubeId : video.youtubeIdApercu}`}
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
                {!aAcces && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="warning">
                      Aperçu {video.apercuMinutes ?? 5} min
                      {video.dureeMinutes ? ` sur ${video.dureeMinutes}` : ""}
                    </Badge>
                    <Link href="/pricing" className="text-xs font-semibold text-laiton-300 underline underline-offset-4 hover:text-laiton-200">
                      Voir la séance entière →
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
