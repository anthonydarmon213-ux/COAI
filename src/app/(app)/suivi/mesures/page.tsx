import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { MesureForm } from "@/components/suivi/mesure-form";

export default async function MesuresPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const mesures = await prisma.mesure.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mesures corporelles</h1>
      <MesureForm />
      <ul className="flex flex-col gap-2">
        {mesures.map((m) => (
          <li key={m.id} className="rounded-md border border-graphite-800 p-3 text-sm">
            <span className="text-laiton-400">{m.date.toISOString().slice(0, 10)}</span>
            {m.poidsKg ? ` — ${m.poidsKg} kg` : ""}
          </li>
        ))}
        {mesures.length === 0 && <p className="text-graphite-400">Aucune mesure enregistrée.</p>}
      </ul>
    </div>
  );
}
