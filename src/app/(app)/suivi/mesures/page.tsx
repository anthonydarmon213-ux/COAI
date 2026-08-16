import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { MesureForm } from "@/components/suivi/mesure-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { getSignedProgressPhotoUrl } from "@/lib/storage/progress-photos";

export default async function MesuresPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const mesures = await prisma.mesure.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  const photoUrls = await Promise.all(
    mesures.map((m) => (m.photoPath ? getSignedProgressPhotoUrl(m.photoPath) : null))
  );

  const tailleCm = user.profile?.tailleCm;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Mesures corporelles.</h1>
      </div>
      <MesureForm />
      <div className="flex flex-col gap-2">
        {mesures.map((m, i) => {
          const imc =
            m.poidsKg && tailleCm ? m.poidsKg / (tailleCm / 100) ** 2 : null;
          const details = [
            m.poidsKg ? `${m.poidsKg} kg` : null,
            imc ? `IMC ${imc.toFixed(1)}` : null,
            m.tourTailleCm ? `tour de taille ${m.tourTailleCm} cm` : null,
            m.masseGrassePourcent ? `${m.masseGrassePourcent}% masse grasse` : null,
            m.masseMusculaireKg ? `${m.masseMusculaireKg} kg muscle` : null,
            m.frequenceCardiaqueReposBpm ? `${m.frequenceCardiaqueReposBpm} bpm repos` : null,
          ].filter(Boolean);

          return (
            <Card key={m.id} className="flex items-center gap-3 p-3 text-sm">
              {photoUrls[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrls[i]!}
                  alt="Photo de progression"
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
              )}
              <div>
                <span className="font-mono text-laiton-400">
                  {m.date.toISOString().slice(0, 10)}
                </span>
                {details.length > 0 && (
                  <span className="text-graphite-300"> — {details.join(" · ")}</span>
                )}
              </div>
            </Card>
          );
        })}
        {mesures.length === 0 && <p className="text-graphite-400">Aucune mesure enregistrée.</p>}
      </div>
    </div>
  );
}
