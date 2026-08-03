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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Suivi</SectionLabel>
        <h1 className="text-2xl font-semibold">Mesures corporelles</h1>
      </div>
      <MesureForm />
      <div className="flex flex-col gap-2">
        {mesures.map((m, i) => (
          <Card key={m.id} className="flex items-center gap-3 p-3 text-sm">
            {photoUrls[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrls[i]!}
                alt="Photo de progression"
                className="h-14 w-14 rounded-md object-cover"
              />
            )}
            <div>
              <span className="font-mono text-laiton-400">{m.date.toISOString().slice(0, 10)}</span>
              {m.poidsKg ? ` — ${m.poidsKg} kg` : ""}
            </div>
          </Card>
        ))}
        {mesures.length === 0 && <p className="text-graphite-400">Aucune mesure enregistrée.</p>}
      </div>
    </div>
  );
}
