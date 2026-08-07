import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

// Premium (ex-Standard) est désormais le seul abonnement auto-souscriptible
// depuis /pricing — les séances individuelles (VIP) se réservent à la
// séance via WhatsApp, plus via un palier d'abonnement dédié.
const TITRE = "Bienvenue dans l'offre Premium";
const DESCRIPTION =
  "Ton abonnement est actif. Complète ton profil si ce n'est pas déjà fait, puis génère ton programme — il sera relu et validé par Anthony Darmon avant de t'être présenté comme définitif.";

export default async function BienvenuePage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-laiton-400/15 text-3xl text-laiton-400">
        ✓
      </span>
      <SectionLabel>Abonnement confirmé</SectionLabel>
      <h1 className="text-2xl font-semibold text-graphite-50 sm:text-3xl">
        Merci{user.prenom ? ` ${user.prenom}` : ""} !
      </h1>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-graphite-50">{TITRE}</h2>
        <p className="text-sm leading-6 text-graphite-300">{DESCRIPTION}</p>
      </Card>
      <Link href="/programme">
        <Button>Voir mon profil & mon programme</Button>
      </Link>
      <Link href="/dashboard" className="text-sm text-graphite-400 underline hover:text-laiton-400">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
