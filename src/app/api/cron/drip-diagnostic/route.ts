import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/client";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { buildUnsubscribeLink } from "@/lib/email/unsubscribe";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Séquence de nurture post-diagnostic (16/08/2026, "machine d'acquisition
// COAI" demandée par Anthony) — le diagnostic envoie déjà un résultat
// immédiat (resultEmailSentAt) et une relance générique à 24h
// (conversionReminderSentAt, cron relance-inactifs) : ce cron ajoute 3
// étages supplémentaires, plus espacés et à contenu distinct, plutôt que de
// tout entasser sur le même message. Même garde-fou stop-on-convert que
// relancerDiagnosticsNonConvertis (jamais d'email si un compte existe déjà
// pour cette adresse) + vérification d'opt-out (RGPD/anti-spam), absente de
// l'ancien cron car c'était un envoi unique — devient nécessaire dès qu'une
// séquence de plusieurs emails espacés dans le temps existe.
const JOUR_MS = 24 * 60 * 60 * 1000;
// Fenêtre large (7 jours) après le jour cible : absorbe un cron manqué sans
// jamais relancer indéfiniment un lead très ancien.
const FENETRE_MS = 7 * JOUR_MS;

type Etape = {
  champ: "drip3SentAt" | "drip5SentAt" | "drip7SentAt";
  joursApres: number;
  sujet: string;
  corps: (appUrl: string, unsubscribe: string | null) => string;
};

const ETAPES: Etape[] = [
  {
    champ: "drip3SentAt",
    joursApres: 3,
    sujet: "Pourquoi COAI n'est pas une IA générique",
    corps: (appUrl, unsubscribe) =>
      `Bonjour,\n\n` +
      `Ton diagnostic COAI n'est pas un simple prompt envoyé à une IA généraliste. L'algorithme qui a construit ` +
      `ton profil est codé à partir de plus de 17 ans d'expérience terrain d'Anthony Darmon, coach diplômé d'État ` +
      `— chaque règle de personnalisation vient d'un vrai coaching, pas d'un texte générique trouvé en ligne.\n\n` +
      `Sur Transformation, un coach humain relit et valide en plus chaque programme avant qu'il ne te soit livré : ` +
      `l'IA personnalise, l'humain valide.\n\n` +
      `Revoir ton diagnostic : ${appUrl}/diagnostic\n\n` +
      `À bientôt,\nL'équipe COAI` +
      (unsubscribe ? `\n\nNe plus recevoir ces emails : ${unsubscribe}` : ""),
  },
  {
    champ: "drip5SentAt",
    joursApres: 5,
    sujet: "Débloque ton programme complet — 19€",
    corps: (appUrl, unsubscribe) =>
      `Bonjour,\n\n` +
      `Impulsion débloque ton programme complet généré par les algorithmes COAI à partir de ton diagnostic : ` +
      `entraînement, nutrition et récupération — un seul paiement de 19€, sans abonnement, accès immédiat.\n\n` +
      `Débloquer mon programme : ${appUrl}/pricing#impulsion\n\n` +
      `Besoin d'un vrai suivi humain qui s'adapte dans la durée ? Transformation (49€/mois, 7 jours d'essai) ` +
      `ajoute un coach diplômé d'État qui valide et fait évoluer ton programme.\n\n` +
      `À bientôt,\nL'équipe COAI` +
      (unsubscribe ? `\n\nNe plus recevoir ces emails : ${unsubscribe}` : ""),
  },
  {
    champ: "drip7SentAt",
    joursApres: 7,
    sujet: "Envie d'un vrai suivi avec un coach ?",
    corps: (appUrl, unsubscribe) => {
      const whatsapp = buildWhatsAppLink(
        "Bonjour Anthony, j'ai fait le diagnostic COAI et j'aimerais échanger sur Transformation ou VIP."
      );
      return (
        `Bonjour,\n\n` +
        `Si ton objectif demande un accompagnement plus poussé qu'un programme généré une seule fois, deux options :\n\n` +
        `Transformation (49€/mois, 7 jours d'essai) — programme évolutif, validation humaine, coach IA illimité : ${appUrl}/pricing#transformation\n` +
        `VIP — coaching 1-to-1 avec Anthony Darmon, présentiel ou visio, sans abonnement : ${appUrl}/pricing#vip\n\n` +
        (whatsapp ? `Tu peux aussi lui écrire directement : ${whatsapp}\n\n` : "") +
        `À bientôt,\nL'équipe COAI` +
        (unsubscribe ? `\n\nNe plus recevoir ces emails : ${unsubscribe}` : "")
      );
    },
  },
];

async function envoyerEtape(etape: Etape, appUrl: string): Promise<number> {
  const maintenant = Date.now();
  const bas = new Date(maintenant - (etape.joursApres * JOUR_MS + FENETRE_MS));
  const haut = new Date(maintenant - etape.joursApres * JOUR_MS);

  const candidats = await prisma.diagnosticLead.findMany({
    where: {
      [etape.champ]: null,
      resultEmailSentAt: { not: null },
      optedOutAt: null,
      createdAt: { gte: bas, lte: haut },
    },
    select: { email: true },
    orderBy: { createdAt: "desc" },
  });

  const emails = [...new Set(candidats.map((lead) => lead.email.toLowerCase()))];
  if (emails.length === 0) return 0;

  const comptesExistants = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const dejaInscrits = new Set(comptesExistants.map((user) => user.email.toLowerCase()));
  let envois = 0;

  for (const email of emails) {
    if (dejaInscrits.has(email)) {
      await prisma.diagnosticLead.updateMany({
        where: { email: { equals: email, mode: "insensitive" }, [etape.champ]: null },
        data: { [etape.champ]: new Date() },
      });
      continue;
    }

    const unsubscribe = buildUnsubscribeLink(appUrl, email);
    const envoye = await sendEmail(email, etape.sujet, etape.corps(appUrl, unsubscribe));
    if (!envoye) continue;

    await prisma.diagnosticLead.updateMany({
      where: { email: { equals: email, mode: "insensitive" }, [etape.champ]: null },
      data: { [etape.champ]: new Date() },
    });
    envois++;
  }

  return envois;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
  const [j3, j5, j7] = await Promise.all(ETAPES.map((etape) => envoyerEtape(etape, appUrl)));

  return NextResponse.json({ j3, j5, j7 });
}
