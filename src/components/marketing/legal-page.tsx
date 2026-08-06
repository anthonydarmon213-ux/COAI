import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

export function LegalPage({
  label,
  titre,
  majLe,
  children,
}: {
  label: string;
  titre: string;
  majLe: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-lab-grid min-h-screen px-6 py-20">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="text-3xl font-semibold tracking-tight text-graphite-50">{titre}</h1>
          <p className="text-xs text-graphite-500">Dernière mise à jour : {majLe}</p>
        </div>
        <div className="flex flex-col gap-6 text-sm leading-7 text-graphite-300 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-graphite-50 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_a]:text-laiton-400 [&_a]:underline">
          {children}
        </div>
        <Link href="/" className="text-sm text-graphite-400 underline hover:text-laiton-400">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
