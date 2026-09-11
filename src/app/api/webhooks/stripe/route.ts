import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";
import { appliquerRecompenseParrainageSiEligible } from "@/lib/parrainage/reward";
import { sendAdminNotification, sendEmail } from "@/lib/email/client";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";

// The deployment must terminate an invocation before its five-minute lease can
// be reclaimed. No provider request is made inside a SQL transaction.
export const maxDuration = 60;

// Noms affiches uniquement dans la notification interne "Nouvelle
// inscription COAI" envoyee a Anthony — corriges le 04/09/2026 pour
// suivre le renommage COAI Essentiel / Premium Remote / VIP Presentiel et le
// passage en pack 3/6 mois de ces deux dernieres offres.
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  PASS_IA: "COAI Essentiel — 19,99€/mois",
  STANDARD: "Premium Remote — 960€, accompagnement 3 mois minimum",
  PREMIUM: "VIP Présentiel — 1 200€, accompagnement 3 mois minimum",
};

const PROGRAMME_PAR_SLUG = new Map(PROGRAMMES_PRETS.map((programme) => [programme.slug, programme]));

async function enregistrerAchatProgrammes(session: Stripe.Checkout.Session) {
  if (
    session.mode !== "payment" ||
    session.metadata?.programmePurchase !== "UNITAIRE_RENTREE" ||
    !["paid", "no_payment_required"].includes(session.payment_status)
  ) return;

  const userId = session.client_reference_id;
  const programmePrincipal = session.metadata.programmePrincipal;
  const programmeOffert = session.metadata.programmeOffert;
  if (
    !userId ||
    !programmePrincipal ||
    !programmeOffert ||
    programmePrincipal === programmeOffert ||
    !PROGRAMME_PAR_SLUG.has(programmePrincipal) ||
    !PROGRAMME_PAR_SLUG.has(programmeOffert)
  ) {
    throw new Error(`Métadonnées achat programme invalides pour la session ${session.id}`);
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
  try {
    await prisma.programmePurchase.create({
      data: {
        userId,
        programmePrincipal,
        programmeOffert,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountTotal: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) return;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const principal = PROGRAMME_PAR_SLUG.get(programmePrincipal)!;
  const offert = PROGRAMME_PAR_SLUG.get(programmeOffert)!;
  const montant = ((session.amount_total ?? 0) / 100).toFixed(2).replace(".", ",");
  await Promise.all([
    sendAdminNotification(
      "Nouvel achat de programmes COAI",
      `${user.prenom ?? "Un client"} (${user.email}) a acheté « ${principal.nom} » et choisi « ${offert.nom} » offert — ${montant} €.`
    ),
    sendEmail(
      user.email,
      "Tes deux programmes COAI sont disponibles",
      `Bonjour${user.prenom ? ` ${user.prenom}` : ""},\n\n` +
        `Ton achat est confirmé. Tu as maintenant un accès permanent à :\n` +
        `• ${principal.nom}\n• ${offert.nom} — offert\n\n` +
        `${process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr"}/boutique\n\n` +
        `À très vite,\nL'équipe COAI`
    ),
  ]);
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

// Déduit le palier (STANDARD/PREMIUM) à partir du price Stripe de la ligne
// d'abonnement, en comparant aux ids configurés en env.
function mapStripePlan(subscription: Stripe.Subscription): SubscriptionPlan {
  const metadataPlan = subscription.metadata?.plan;
  // Les abonnements crees avant le 02/09/2026 portent "GRATUIT" dans leurs
  // metadonnees Stripe, et le porteront toujours : Stripe ne reecrit pas
  // l'historique. Sans cette equivalence, chacun de leurs webhooks retomberait
  // sur STANDARD et facturerait le mauvais palier.
  if (metadataPlan === "GRATUIT") return "PASS_IA";
  if (metadataPlan === "PASS_IA" || metadataPlan === "STANDARD" || metadataPlan === "PREMIUM") {
    return metadataPlan;
  }
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return "PREMIUM";
  if (
    priceId &&
    (priceId === process.env.STRIPE_PRICE_ID_GRATUIT ||
      priceId === process.env.STRIPE_PRICE_ID_GRATUIT_ANNUAL)
  ) return "PASS_IA";
  return "STANDARD";
}

function mapBillingInterval(
  subscription: Stripe.Subscription
): "MONTHLY" | "QUARTERLY" | "ANNUAL" {
  const recurring = subscription.items.data[0]?.price.recurring;
  if (recurring?.interval === "year") return "ANNUAL";
  // Le trimestriel est un intervalle mensuel repete trois fois, pas un
  // intervalle distinct chez Stripe : sans lire interval_count il serait
  // enregistre comme un simple mensuel.
  if (recurring?.interval === "month" && recurring.interval_count === 3) return "QUARTERLY";
  return "MONTHLY";
}

// Stripe a déplacé current_period_end du niveau abonnement vers chaque
// ligne d'abonnement (items.data[].current_period_end) dans ses versions
// d'API récentes. Les événements webhook bruts suivent la version
// configurée sur le endpoint Stripe (potentiellement plus récente que
// notre SDK, épinglé sur 2024-06-20 dans src/lib/stripe/client.ts) — le
// champ top-level peut donc être absent selon la version active sur le
// compte. Repli sur la ligne d'abonnement, puis sur null (colonne
// nullable) plutôt que planter (10/08/2026 : 21 webhooks sur 23 échouaient
// en HTTP 500 à cause de "new Date(undefined * 1000)").
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const topLevel = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof topLevel === "number") return new Date(topLevel * 1000);
  const item = subscription.items.data[0] as unknown as { current_period_end?: number } | undefined;
  if (typeof item?.current_period_end === "number") return new Date(item.current_period_end * 1000);
  return null;
}

async function upsertFromSubscription(subscription: Stripe.Subscription, userId?: string) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const price = subscription.items.data[0]?.price;
  const data = {
    stripeSubscriptionId: subscription.id,
    status: mapStripeStatus(subscription.status),
    plan: mapStripePlan(subscription),
    billingInterval: mapBillingInterval(subscription),
    amountCents: price?.unit_amount ?? null,
    currency: price?.currency?.toUpperCase() ?? null,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  if (userId) {
    await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: data,
      create: { userId, stripeCustomerId: customerId, ...data },
    });
    return true;
  }

  // customer.subscription.updated/deleted ne porte pas de userId. Stripe ne
  // garantit pas l'ordre des événements : si celui-ci arrive avant
  // checkout.session.completed, la ligne n'existe pas encore — on l'ignore
  // silencieusement (pas d'erreur, updateMany ne matche simplement rien) et
  // checkout.session.completed créera la ligne avec le statut déjà à jour.
  // Un ancien abonnement du même client ne doit pas écraser celui qui l'a
  // remplacé. Le nouveau Checkout installe explicitement le nouvel identifiant.
  const changed = await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId,
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeSubscriptionId: null }] },
    data,
  });
  return changed.count > 0;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Les événements peuvent suivre une version d'API plus récente que le SDK.
  const parent = (invoice as unknown as { parent?: { subscription_details?: {
    subscription?: string | { id: string } | null;
  } } | null }).parent;
  const value = invoice.subscription ?? parent?.subscription_details?.subscription;
  return typeof value === "string" ? value : value?.id ?? null;
}

// Le journal conserve l'événement historique, mais les relances doivent
// refléter la dernière facture de l'abonnement actuel, pas un ancien payload.
// Lectures réseau hors transaction ; updatedAt protège contre une écriture
// locale concurrente. En cas de conflit, relire Stripe avant de réessayer.
async function syncInvoicePaymentState(event: Stripe.Event, invoice: Stripe.Invoice): Promise<Stripe.Invoice | null> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!customerId || !subscriptionId) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const local = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
      select: { id: true, updatedAt: true },
    });
    if (!local) return null;
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const latest = currentSubscription.latest_invoice;
    const latestId = typeof latest === "string" ? latest : latest?.id;
    if (latestId !== invoice.id) return null;
    const current = await stripe.invoices.retrieve(invoice.id);
    const currentCustomer = typeof current.customer === "string" ? current.customer : current.customer?.id;
    if (currentCustomer !== customerId || invoiceSubscriptionId(current) !== subscriptionId) {
      throw new Error("Invoice/subscription identity mismatch");
    }
    const paid = current.status === "paid";
    const failed = event.type === "invoice.payment_failed" && currentSubscription.status !== "canceled" &&
      (current.status === "open" || current.status === "uncollectible") && current.amount_remaining > 0;
    if (!paid && !failed) return null;
    const changed = await prisma.subscription.updateMany({
      where: { id: local.id, updatedAt: local.updatedAt, stripeSubscriptionId: subscriptionId },
      data: { paymentFailedAt: paid ? null : new Date(event.created * 1000), paymentRecoveryReminderSentAt: null },
    });
    if (changed.count > 0) return failed ? current : null;
  }
  throw new Error("Concurrent invoice synchronization; retry required");
}

async function recordBillingEvent(event: Stripe.Event, invoice: Stripe.Invoice, kind: "PAID" | "FAILED") {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const subscriptionId = invoiceSubscriptionId(invoice);

  // The ledger may already have been written by an attempt that failed
  // afterwards (subscription update or notification). Preserve that entry
  // and let the rest of this delivery resume; never count it twice.
  await prisma.billingEvent.upsert({
    where: { id: event.id },
    update: {},
    create: {
      id: event.id,
      invoiceId: invoice.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId ?? null,
      kind,
      amountCents: kind === "PAID" ? invoice.amount_paid : invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      occurredAt: new Date(event.created * 1000),
    },
  });
}

async function getCustomerLabel(customerId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: { select: { prenom: true, email: true } } },
  });
  return subscription?.user
    ? `${subscription.user.prenom ?? "Client"} (${subscription.user.email})`
    : `Client Stripe ${customerId}`;
}

async function getCustomerContact(customerId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: { select: { prenom: true, email: true } } },
  });
  return subscription?.user ?? null;
}

// Webhook Stripe : synchronise le statut et le palier d'abonnement avec le
// modèle Subscription.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const leaseToken = randomUUID();
  const claimed = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO public.stripe_webhook_events
      (id, type, state, "leaseToken", "leaseUntil", attempts)
    VALUES (${event.id}, ${event.type}, 'PROCESSING', ${leaseToken},
      clock_timestamp() + interval '5 minutes', 1)
    ON CONFLICT (id) DO UPDATE SET state = 'PROCESSING',
      "leaseToken" = EXCLUDED."leaseToken", "leaseUntil" = EXCLUDED."leaseUntil",
      attempts = stripe_webhook_events.attempts + 1
    WHERE stripe_webhook_events.type = EXCLUDED.type AND
      (stripe_webhook_events.state = 'FAILED' OR
       (stripe_webhook_events.state = 'PROCESSING' AND
        stripe_webhook_events."leaseUntil" <= clock_timestamp()))
    RETURNING id
  `;
  if (claimed.length === 0) {
    const existing = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
    if (existing?.type === event.type && ["COMPLETED", "LEGACY"].includes(existing.state)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // A concurrent or interrupted handler is not a completed delivery. Stripe
    // must retain its retry, including when the previous invocation was killed.
    return NextResponse.json({ error: "Traitement en cours, réessayer" }, { status: 503 });
  }

  try {
    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      await enregistrerAchatProgrammes(session);
      // Déblocage Pass IA (13/08/2026) : paiement unique, pas
      // d'abonnement Stripe créé — géré à part de upsertFromSubscription
      // (qui suppose toujours session.subscription).
      if (userId && session.mode === "payment" && session.metadata?.oneShotProgramme === "IMPULSION") {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { programmeUnlockedAt: new Date() },
        });
        await sendAdminNotification(
          "Programme COAI Essentiel débloqué",
          `${user.prenom ? user.prenom : "Un utilisateur"} (${user.email}) vient de débloquer la génération de son programme (19€, paiement unique).`
        );
      }
      if (userId && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(subscription, userId);
        await prisma.user.update({
          where: { id: userId },
          data: { checkoutReminderSentAt: new Date() },
        });

        // Notifie Anthony à chaque nouvelle inscription — jusqu'ici seule la
        // file de validation de programme déclenchait une notification,
        // aucune ne partait à l'inscription elle-même (raté pour David
        // Benzaken le 09/08, cf. demande du 10/08 de ne plus reproduire ça).
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const planCode = mapStripePlan(subscription);
          const plan = PLAN_LABELS[planCode];
          const enEssai = Boolean(subscription.trial_end);
          const sessions = planCode === "PREMIUM" ? subscription.items.data[0]?.quantity ?? 1 : null;
          await sendAdminNotification(
            "Nouvelle inscription COAI",
            `${user.prenom ? user.prenom : "Un nouvel abonné"} (${user.email}) vient de s'inscrire — palier ${plan}${sessions ? `, ${sessions} séance${sessions > 1 ? "s" : ""} privée${sessions > 1 ? "s" : ""}/mois` : ""}${enEssai ? ", en essai 7 jours" : ""}.`
          );
        }
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await enregistrerAchatProgrammes(session);
      break;
    }
    case "customer.subscription.updated": {
      const snapshot = event.data.object as Stripe.Subscription;
      // Les événements ne sont pas ordonnés : relire l'objet actuel plutôt
      // que rétablir un état ancien. Une panne laisse l'événement réessayable.
      const subscription = await stripe.subscriptions.retrieve(snapshot.id);
      const statutPrecedent = (event.data.previous_attributes as { status?: string } | undefined)
        ?.status;
      if (!(await upsertFromSubscription(subscription))) break;
      await appliquerRecompenseParrainageSiEligible(subscription, statutPrecedent);
      const previousCancelAtPeriodEnd = (event.data.previous_attributes as { cancel_at_period_end?: boolean } | undefined)?.cancel_at_period_end;
      if (subscription.status !== "canceled" && subscription.cancel_at_period_end && previousCancelAtPeriodEnd === false) {
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const contact = await getCustomerContact(customerId);
        await sendAdminNotification(
          "Résiliation programmée COAI",
          `${await getCustomerLabel(customerId)} a programmé la fin de son abonnement.`
        );
        if (contact) {
          const fin = getCurrentPeriodEnd(subscription)?.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Paris",
          });
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
          await sendEmail(
            contact.email,
            "Ta résiliation COAI est programmée",
            `Bonjour${contact.prenom ? ` ${contact.prenom}` : ""},\n\n` +
              `Ta demande est bien prise en compte${fin ? ` : ton accès reste disponible jusqu'au ${fin}` : ""}.\n\n` +
              `Si tu changes d'avis, tu peux conserver ton abonnement depuis ton espace : ${appUrl}/compte/abonnement\n\n` +
              `À bientôt,\nL'équipe COAI`
          );
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const snapshot = event.data.object as Stripe.Subscription;
      const subscription = await stripe.subscriptions.retrieve(snapshot.id);
      if (!(await upsertFromSubscription(subscription)) || subscription.status !== "canceled") break;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await sendAdminNotification(
        "Abonnement COAI terminé",
        `${await getCustomerLabel(customerId)} n'a plus d'abonnement actif.`
      );
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await recordBillingEvent(event, invoice, "PAID");
      await syncInvoicePaymentState(event, invoice);
      break;
    }
    case "invoice.payment_failed": {
      const snapshot = event.data.object as Stripe.Invoice;
      await recordBillingEvent(event, snapshot, "FAILED");
      const invoice = await syncInvoicePaymentState(event, snapshot);
      if (!invoice) break;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const contact = await getCustomerContact(customerId);
        await sendAdminNotification(
          "Paiement COAI échoué",
          `${await getCustomerLabel(customerId)} : paiement de ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()} à surveiller.`
        );
        if (contact) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
          await sendEmail(
            contact.email,
            "Action requise pour ton abonnement COAI",
            `Bonjour${contact.prenom ? ` ${contact.prenom}` : ""},\n\n` +
              `Le paiement de ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()} n'a pas abouti. ` +
              `Tu peux vérifier ou mettre à jour ton moyen de paiement ici : ${appUrl}/compte/abonnement\n\n` +
              `Certaines fonctions payantes peuvent être temporairement limitées jusqu'à la régularisation.\n\n` +
              `Besoin d'aide ? Réponds simplement à cet email.\n\nL'équipe COAI`
          );
        }
      }
      break;
    }
    // Un remboursement n'annule pas l'abonnement côté Stripe par défaut —
    // on force l'annulation immédiate dès qu'un paiement lié est remboursé,
    // pour éviter un accès qui continue après remboursement.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id;
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subscriptionId) {
          const canceled = await stripe.subscriptions.cancel(subscriptionId);
          await upsertFromSubscription(canceled);
        }
      }
      break;
    }
      default:
        break;
    }
    const completed = await prisma.stripeWebhookEvent.updateMany({
      where: { id: event.id, state: "PROCESSING", leaseToken },
      data: { state: "COMPLETED", completedAt: new Date(), leaseToken: null, leaseUntil: null },
    });
    if (completed.count !== 1) throw new Error("Stripe webhook lease lost");
  } catch (error) {
    await prisma.stripeWebhookEvent.updateMany({
      where: { id: event.id, state: "PROCESSING", leaseToken },
      data: { state: "FAILED", leaseToken: null, leaseUntil: null },
    }).catch(() => undefined);
    throw error;
  }

  return NextResponse.json({ received: true });
}
