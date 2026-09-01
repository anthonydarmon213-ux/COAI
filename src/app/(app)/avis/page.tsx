import { getCurrentAppUser } from "@/lib/auth/server";
import { AvisForm } from "@/components/compte/avis-form";
import { SectionLabel } from "@/components/ui/section-label";

export default async function AvisPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>À votre écoute</SectionLabel>
        <h1 className="text-2xl font-semibold">Vos suggestions font évoluer COAI.</h1>
        <p className="text-sm text-graphite-400">
          Une idée, un exercice manquant ou quelque chose à simplifier ? Chaque message est lu par l&apos;équipe COAI et n&apos;est jamais publié sans ton accord.
        </p>
      </div>
      <AvisForm />
    </div>
  );
}
