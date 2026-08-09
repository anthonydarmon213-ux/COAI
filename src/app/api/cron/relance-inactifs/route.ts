import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/client";

// Relance automatique des abonnés Impulsion inactifs (09/08/2026). Ce palier
// n'a aucun suivi humain (contrairement à Transformation, cf.
// /admin/suivi + relance WhatsApp par le coach) — sans ce cron, un abonné
// qui décroche après sa première semaine ne reçoit jamais de relance et
// churn silencieusement, alors que l'acquisition ne se fait qu'en pub
// payante/SEO (pas de réseau perso à réactiver en filet de secours).
//
// Déclenché par Vercel Cron (cf. vercel.json), protégé par CRON_SECRET :
// Vercel ajoute automatiquement un header "Authorization: Bearer
// <CRON_SECRET>" aux requêtes cron dès que cette variable est configurée.
const SEUIL_INACTIVITE_JOURS = 10;
// Évite de relancer en boucle tant que l'utilisateur reste inactif après
// une première relance déjà envoyée.
const RELANCE_COOLDOWN_JOURS = 14;
const JOUR_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function buildEmail(prenom: string | null, joursInactif: number, appUrl: string) {
  const nom = prenom ? ` ${prenom}` : "";
  return {
    subject: "Ton programme t'attend",
    text:
      `Bonjour${nom},\n\n` +
      `Ça fait ${joursInactif} jours qu'on n'a pas vu de séance loggée de ta part sur COAI. ` +
      `Ton programme est toujours là, prêt à être suivi.\n\n` +
      `Pas besoin de tout reprendre à zéro : une seule séance suffit pour relancer la dynamique.\n\n` +
      `Retrouve ton programme ici : ${appUrl}/programme\n\n` +
      `À bientôt,\nL'équipe COAI`,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = Date.now();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.app";

  // Palier Impulsion (GRATUIT) uniquement, déjà onboardé (au moins un
  // programme généré — exclut de fait qui est encore en essai, la
  // génération y étant bloquée) et pas déjà relancé récemment.
  const candidats = await prisma.user.findMany({
    where: {
      subscription: { plan: "GRATUIT", status: { in: ["ACTIVE", "PAST_DUE"] } },
      programmes: { some: {} },
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      derniereRelanceInactiviteEnvoyeeAt: true,
      programmes: { select: { generatedAt: true }, orderBy: { generatedAt: "desc" }, take: 1 },
      seances: { select: { date: true }, orderBy: { date: "desc" }, take: 1 },
    },
  });

  let relances = 0;
  for (const user of candidats) {
    if (
      user.derniereRelanceInactiviteEnvoyeeAt &&
      maintenant - user.derniereRelanceInactiviteEnvoyeeAt.getTime() < RELANCE_COOLDOWN_JOURS * JOUR_MS
    ) {
      continue;
    }

    const derniereActivite = user.seances[0]?.date ?? user.programmes[0]?.generatedAt;
    if (!derniereActivite) continue;

    const joursInactif = Math.floor((maintenant - derniereActivite.getTime()) / JOUR_MS);
    if (joursInactif <= SEUIL_INACTIVITE_JOURS) continue;

    const { subject, text } = buildEmail(user.prenom, joursInactif, appUrl);
    const envoye = await sendEmail(user.email, subject, text);

    if (envoye) {
      await prisma.user.update({
        where: { id: user.id },
        data: { derniereRelanceInactiviteEnvoyeeAt: new Date() },
      });
      relances++;
    }
  }

  return NextResponse.json({ candidats: candidats.length, relances });
}
