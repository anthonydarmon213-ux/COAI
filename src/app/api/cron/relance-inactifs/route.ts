import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendEmail, sendAdminNotification } from "@/lib/email/client";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { detecterBaisseMotivation, buildWhatsAppContactLink } from "@/lib/admin/flags";

// Relance automatique des abonnés inactifs (09/08/2026, étendu à
// Coaching Hybride/Premium le 11/08/2026). À l'origine réservé au palier
// Pass IA, qui n'a aucun suivi humain (contrairement à Coaching Hybride, cf.
// /admin/suivi + relance WhatsApp par le coach) — sans ce cron, un abonné
// qui décroche après sa première semaine ne reçoit jamais de relance et
// churn silencieusement, alors que l'acquisition ne se fait qu'en pub
// payante/SEO (pas de réseau perso à réactiver en filet de secours).
//
// Étendu à Coaching Hybride/Premium : le suivi manuel via /admin/suivi ne
// scale pas avec le volume d'abonnés visé par l'acquisition externe — ce
// cron sert de filet de sécurité qui garantit qu'aucun abonné (quel que
// soit le palier payé) ne décroche silencieusement, sans remplacer le
// suivi humain existant sur ces deux paliers. Message personnalisé et
// signé "Anthony" sur Coaching Hybride/Premium (au lieu de "L'équipe COAI")
// pour rester cohérent avec le positionnement coaching humain qui
// justifie leur prix.
//
// Déclenché par Vercel Cron (cf. vercel.json), protégé par CRON_SECRET :
// Vercel ajoute automatiquement un header "Authorization: Bearer
// <CRON_SECRET>" aux requêtes cron dès que cette variable est configurée.
const SEUIL_INACTIVITE_JOURS = 10;
// Évite de relancer en boucle tant que l'utilisateur reste inactif après
// une première relance déjà envoyée.
const RELANCE_COOLDOWN_JOURS = 14;
const JOUR_MS = 24 * 60 * 60 * 1000;
const RAPPEL_ESSAI_AVANT_MS = 72 * 60 * 60 * 1000;
const RELANCE_DIAGNOSTIC_APRES_MS = 24 * 60 * 60 * 1000;
const RELANCE_DIAGNOSTIC_FENETRE_MS = 7 * JOUR_MS;
const RELANCE_ACTIVATION_APRES_MS = 24 * 60 * 60 * 1000;
const RELANCE_CHECKOUT_APRES_MS = 2 * 60 * 60 * 1000;
const RELANCE_CHECKOUT_FENETRE_MS = 7 * JOUR_MS;
const RELANCE_PAIEMENT_APRES_MS = 48 * 60 * 60 * 1000;

// Même fenêtre et mêmes mots-clés que /admin/suivi (détection douleur côté
// Coaching Hybride) — gardés synchronisés à la main, les deux vivent dans des
// fichiers séparés (l'un lu par un coach humain, l'autre déclenché par cron)
// donc pas d'import croisé pratique.
const FENETRE_DOULEUR_JOURS = 14;
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

// Pass IA (IA seule) : ton générique, "L'équipe COAI". Coaching Hybride/
// Premium (coach humain qui valide) : signé Anthony directement, pour ne
// pas casser la promesse "coaching humain" avec un email qui sonne comme un
// système automatisé anonyme.
function buildEmail(
  prenom: string | null,
  joursInactif: number,
  appUrl: string,
  plan: SubscriptionPlan
) {
  const nom = prenom ? ` ${prenom}` : "";

  if (plan === "GRATUIT") {
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

  return {
    subject: "Des nouvelles ?",
    text:
      `Bonjour${nom},\n\n` +
      `Ça fait ${joursInactif} jours que je ne vois pas de séance loggée de ton côté sur COAI, ` +
      `et je voulais prendre des nouvelles directement plutôt que de laisser filer.\n\n` +
      `Rien à justifier — dis-moi juste si ton programme a besoin d'être ajusté (charge, disponibilité, ` +
      `douleur...), je le fais avec toi. Sinon, une seule séance suffit pour relancer la dynamique.\n\n` +
      `Retrouve ton programme ici : ${appUrl}/programme\n\n` +
      `À bientôt,\nAnthony`,
  };
}

// Relance des abonnés inactifs (programme généré mais plus de séance
// loggée depuis SEUIL_INACTIVITE_JOURS), tous paliers payants confondus.
async function relancerInactifs(appUrl: string): Promise<number> {
  const maintenant = Date.now();

  const candidats = await prisma.user.findMany({
    where: {
      subscription: { plan: { in: ["GRATUIT", "STANDARD", "PREMIUM"] }, status: { in: ["ACTIVE", "PAST_DUE"] } },
      programmes: { some: {} },
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      derniereRelanceInactiviteEnvoyeeAt: true,
      subscription: { select: { plan: true } },
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

    // subscription ne peut pas être null ici (filtré par le where ci-dessus),
    // le ?? est une garde TypeScript pure.
    const plan = user.subscription?.plan ?? "GRATUIT";
    const { subject, text } = buildEmail(user.prenom, joursInactif, appUrl, plan);
    const envoye = await sendEmail(user.email, subject, text);

    if (envoye) {
      await prisma.user.update({
        where: { id: user.id },
        data: { derniereRelanceInactiviteEnvoyeeAt: new Date() },
      });
      relances++;
    }
  }

  return relances;
}

// Alerte sécurité douleur, palier Pass IA (10/08/2026) — sur Coaching Hybride
// une mention de douleur dans une séance est vue par le coach humain via
// /admin/suivi ; sur Pass IA (IA seule, pas de relecture humaine) rien ne
// la voyait jusqu'ici. On comble ce trou en deux temps : un email à
// l'abonné avec un message sécurité (pas un diagnostic — juste "repose-toi,
// consulte un professionnel de santé si ça persiste"), et une notification
// à Anthony pour qu'il ait la visibilité et puisse recontacter si besoin.
async function alerterDouleurImpulsion(appUrl: string): Promise<number> {
  const maintenant = Date.now();

  const candidats = await prisma.user.findMany({
    where: { subscription: { plan: "GRATUIT", status: { in: ["ACTIVE", "PAST_DUE"] } } },
    select: {
      id: true,
      email: true,
      prenom: true,
      derniereAlerteDouleurEnvoyeeAt: true,
      seances: {
        where: { date: { gte: new Date(maintenant - FENETRE_DOULEUR_JOURS * JOUR_MS) } },
        select: { date: true, ressenti: true, notes: true },
        orderBy: { date: "desc" },
      },
    },
  });

  let alertes = 0;
  for (const user of candidats) {
    const seanceAvecDouleur = user.seances.find((s) => {
      const texte = `${s.ressenti ?? ""} ${s.notes ?? ""}`.toLowerCase();
      return MOTS_DOULEUR.some((mot) => texte.includes(mot));
    });
    if (!seanceAvecDouleur) continue;

    // Déjà alerté pour cette mention-là (ou une plus récente) : on ne
    // renvoie pas tant qu'aucune nouvelle séance avec douleur n'apparaît.
    if (
      user.derniereAlerteDouleurEnvoyeeAt &&
      seanceAvecDouleur.date.getTime() <= user.derniereAlerteDouleurEnvoyeeAt.getTime()
    ) {
      continue;
    }

    const nom = user.prenom ? ` ${user.prenom}` : "";
    const envoyeUtilisateur = await sendEmail(
      user.email,
      "On a vu ta remarque sur une gêne",
      `Bonjour${nom},\n\n` +
        `On a remarqué que tu mentionnais une gêne ou une douleur dans une séance récente. ` +
        `Ton programme actuel est généré par IA, sans relecture par un coach humain sur ce palier.\n\n` +
        `Par précaution : repose la zone concernée, n'insiste pas sur un mouvement douloureux, et ` +
        `si la gêne persiste ou s'aggrave, consulte un professionnel de santé (médecin, kiné) avant de reprendre.\n\n` +
        `Tu peux ajuster ton programme à tout moment depuis ${appUrl}/programme.\n\n` +
        `Prends soin de toi,\nL'équipe COAI`
    );

    const extrait = (seanceAvecDouleur.ressenti || seanceAvecDouleur.notes || "").slice(0, 200);
    await sendAdminNotification(
      "Douleur signalée — palier Pass IA",
      `${user.prenom ? user.prenom : "Un abonné"} (${user.email}) a mentionné une gêne/douleur dans une séance ` +
        `du ${seanceAvecDouleur.date.toLocaleDateString("fr-FR")} (palier Pass IA, pas de relecture humaine) : « ${extrait} »`
    );

    if (envoyeUtilisateur) {
      await prisma.user.update({
        where: { id: user.id },
        data: { derniereAlerteDouleurEnvoyeeAt: new Date() },
      });
      alertes++;
    }
  }

  return alertes;
}

// Escalade humaine sur baisse de motivation (20/08/2026, piste produit
// "Hybrid Human-AI Mirror" validée par Anthony) — réservée à Coaching Hybride
// (seul palier avec une vraie relation coach humain, cf. buildWhatsAppContactLink
// déjà utilisé sur /admin/suivi et /admin/clients/[id]). Contrairement à
// alerterDouleurImpulsion ci-dessus, aucun email automatique n'est envoyé à
// l'abonné : l'idée n'est pas un message généré par un bot, mais de donner
// à Anthony le signal + un message WhatsApp prêt qu'il envoie lui-même, en
// vrai, à sa façon — l'IA détecte, l'humain répond.
async function alerterMotivationEnBaisse(appUrl: string): Promise<number> {
  const candidats = await prisma.user.findMany({
    where: { subscription: { plan: "STANDARD", status: { in: ["ACTIVE", "PAST_DUE"] } } },
    select: {
      id: true,
      prenom: true,
      phoneWhatsapp: true,
      derniereAlerteMotivationEnvoyeeAt: true,
      weeklyCheckins: {
        where: { motivation: { not: null } },
        select: { motivation: true, semaineDebut: true },
        orderBy: { semaineDebut: "desc" },
        take: 3,
      },
    },
  });

  let alertes = 0;
  for (const user of candidats) {
    const flag = detecterBaisseMotivation(user.weeklyCheckins);
    if (!flag) continue;

    const dernierCheckin = user.weeklyCheckins[0];
    if (
      user.derniereAlerteMotivationEnvoyeeAt &&
      dernierCheckin &&
      dernierCheckin.semaineDebut.getTime() <= user.derniereAlerteMotivationEnvoyeeAt.getTime()
    ) {
      continue;
    }

    const lienWhatsApp = buildWhatsAppContactLink(user.phoneWhatsapp, user.prenom, [flag]);
    await sendAdminNotification(
      "Motivation en baisse — Coaching Hybride",
      `${user.prenom ? user.prenom : "Un abonné"} montre un signal de motivation en baisse : ${flag.detail}.\n\n` +
        (lienWhatsApp
          ? `Message WhatsApp prêt à envoyer : ${lienWhatsApp}`
          : "Pas de numéro WhatsApp enregistré — à recontacter par email.") +
        `\n\nFiche complète : ${appUrl}/admin/clients/${user.id}`
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { derniereAlerteMotivationEnvoyeeAt: new Date() },
    });
    alertes++;
  }
  return alertes;
}

// Rappel transparent et unique avant le premier prélèvement. Il réduit les
// annulations surprises tout en ramenant l'abonné vers la valeur du produit.
async function rappelerFinEssai(appUrl: string): Promise<number> {
  const maintenant = new Date();
  const limite = new Date(maintenant.getTime() + RAPPEL_ESSAI_AVANT_MS);
  const candidats = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      trialReminderSentAt: null,
      trialEnd: { gt: maintenant, lte: limite },
    },
    include: { user: { select: { email: true, prenom: true } } },
  });

  let rappels = 0;
  for (const subscription of candidats) {
    if (!subscription.trialEnd) continue;
    const prixMensuel = subscription.plan === "GRATUIT" ? 49 : subscription.plan === "STANDARD" ? 89 : 199;
    const prixAnnuel = prixMensuel * 12;
    const prix = subscription.billingInterval === "ANNUAL" ? `${prixAnnuel} €/an` : `${prixMensuel} €/mois`;
    const date = subscription.trialEnd.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
    const nom = subscription.user.prenom ? ` ${subscription.user.prenom}` : "";
    const envoye = await sendEmail(
      subscription.user.email,
      "Ton essai COAI se termine bientôt",
      `Bonjour${nom},\n\n` +
        `Ton essai COAI se termine le ${date}. Ton abonnement passera ensuite à ${prix}, sans engagement.\n\n` +
        `Profite des derniers jours pour ouvrir ta séance du jour et tester ton accompagnement : ${appUrl}/aujourdhui\n\n` +
        `Tu peux consulter ou gérer ton abonnement à tout moment ici : ${appUrl}/compte/abonnement\n\n` +
        `À bientôt,\nL'équipe COAI`
    );
    if (!envoye) continue;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { trialReminderSentAt: new Date() },
    });
    rappels++;
  }
  return rappels;
}

// Relance une seule fois les prospects ayant terminé leur diagnostic mais
// n'ayant toujours pas créé de compte après 24 h. L'adresse a été recueillie
// avec le consentement email explicite du quiz. Dès qu'un compte existe, la
// personne sort définitivement de ce parcours prospect.
async function relancerDiagnosticsNonConvertis(appUrl: string): Promise<number> {
  const maintenant = Date.now();
  const candidats = await prisma.diagnosticLead.findMany({
    where: {
      conversionReminderSentAt: null,
      resultEmailSentAt: { not: null },
      createdAt: {
        gte: new Date(maintenant - RELANCE_DIAGNOSTIC_FENETRE_MS),
        lte: new Date(maintenant - RELANCE_DIAGNOSTIC_APRES_MS),
      },
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
  let relancesDiagnostic = 0;

  for (const email of emails) {
    if (dejaInscrits.has(email)) {
      await prisma.diagnosticLead.updateMany({
        where: { email: { equals: email, mode: "insensitive" }, conversionReminderSentAt: null },
        data: { conversionReminderSentAt: new Date() },
      });
      continue;
    }

    const envoye = await sendEmail(
      email,
      "Ton accompagnement COAI est prêt",
      `Bonjour,\n\n` +
        `Tu as terminé ton diagnostic COAI, mais tu n'as pas encore activé ton accompagnement. ` +
        `Ton profil est prêt : il ne te reste qu'à choisir la formule qui correspond au niveau de suivi que tu veux.\n\n` +
        `Choisis ta formule : ${appUrl}/pricing\n\n` +
        `Pass IA : 7 jours d'essai, puis 19,99 €/mois (ou 119 €/an), avec ton Personal Trainer IA disponible 24h/24.\n` +
        `Coaching Hybride : 7 jours d'essai, puis 99 €/mois, avec le regard et les ajustements d'un coach humain.\n` +
        `VIP : à partir de 199 €/mois, avec une séance privée mensuelle.\n\n` +
        `À bientôt,\nL'équipe COAI`
    );
    if (!envoye) continue;

    await prisma.diagnosticLead.updateMany({
      where: { email: { equals: email, mode: "insensitive" }, conversionReminderSentAt: null },
      data: { conversionReminderSentAt: new Date() },
    });
    relancesDiagnostic++;
  }

  return relancesDiagnostic;
}

// Filet de sécurité pour les nouveaux essais qui ont quitté l'onboarding
// avant la génération du programme. Une seule relance, après 24 h, tant que
// l'essai est actif. Dès qu'un programme existe, aucune relance n'est envoyée.
async function relancerEssaisNonActives(appUrl: string): Promise<number> {
  const maintenant = new Date();
  const candidats = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      trialEnd: { gt: maintenant },
      trialActivationReminderSentAt: null,
      createdAt: { lte: new Date(maintenant.getTime() - RELANCE_ACTIVATION_APRES_MS) },
      user: { programmes: { none: {} } },
    },
    include: { user: { select: { email: true, prenom: true } } },
  });

  let relancesActivation = 0;
  for (const subscription of candidats) {
    const nom = subscription.user.prenom ? ` ${subscription.user.prenom}` : "";
    const envoye = await sendEmail(
      subscription.user.email,
      "Ton programme COAI n'attend plus que toi",
      `Bonjour${nom},\n\n` +
        `Ton essai COAI est actif, mais ton programme personnalisé n'a pas encore été généré. ` +
        `Il te suffit de reprendre ton profil : COAI prépare ensuite ton entraînement, ta nutrition et ta récupération.\n\n` +
        `Terminer mon activation : ${appUrl}/bienvenue\n\n` +
        `Tu disposes toujours de tes 7 jours d'essai, sans engagement.\n\n` +
        `À bientôt,\nL'équipe COAI`
    );
    if (!envoye) continue;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { trialActivationReminderSentAt: new Date() },
    });
    relancesActivation++;
  }
  return relancesActivation;
}

// Récupère une intention de Checkout restée sans abonnement actif. Une seule
// relance par session commencée ; un nouveau Checkout réarme proprement le
// rappel en remettant checkoutReminderSentAt à null.
async function relancerCheckoutsAbandonnes(appUrl: string): Promise<number> {
  const maintenant = Date.now();
  const candidats = await prisma.user.findMany({
    where: {
      checkoutStartedAt: {
        gte: new Date(maintenant - RELANCE_CHECKOUT_FENETRE_MS),
        lte: new Date(maintenant - RELANCE_CHECKOUT_APRES_MS),
      },
      checkoutReminderSentAt: null,
      OR: [
        { subscription: null },
        { subscription: { status: { in: ["INCOMPLETE", "CANCELED"] } } },
      ],
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      checkoutPlan: true,
      checkoutBillingInterval: true,
    },
  });

  let relancesCheckout = 0;
  for (const user of candidats) {
    const plan = user.checkoutPlan === "STANDARD" ? "Coaching Hybride" : "Pass IA";
    // Pass IA est facturé à l'année (cf. OFFER_BY_PLAN.GRATUIT, interval
    // "year") — l'e-mail affichait un prix mensuel qui n'a jamais
    // correspondu au prélèvement réel.
    const prix = user.checkoutPlan === "STANDARD" ? "99 €/mois" : "49 €/an";
    const nom = user.prenom ? ` ${user.prenom}` : "";
    const envoye = await sendEmail(
      user.email,
      "Tu peux reprendre ton inscription COAI",
      `Bonjour${nom},\n\n` +
        `Ton inscription à la formule ${plan} (${prix}) n'a pas été finalisée. ` +
        `Aucun paiement n'a été enregistré.\n\n` +
        `Tu peux reprendre quand tu veux et profiter de tes 7 jours d'essai : ${appUrl}/pricing\n\n` +
        `Si tu as rencontré un problème, réponds simplement à cet email.\n\n` +
        `À bientôt,\nL'équipe COAI`
    );
    if (!envoye) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { checkoutReminderSentAt: new Date() },
    });
    relancesCheckout++;
  }
  return relancesCheckout;
}

// Deuxième filet de sécurité après l'email immédiat du webhook Stripe.
// Une seule relance 48 h après l'échec, uniquement si l'abonnement est
// toujours en retard. Un paiement réussi efface automatiquement cet état.
async function relancerPaiementsEnRetard(appUrl: string): Promise<number> {
  const maintenant = new Date();
  const candidats = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      cancelAtPeriodEnd: false,
      paymentFailedAt: { lte: new Date(maintenant.getTime() - RELANCE_PAIEMENT_APRES_MS) },
      paymentRecoveryReminderSentAt: null,
    },
    include: { user: { select: { email: true, prenom: true } } },
  });

  let relancesPaiement = 0;
  for (const subscription of candidats) {
    const nom = subscription.user.prenom ? ` ${subscription.user.prenom}` : "";
    const envoye = await sendEmail(
      subscription.user.email,
      "Ton abonnement COAI attend ta régularisation",
      `Bonjour${nom},\n\n` +
        `Ton dernier paiement n'a toujours pas pu être régularisé. Tu peux mettre à jour ton moyen de paiement en toute sécurité depuis le portail Stripe : ${appUrl}/compte/abonnement\n\n` +
        `COAI ne stocke aucune donnée bancaire. Si tu as déjà effectué la mise à jour, tu peux ignorer ce message.\n\n` +
        `Besoin d'aide ? Réponds simplement à cet email.\n\nL'équipe COAI`
    );
    if (!envoye) continue;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { paymentRecoveryReminderSentAt: maintenant },
    });
    relancesPaiement++;
  }
  return relancesPaiement;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";

  const [relances, alertesDouleur, alertesMotivation, rappelsFinEssai, relancesDiagnostic, relancesActivation, relancesCheckout, relancesPaiement] = await Promise.all([
    relancerInactifs(appUrl),
    alerterDouleurImpulsion(appUrl),
    alerterMotivationEnBaisse(appUrl),
    rappelerFinEssai(appUrl),
    relancerDiagnosticsNonConvertis(appUrl),
    relancerEssaisNonActives(appUrl),
    relancerCheckoutsAbandonnes(appUrl),
    relancerPaiementsEnRetard(appUrl),
  ]);

  return NextResponse.json({ relances, alertesDouleur, alertesMotivation, rappelsFinEssai, relancesDiagnostic, relancesActivation, relancesCheckout, relancesPaiement });
}
