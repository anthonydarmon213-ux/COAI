export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-laiton-400">Abonnement Lab Coach</h1>
      <p className="text-graphite-200">49€/mois, sans engagement.</p>
      {/* TODO: bouton d'inscription → checkout Stripe (price STRIPE_PRICE_ID_MONTHLY) */}
    </main>
  );
}
