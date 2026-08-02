import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [derniereSeance, derniereMesure] = await Promise.all([
    prisma.seanceLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.mesure.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-graphite-800 p-4">
          <h2 className="text-sm text-graphite-400">Dernière séance</h2>
          <p className="text-laiton-400">
            {derniereSeance ? derniereSeance.date.toISOString().slice(0, 10) : "Aucune séance loguée"}
          </p>
        </div>
        <div className="rounded-lg border border-graphite-800 p-4">
          <h2 className="text-sm text-graphite-400">Dernière mesure</h2>
          <p className="text-laiton-400">
            {derniereMesure?.poidsKg ? `${derniereMesure.poidsKg} kg` : "Aucune mesure enregistrée"}
          </p>
        </div>
      </div>
      <a href="/programme" className="text-laiton-400 underline">
        Voir mon programme
      </a>
    </div>
  );
}
