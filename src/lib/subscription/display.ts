type BillingRecord = {
  status: string;
  plan: string;
  billingInterval: string;
  amountCents: number | null;
  currency: string | null;
};

// Display only: never changes subscription access or billing.
export function subscriptionDisplay(subscription?: BillingRecord | null) {
  if (!subscription) return { name: "Aucun abonnement", description: "Aucun abonnement n’est associé à ce compte.", amount: null };
  const names: Record<string, string> = { PASS_IA: "COAI Essentiel", STANDARD: "Premium Remote", PREMIUM: "VIP Présentiel" };
  const intervals: Record<string, string> = { MONTHLY: "mois", QUARTERLY: "trimestre", ANNUAL: "an" };
  let amount: string | null = null;
  if (subscription.status === "ACTIVE" && Number.isSafeInteger(subscription.amountCents)
    && subscription.amountCents! >= 0 && subscription.currency?.toLowerCase() === "eur"
    && intervals[subscription.billingInterval]) {
    amount = `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(subscription.amountCents! / 100)} / ${intervals[subscription.billingInterval]}`;
  }
  const description = subscription.status === "CANCELED"
    ? "Cet abonnement est résilié. Tes anciennes factures restent consultables dans le portail."
    : subscription.status === "INCOMPLETE"
      ? "La souscription n’est pas finalisée. Vérifie son état avant de recommencer un paiement."
      : "Retrouve les montants de tes factures et tes échéances dans la gestion de ton abonnement.";
  return { name: names[subscription.plan] ?? "Abonnement COAI", description, amount };
}
