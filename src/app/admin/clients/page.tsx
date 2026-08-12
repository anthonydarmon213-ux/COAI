import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeFlags, getPriorityLabel } from "@/lib/admin/flags";

type SearchParams = { q?: string; statut?: string };

export default async function AdminClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    select: { isAdmin: true },
  });
  if (!admin?.isAdmin) redirect("/dashboard");

  const query = searchParams.q?.trim() ?? "";
  const statut = searchParams.statut === "alerte" ? "alerte" : "tous";
  const clients = await prisma.user.findMany({
    where: {
      subscription: { plan: "STANDARD", status: { in: ["ACTIVE", "PAST_DUE"] } },
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" as const } },
              { prenom: { contains: query, mode: "insensitive" as const } },
              { nom: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      nom: true,
      subscription: { select: { status: true } },
      _count: { select: { coachNotesReceived: true } },
    },
    orderBy: [{ prenom: "asc" }, { email: "asc" }],
  });

  const enriched = await Promise.all(
    clients.map(async (client) => ({ client, flags: await computeFlags(client.id) }))
  );
  const visible = statut === "alerte" ? enriched.filter((item) => item.flags.length > 0) : enriched;
  const alertCount = enriched.filter((item) => item.flags.length > 0).length;

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <AdminNav current="/admin/clients" />
        <div className="border-b border-acier/25 pb-7">
          <SectionLabel>Portefeuille coach</SectionLabel>
          <h1 className="mt-2 text-2xl font-semibold text-graphite-50">Clients Transformation</h1>
          <p className="mt-1 text-sm text-graphite-400">
            {enriched.length} client{enriched.length > 1 ? "s" : ""}, dont {alertCount} avec un signal à vérifier.
          </p>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" action="/admin/clients">
          <label className="flex-1">
            <span className="sr-only">Rechercher un client</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Prénom, nom ou email"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-graphite-600 focus:border-laiton-400/40"
            />
          </label>
          <select
            name="statut"
            defaultValue={statut}
            className="rounded-xl border border-white/10 bg-[#101214] px-4 py-2.5 text-sm text-white outline-none focus:border-laiton-400/40"
          >
            <option value="tous">Tous les clients</option>
            <option value="alerte">À surveiller</option>
          </select>
          <button type="submit" className="rounded-xl bg-laiton-400 px-5 py-2.5 text-sm font-semibold text-graphite-950">
            Rechercher
          </button>
        </form>

        {visible.length === 0 ? (
          <Card><p className="text-sm text-graphite-400">Aucun client ne correspond à cette recherche.</p></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map(({ client, flags }) => {
              const priority = flags.length > 0 ? getPriorityLabel(flags) : null;
              return (
                <Link key={client.id} href={`/admin/clients/${client.id}`}>
                  <Card className="flex h-full flex-col gap-3 transition hover:border-laiton-400/25">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {[client.prenom, client.nom].filter(Boolean).join(" ") || "Client COAI"}
                        </p>
                        <p className="truncate text-xs text-graphite-500">{client.email}</p>
                      </div>
                      {priority ? <Badge tone={priority.tone}>{priority.label}</Badge> : <Badge tone="success">À jour</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-graphite-400">
                      <span>{flags.length} alerte{flags.length > 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{client._count.coachNotesReceived} note{client._count.coachNotesReceived > 1 ? "s" : ""}</span>
                      {client.subscription?.status === "PAST_DUE" ? <><span>·</span><span className="text-ambre-300">Paiement à vérifier</span></> : null}
                    </div>
                    <span className="text-xs text-laiton-300">Ouvrir le dossier →</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
