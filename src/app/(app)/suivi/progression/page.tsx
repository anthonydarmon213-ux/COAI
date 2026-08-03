import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default async function ProgressionPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const mesures = await prisma.mesure.findMany({
    where: { userId: user.id, poidsKg: { not: null } },
    orderBy: { date: "asc" },
  });

  const points = mesures.map((m) => m.poidsKg as number);
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const width = 400;
  const height = 120;
  const path = points
    .map((p, i) => {
      const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
      const y = height - ((p - min) / (max - min || 1)) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Suivi</SectionLabel>
        <h1 className="text-2xl font-semibold">Progression</h1>
      </div>
      <Card>
        {points.length > 1 ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg text-laiton-400">
            <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
          </svg>
        ) : (
          <p className="text-graphite-400">
            Pas encore assez de mesures pour afficher une courbe de progression.
          </p>
        )}
      </Card>
    </div>
  );
}
