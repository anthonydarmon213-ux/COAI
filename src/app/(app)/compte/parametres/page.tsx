import { getCurrentAppUser } from "@/lib/auth/server";
import { RgpdActions } from "@/components/compte/rgpd-actions";
import { WhatsappPhoneForm } from "@/components/compte/whatsapp-phone-form";
import { PrenomForm } from "@/components/compte/prenom-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default async function ParametresPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Compte</SectionLabel>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
      </div>
      <Card className="flex flex-col gap-2">
        <SectionLabel>Identité</SectionLabel>
        <PrenomForm prenom={user.prenom} />
      </Card>
      <Card className="flex flex-col gap-2">
        <SectionLabel>Assistant WhatsApp</SectionLabel>
        <WhatsappPhoneForm phoneWhatsapp={user.phoneWhatsapp} />
      </Card>
      <Card>
        <RgpdActions />
      </Card>
    </div>
  );
}
