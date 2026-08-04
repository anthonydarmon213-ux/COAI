import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default function PricingPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <Card className="flex max-w-sm flex-col items-center gap-4 text-center">
        <SectionLabel>Offre de lancement</SectionLabel>
        <div className="flex items-baseline gap-3">
          <span className="text-lg text-graphite-500 line-through">89€</span>
          <p className="text-4xl font-semibold text-graphite-50">
            49<span className="text-lg text-graphite-400"> €/mois</span>
          </p>
        </div>
        <p className="text-sm text-graphite-300">Sans engagement, résiliable à tout moment.</p>
        <SubscribeButton />
      </Card>
    </main>
  );
}
