import { prisma } from "@/lib/db/client";

// Suivi par exception plutôt que par calendrier : au lieu de relire
// manuellement chaque abonné toutes les X semaines (ne scale pas avec le
// nombre d'abonnés), on ne fait remonter que les comptes qui présentent un
// signal concret — le temps du coach va sur les cas réels. Extrait de
// admin/suivi/page.tsx (11/08/2026, Phase 4) pour être réutilisé aussi par
// le dashboard coach /admin.
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

// Une baisse de plus de 5% sur un même exercice entre les deux derniers
// tests peut signaler une fatigue/un surmenage qui ne se voit pas forcément
// à l'œil nu.
const SEUIL_REGRESSION_POURCENT = 0.05;

export type Flag = { type: "douleur" | "inactivite" | "mesure" | "regression"; detail: string };

export const FLAG_LABELS: Record<Flag["type"], { label: string; tone: "danger" | "warning" | "neutral" }> = {
  douleur: { label: "Douleur mentionnée", tone: "danger" },
  inactivite: { label: "Inactif", tone: "warning" },
  mesure: { label: "Pas de mesure récente", tone: "neutral" },
  regression: { label: "Perf en baisse", tone: "warning" },
};

// Priorité métier de la file coach : sécurité avant performance, puis
// engagement et enfin qualité des données. Ce score sert uniquement au tri
// de l'espace coach ; il n'établit aucun diagnostic médical.
const FLAG_PRIORITY: Record<Flag["type"], number> = {
  douleur: 100,
  regression: 60,
  inactivite: 40,
  mesure: 10,
};

export function getFlagsPriority(flags: Flag[]): number {
  return flags.reduce((total, flag) => total + FLAG_PRIORITY[flag.type], 0);
}

export function getPriorityLabel(flags: Flag[]): { label: string; tone: "danger" | "warning" | "neutral" } {
  if (flags.some((flag) => flag.type === "douleur")) return { label: "Priorité haute", tone: "danger" };
  if (flags.some((flag) => flag.type === "regression" || flag.type === "inactivite")) return { label: "À traiter", tone: "warning" };
  return { label: "À vérifier", tone: "neutral" };
}

export async function computeFlags(userId: string): Promise<Flag[]> {
  const maintenant = Date.now();
  const flags: Flag[] = [];

  const [derniereSeance, seancesRecentes, derniereMesure, testsRecents] = await Promise.all([
    prisma.seanceLog.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.seanceLog.findMany({
      where: { userId, date: { gte: new Date(maintenant - FENETRE_DOULEUR_JOURS * JOUR_MS) } },
      orderBy: { date: "desc" },
    }),
    prisma.mesure.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.testMaxi.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 20 }),
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

  // Compare les deux derniers tests d'un même exercice (testsRecents est
  // déjà trié du plus récent au plus ancien) — première paire trouvée en
  // baisse déclenche le flag, pas la peine de tout lister.
  for (const exercice of new Set(testsRecents.map((t) => t.exercice))) {
    const testsExercice = testsRecents.filter((t) => t.exercice === exercice);
    const dernier = testsExercice[0];
    const precedent = testsExercice[1];
    if (!dernier || !precedent) continue;
    if (dernier.valeur < precedent.valeur * (1 - SEUIL_REGRESSION_POURCENT)) {
      const baisse = Math.round((1 - dernier.valeur / precedent.valeur) * 100);
      flags.push({
        type: "regression",
        detail: `${exercice} en baisse de ${baisse}% (${dernier.valeur}${dernier.unite} le ${dernier.date.toLocaleDateString("fr-FR")}, contre ${precedent.valeur}${precedent.unite} avant)`,
      });
      break;
    }
  }

  return flags;
}

export function buildWhatsAppContactLink(
  phoneWhatsapp: string | null,
  prenom: string | null,
  flags: Flag[]
): string | null {
  if (!phoneWhatsapp) return null;
  const digits = phoneWhatsapp.replace(/[^\d]/g, "");
  if (!digits) return null;

  const nom = prenom ? ` ${prenom}` : "";
  // Ordre de priorité : un signal de sécurité (douleur) passe avant un
  // signal de performance (regression), lui-même avant un simple manque
  // d'activité/de données.
  const ordrePriorite: Flag["type"][] = ["douleur", "regression", "inactivite", "mesure"];
  const prioritaire = ordrePriorite.find((type) => flags.some((f) => f.type === type)) ?? "mesure";

  const messages: Record<Flag["type"], string> = {
    douleur: `Bonjour${nom}, j'ai vu que tu mentionnais une gêne dans ton suivi — comment tu te sens ? On ajuste le programme si besoin.`,
    regression: `Bonjour${nom}, j'ai vu que tes derniers résultats étaient un peu en retrait — tout va bien niveau récupération/sommeil ? On peut ajuster la charge si besoin.`,
    inactivite: `Bonjour${nom}, ça fait un moment qu'on n'a pas vu de séance loggée de ton côté — tout va bien ? N'hésite pas si tu as besoin qu'on ajuste quoi que ce soit.`,
    mesure: `Bonjour${nom}, ça fait un moment sans nouvelle mesure de ta part — un petit point sur ta progression ?`,
  };

  return `https://wa.me/${digits}?text=${encodeURIComponent(messages[prioritaire])}`;
}
