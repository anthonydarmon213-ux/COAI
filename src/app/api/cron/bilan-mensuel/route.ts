import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/client";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";

// Bilan mensuel automatique (11/08/2026) — deuxième volet de la stratégie de
// rétention avec relance-inactifs : là où relance-inactifs relance ceux qui
// ont décroché, celui-ci valorise la progression de ceux qui suivent leur
// programme, pour leur donner une raison de rester au-delà du programme
// lui-même. Toutes les données utilisées (séances, mesures) sont déjà
// loggées par l'abonné — aucune saisie supplémentaire requise, le bilan se
// contente de resservir ce qui existe déjà sous une forme lisible.
//
// Échéance calculée par abonné (depuis dernierBilanMensuelEnvoyeAt, ou
// createdAt si aucun bilan n'a encore été envoyé) plutôt qu'un envoi groupé
// le 1er du mois : étale la charge d'envoi dans le temps et donne à chacun
// un bilan sur SA période d'activité réelle, pas un mois calendaire arbitraire
// qui pourrait tomber en plein milieu d'un cycle d'entraînement.
//
// Déclenché par Vercel Cron (cf. vercel.json), protégé par CRON_SECRET —
// même mécanisme que relance-inactifs (cf. src/lib/cron/auth.ts).
const PERIODE_MIN_JOURS = 30;
const JOUR_MS = 24 * 60 * 60 * 1000;

type ExerciceLogge = { nom?: string; chargeKg?: number };

// Reprend la même logique que la page /suivi/progression (regrouper les
// charges par nom d'exercice) mais bornée à la fenêtre du bilan plutôt que
// tout l'historique — pas d'import croisé pratique entre une route API et
// un composant de page.
function calculerDeltaForce(
  seances: { date: Date; exercices: unknown }[]
): { nom: string; premiereChargeKg: number; derniereChargeKg: number } | null {
  const parExercice = new Map<string, { date: Date; chargeKg: number }[]>();

  for (const seance of seances) {
    const exercices = Array.isArray(seance.exercices) ? (seance.exercices as ExerciceLogge[]) : [];
    for (const ex of exercices) {
      if (!ex.nom || typeof ex.chargeKg !== "number") continue;
      const nom = ex.nom.trim();
      const liste = parExercice.get(nom) ?? [];
      liste.push({ date: seance.date, chargeKg: ex.chargeKg });
      parExercice.set(nom, liste);
    }
  }

  let meilleur: { nom: string; points: { date: Date; chargeKg: number }[] } | null = null;
  for (const [nom, points] of parExercice) {
    if (points.length < 2) continue;
    if (!meilleur || points.length > meilleur.points.length) {
      meilleur = { nom, points: points.sort((a, b) => a.date.getTime() - b.date.getTime()) };
    }
  }
  if (!meilleur) return null;

  const premier = meilleur.points[0];
  const dernier = meilleur.points[meilleur.points.length - 1];
  // Ne peut pas arriver (points.length >= 2 vérifié plus haut) — garde pure
  // pour noUncheckedIndexedAccess (tsconfig).
  if (!premier || !dernier) return null;

  return {
    nom: meilleur.nom,
    premiereChargeKg: premier.chargeKg,
    derniereChargeKg: dernier.chargeKg,
  };
}

function calculerDeltaPoids(mesures: { date: Date; poidsKg: number | null }[]): {
  premierPoidsKg: number;
  dernierPoidsKg: number;
} | null {
  const avecPoids = mesures
    .filter((m): m is { date: Date; poidsKg: number } => m.poidsKg !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (avecPoids.length < 2) return null;

  const premier = avecPoids[0];
  const dernier = avecPoids[avecPoids.length - 1];
  // Ne peut pas arriver (length >= 2 vérifié ci-dessus) — garde pure pour
  // noUncheckedIndexedAccess (tsconfig).
  if (!premier || !dernier) return null;

  return { premierPoidsKg: premier.poidsKg, dernierPoidsKg: dernier.poidsKg };
}

function formatDelta(delta: number, unite: string): string {
  const signe = delta > 0 ? "+" : "";
  return `${signe}${Math.round(delta * 10) / 10}${unite}`;
}

function buildEmail(
  prenom: string | null,
  joursPeriode: number,
  nbSeances: number,
  deltaPoids: ReturnType<typeof calculerDeltaPoids>,
  deltaForce: ReturnType<typeof calculerDeltaForce>,
  appUrl: string
) {
  const nom = prenom ? ` ${prenom}` : "";
  const lignes: string[] = [];

  lignes.push(
    `${nbSeances} séance${nbSeances > 1 ? "s" : ""} loggée${nbSeances > 1 ? "s" : ""} ces ${joursPeriode} derniers jours.`
  );

  if (deltaPoids) {
    lignes.push(
      `Poids : ${deltaPoids.premierPoidsKg}kg → ${deltaPoids.dernierPoidsKg}kg (${formatDelta(
        deltaPoids.dernierPoidsKg - deltaPoids.premierPoidsKg,
        "kg"
      )}).`
    );
  }

  if (deltaForce) {
    lignes.push(
      `${deltaForce.nom} : ${deltaForce.premiereChargeKg}kg → ${deltaForce.derniereChargeKg}kg (${formatDelta(
        deltaForce.derniereChargeKg - deltaForce.premiereChargeKg,
        "kg"
      )}).`
    );
  }

  return {
    subject: "Ton bilan COAI",
    text:
      `Bonjour${nom},\n\n` +
      `Petit récap de ta progression :\n\n` +
      lignes.map((l) => `– ${l}`).join("\n") +
      `\n\nContinue comme ça — retrouve le détail ici : ${appUrl}/suivi/progression\n\n` +
      `À bientôt,\nL'équipe COAI`,
  };
}

async function envoyerBilansMensuels(appUrl: string): Promise<number> {
  const maintenant = Date.now();

  const candidats = await prisma.user.findMany({
    where: {
      subscription: {
        plan: { in: ["PASS_IA", "STANDARD", "PREMIUM"] },
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      createdAt: true,
      dernierBilanMensuelEnvoyeAt: true,
      subscription: { select: { status: true, trialEnd: true } },
    },
  });

  let bilansEnvoyes = 0;

  for (const user of candidats) {
    // Pas de bilan tant que l'essai offert n'est pas terminé — rien à
    // valoriser (génération de programme elle-même bloquée pendant l'essai,
    // cf. src/lib/subscription/plan.ts#isInTrial).
    const sub = user.subscription;
    const enEssai = Boolean(
      sub && sub.status === "ACTIVE" && sub.trialEnd && sub.trialEnd.getTime() > maintenant
    );
    if (enEssai) continue;

    const derniereEcheance = user.dernierBilanMensuelEnvoyeAt ?? user.createdAt;
    const joursDepuisEcheance = Math.floor((maintenant - derniereEcheance.getTime()) / JOUR_MS);
    if (joursDepuisEcheance < PERIODE_MIN_JOURS) continue;

    const debutFenetre = derniereEcheance;

    const [seances, mesures] = await Promise.all([
      prisma.seanceLog.findMany({
        where: { userId: user.id, date: { gte: debutFenetre } },
        select: { date: true, exercices: true },
      }),
      prisma.mesure.findMany({
        where: { userId: user.id, date: { gte: debutFenetre } },
        select: { date: true, poidsKg: true },
      }),
    ]);

    // Rien à raconter sur la période : on ne renvoie pas un bilan vide (le
    // cas "abonné inactif" est déjà couvert par relance-inactifs). On ne
    // touche pas non plus dernierBilanMensuelEnvoyeAt, pour qu'un abonné qui
    // reprend l'activité juste après reçoive son bilan dès la prochaine
    // exécution du cron plutôt que d'attendre encore 30 jours.
    if (seances.length === 0) continue;

    const deltaPoids = calculerDeltaPoids(mesures);
    const deltaForce = calculerDeltaForce(seances);

    const { subject, text } = buildEmail(
      user.prenom,
      joursDepuisEcheance,
      seances.length,
      deltaPoids,
      deltaForce,
      appUrl
    );
    const envoye = await sendEmail(user.email, subject, text);

    if (envoye) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dernierBilanMensuelEnvoyeAt: new Date() },
      });
      bilansEnvoyes++;
    }
  }

  return bilansEnvoyes;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
  const bilansEnvoyes = await envoyerBilansMensuels(appUrl);

  return NextResponse.json({ bilansEnvoyes });
}
