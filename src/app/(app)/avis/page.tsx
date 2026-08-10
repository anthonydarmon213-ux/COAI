import { getCurrentAppUser } from "@/lib/auth/server";
import { AvisForm } from "@/components/compte/avis-form";
import { SectionLabel } from "@/components/ui/section-label";

export default async function AvisPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Ton avis</SectionLabel>
        <h1 className="text-2xl font-semibold">Donner mon avis</h1>
        <p className="text-sm text-graphite-400">
          Envoyé directement à l&apos;équipe COAI — jamais publié sans ton accord.
        </p>
      </div>
      <AvisForm />
    </div>
  );
}
