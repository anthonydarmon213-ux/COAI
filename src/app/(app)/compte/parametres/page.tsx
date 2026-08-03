import { RgpdActions } from "@/components/compte/rgpd-actions";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default function ParametresPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Compte</SectionLabel>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
      </div>
      <Card>
        <RgpdActions />
      </Card>
    </div>
  );
}
