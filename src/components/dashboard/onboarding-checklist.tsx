import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export function OnboardingChecklist({
  hasProfile,
  hasProgramme,
}: {
  hasProfile: boolean;
  hasProgramme: boolean;
}) {
  if (hasProfile && hasProgramme) return null;

  return (
    <Card className="flex flex-col gap-3">
      <SectionLabel>Pour commencer</SectionLabel>
      <ol className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2">
          <span className={hasProfile ? "text-laiton-400" : "text-graphite-500"}>
            {hasProfile ? "✓" : "1."}
          </span>
          {hasProfile ? (
            <span className="text-graphite-400 line-through">Renseigner mon profil</span>
          ) : (
            <Link href="/compte/profil" className="text-laiton-300 underline">
              Renseigner mon profil (objectifs, niveau, équipement, mesures)
            </Link>
          )}
        </li>
        <li className="flex items-center gap-2">
          <span className={hasProgramme ? "text-laiton-400" : "text-graphite-500"}>
            {hasProgramme ? "✓" : "2."}
          </span>
          {hasProgramme ? (
            <span className="text-graphite-400 line-through">Générer mon programme</span>
          ) : hasProfile ? (
            <Link href="/programme" className="text-laiton-300 underline">
              Générer mon programme
            </Link>
          ) : (
            <span className="text-graphite-500">Générer mon programme</span>
          )}
        </li>
      </ol>
    </Card>
  );
}
