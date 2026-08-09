import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";

// Suivi Transformation par exception plutôt que par calendrier : au lieu de
// relire manuellement chaque abonné toutes les X semaines (ne scale pas
// avec le nombre d'abonnés), cette page ne fait remonter que les comptes
// qui présentent un signal concret (inactivité, douleur mentionnée,
// absence de mesure récente) — le temps du coach va sur les cas réels,
// pas sur un balayage systématique de toute la base.
const SEUIL_INACTIVITE_JOURS = 10;
const SEUIL_MESURE_JOURS = 21;
const FENETRE_DOULEUR_JOURS = 14;
const JOUR_MS = 24 * 60 * 60 * 1000;

const MOTS_DOULEUR = [
  "douleur",
  "douloureux",
  "douloureuse",
  "mal au",
  "mal aux",
  "mal à",
  "blessure",
  "blessé",
  "blessée",
  "tendinite",
  "élongation",
  "entorse",
  "gêne",
  "gênant",
  "craquement",
];

type Flag = { type: "douleur" | "inactivite" | "mesure"; detail: string };

async function computeFlags(userId: string): Promise<Flag[]> {
  const maintenant = Date.now();
  const flags: Flag[] = [];

  const [derniereSeance, seancesRecentes, derniereMesure] = await Promise.all([
    prisma.seanceLog.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.seanceLog.findMany({
      where: { userId, date: { gte: new Date(maintenant - FENETRE_DOULEUR_JOURS * JOUR_MS) } },
      orderBy: { date: "desc" },
    }),
    prisma.mesure.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
  ]);

  const seanceAvecDouleur = seancesRecentes.find((s) => {
    const texte = `${s.ressenti ?? ""} ${s.notes ?? ""}`.toLowerCase();
    return MOTS_DOULEUR.some((mot) => texte.includes(mot));
  });
  if (seanceAvecDouleur) {
    const extrait = (seanceAvecDouleur.ressenti || seanceAvecDouleur.notes || "").slice(0, 160);
    flags.push({
      type: "douleur",
      detail: `Séance du ${seanceAvecDouleur.date.toLocaleDateString("fr-FR")} : « ${extrait} »`,
    });
  }

  const joursDepuisSeance = derniereSeance
    ? Math.floor((maintenant - derniereSeance.date.getTime()) / JOUR_MS)
    : null;
  if (joursDepuisSeance === null || joursDepuisSeance > SEUIL_INACTIVITE_JOURS) {
    flags.push({
      type: "inactivite",
      detail:
        joursDepuisSeance === null
          ? "Aucune séance jamais loggée"
          : `Aucune séance loggée depuis ${joursDepuisSeance} jours`,
    });
  }

  const joursDepuisMesure = derniereMesure
    ? Math.floor((maintenant - derniereMesure.date.getTime()) / JOUR_MS)
    : null;
  if (joursDepuisMesure === null || joursDepuisMesure > SEUIL_MESURE_JOURS) {
    flags.push({
      type: "mesure",
      detail:
        joursDepuisMesure === null
          ? "Aucune mesure jamais enregistrée"
          : `Aucune mesure depuis ${joursDepuisMesure} jours`,
    });
  }

  return flags;
}

const FLAG_LABELS: Record<Flag["type"], { label: string; tone: "danger" | "warning" | "neutral" }> = {
  douleur: { label: "Douleur mentionnée", tone: "danger" },
  inactivite: { label: "Inactif", tone: "warning" },
  mesure: { label: "Pas de mesure récente", tone: "neutral" },
};

function buildWhatsAppContactLink(phoneWhatsapp: string | null, prenom: string | null, flags: Flag[]): string | null {
  if (!phoneWhatsapp) return null;
  const digits = phoneWhatsapp.replace(/[^\d]/g, "");
  if (!digits) return null;

  const nom = prenom ? ` ${prenom}` : "";
  const prioritaire = flags.find((f) => f.type === "douleur")
    ? "douleur"
    : flags.find((f) => f.type === "inactivite")
      ? "inactivite"
      : "mesure";

  const message =
    prioritaire === "douleur"
      ? `Bonjour${nom}, j'ai vu que tu mentionnais une gêne dans ton suivi — comment tu te sens ? On ajuste le programme si besoin.`
      : prioritaire === "inactivite"
        ? `Bonjour${nom}, ça fait un moment qu'on n'a pas vu de séance loggée de ton côté — tout va bien ? N'hésite pas si tu as besoin qu'on ajuste quoi que ce soit.`
        : `Bonjour${nom}, ça fait un moment sans nouvelle mesure de ta part — un petit point sur ta progression ?`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default async function AdminSuiviPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/sign-in");

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) redirect("/dashboard");

  // Périmètre Transformation uniquement — Impulsion n'a aucun suivi humain
  // (positionnement du palier), pas de raison de le faire remonter ici.
  const abonnesTransformation = await prisma.user.findMany({
    where: { subscription: { plan: "STANDARD", status: { in: ["ACTIVE", "PAST_DUE"] } } },
    select: { id: true, email: true, prenom: true, phoneWhatsapp: true },
  });

  const avecFlags = await Promise.all(
    abonnesTransformation.map(async (u) => ({ user: u, flags: await computeFlags(u.id) }))
  );
  const aSuivre = avecFlags
    .filter((x) => x.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);

  return (
    <main className="bg-lab-grid min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminNav current="/admin/suivi" />
        <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
          <SectionLabel>Espace coach</SectionLabel>
          <h1 className="text-2xl font-semibold text-graphite-50">Suivi à risque — Transformation</h1>
          <p className="text-sm text-graphite-400">
            {aSuivre.length} abonné{aSuivre.length > 1 ? "s" : ""} sur {abonnesTransformation.length} avec un
            signal à vérifier — inactivité, gêne mentionnée dans une séance, ou pas de mesure récente.
          </p>
        </div>

        {aSuivre.length === 0 && (
          <p className="text-graphite-400">Rien à signaler pour le moment.</p>
        )}

        {aSuivre.map(({ user, flags }) => {
          const contactLink = buildWhatsAppContactLink(user.phoneWhatsapp, user.prenom, flags);
          return (
            <Card key={user.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-graphite-50">
                    {user.prenom ? `${user.prenom} — ` : ""}
                    {user.email}
                  </p>
                </div>
                {contactLink && (
                  <a
                    href={contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-xs font-medium text-laiton-300 transition hover:bg-laiton-400/20"
                  >
                    Contacter sur WhatsApp
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge tone={FLAG_LABELS[flag.type].tone}>{FLAG_LABELS[flag.type].label}</Badge>
                    <p className="text-sm text-graphite-300">{flag.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
