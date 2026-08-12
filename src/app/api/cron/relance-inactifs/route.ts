import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendEmail, sendAdminNotification } from "@/lib/email/client";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";

// Relance automatique des abonnés inactifs (09/08/2026, étendu à
// Transformation/Premium le 11/08/2026). À l'origine réservé au palier
// Impulsion, qui n'a aucun suivi humain (contrairement à Transformation, cf.
// /admin/suivi + relance WhatsApp par le coach) — sans ce cron, un abonné
// qui décroche après sa première semaine ne reçoit jamais de relance et
// churn silencieusement, alors que l'acquisition ne se fait qu'en pub
// payante/SEO (pas de réseau perso à réactiver en filet de secours).
//
// Étendu à Transformation/Premium : le suivi manuel via /admin/suivi ne
// scale pas avec le volume d'abonnés visé par l'acquisition externe — ce
// cron sert de filet de sécurité qui garantit qu'aucun abonné (quel que
// soit le palier payé) ne décroche silencieusement, sans remplacer le
// suivi humain existant sur ces deux paliers. Message personnalisé et
// signé "Anthony" sur Transformation/Premium (au lieu de "L'équipe COAI")
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

// Même fenêtre et mêmes mots-clés que /admin/suivi (détection douleur côté
// Transformation) — gardés synchronisés à la main, les deux vivent dans des
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

// Impulsion (IA seule) : ton générique, "L'équipe COAI". Transformation/
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

// Alerte sécurité douleur, palier Impulsion (10/08/2026) — sur Transformation
// une mention de douleur dans une séance est vue par le coach humain via
// /admin/suivi ; sur Impulsion (IA seule, pas de relecture humaine) rien ne
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
      "Douleur signalée — palier Impulsion",
      `${user.prenom ? user.prenom : "Un abonné"} (${user.email}) a mentionné une gêne/douleur dans une séance ` +
        `du ${seanceAvecDouleur.date.toLocaleDateString("fr-FR")} (palier Impulsion, pas de relecture humaine) : « ${extrait} »`
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
    const prix = subscription.plan === "GRATUIT" ? "19 €" : subscription.plan === "STANDARD" ? "49 €" : "199 €";
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
        `Ton essai COAI se termine le ${date}. Ton abonnement passera ensuite à ${prix}/mois, sans engagement.\n\n` +
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

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";

  const [relances, alertesDouleur, rappelsFinEssai] = await Promise.all([
    relancerInactifs(appUrl),
    alerterDouleurImpulsion(appUrl),
    rappelerFinEssai(appUrl),
  ]);

  return NextResponse.json({ relances, alertesDouleur, rappelsFinEssai });
}
