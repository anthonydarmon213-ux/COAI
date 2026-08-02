import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SeanceForm } from "@/components/suivi/seance-form";

export default async function SeancesPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const seances = await prisma.seanceLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Journal de séances</h1>
      <SeanceForm />
      <ul className="flex flex-col gap-2">
        {seances.map((s) => (
          <li key={s.id} className="rounded-md border border-graphite-800 p-3 text-sm">
            <span className="text-laiton-400">{s.date.toISOString().slice(0, 10)}</span>
            {s.ressenti ? ` — ${s.ressenti}` : ""}
          </li>
        ))}
        {seances.length === 0 && <p className="text-graphite-400">Aucune séance loguée.</p>}
      </ul>
    </div>
  );
}
