import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

const PLAN_MESSAGES: Record<"STANDARD" | "PREMIUM", { titre: string; description: string }> = {
  PREMIUM: {
    titre: "Bienvenue dans l'offre Premium",
    description:
      "Ton programme IA va être généré et relu par Anthony, et ta séance mensuelle en présentiel ou en visio est incluse — tu peux la réserver dès que tu veux depuis ton programme.",
  },
  STANDARD: {
    titre: "Bienvenue dans l'offre Standard",
    description:
      "Ton abonnement est actif. Complète ton profil si ce n'est pas déjà fait, puis génère ton programme — il sera relu et validé par Anthony Darmon avant de t'être présenté comme définitif.",
  },
};

export default async function BienvenuePage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = searchParams.plan === "PREMIUM" ? "PREMIUM" : "STANDARD";
  const { titre, description } = PLAN_MESSAGES[plan];

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
        <h2 className="text-lg font-semibold text-graphite-50">{titre}</h2>
        <p className="text-sm leading-6 text-graphite-300">{description}</p>
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
