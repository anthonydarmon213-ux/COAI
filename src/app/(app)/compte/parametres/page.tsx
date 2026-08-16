import { getCurrentAppUser } from "@/lib/auth/server";
import { RgpdActions } from "@/components/compte/rgpd-actions";
import { WhatsappPhoneForm } from "@/components/compte/whatsapp-phone-form";
import { PrenomForm } from "@/components/compte/prenom-form";
import { SignOutButton } from "@/components/compte/sign-out-button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default async function ParametresPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Compte</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Paramètres.</h1>
      </div>
      <Card className="flex flex-col gap-2">
        <SectionLabel>Identité</SectionLabel>
        <PrenomForm
          prenom={user.prenom}
          nom={user.nom}
          email={user.email}
          dateNaissance={user.dateNaissance ? user.dateNaissance.toISOString().slice(0, 10) : null}
        />
      </Card>
      <Card className="flex flex-col gap-2">
        <SectionLabel>Assistant WhatsApp</SectionLabel>
        <WhatsappPhoneForm phoneWhatsapp={user.phoneWhatsapp} />
      </Card>
      <Card>
        <RgpdActions />
      </Card>
      <Card>
        <SignOutButton />
      </Card>
    </div>
  );
}
