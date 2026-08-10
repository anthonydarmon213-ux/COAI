import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Catégories OMS standard (kg/m²) — mêmes seuils que la plupart des
// calculateurs d'IMC grand public (ex: Basic-Fit, dont s'inspire cette
// carte, cf. demande d'Anthony du 11/08/2026).
const CATEGORIES = [
  { label: "Insuffisance pondérale", court: "Maigreur", max: 18.5 },
  { label: "Corpulence normale", court: "Normal", max: 25 },
  { label: "Surpoids", court: "Surpoids", max: 30 },
  { label: "Obésité", court: "Obésité", max: Infinity },
] as const;

function categorieDe(imc: number): string {
  return CATEGORIES.find((c) => imc < c.max)?.label ?? "Obésité";
}

// Position du curseur sur la barre : bornée à [16, 40] kg/m² pour que le
// marqueur reste lisible même pour des IMC extrêmes, sans prétendre à une
// échelle médicale précise au-delà de cette fourchette d'usage courant.
function positionPct(imc: number): number {
  const borne = Math.min(40, Math.max(16, imc));
  return ((borne - 16) / (40 - 16)) * 100;
}

function BarreComposition({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-graphite-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: couleur }} />
          {label}
        </span>
        <span className="font-mono text-graphite-300">{valeur}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, valeur)}%`, backgroundColor: couleur }}
        />
      </div>
    </div>
  );
}

export function ImcCard({
  tailleCm,
  poidsKg,
  masseGrassePourcent,
  masseMusculaireKg,
}: {
  tailleCm: number | null | undefined;
  poidsKg: number | null | undefined;
  masseGrassePourcent: number | null | undefined;
  masseMusculaireKg: number | null | undefined;
}) {
  if (!tailleCm || !poidsKg) {
    return (
      <Card className="flex flex-col gap-2">
        <SectionLabel>Mon IMC</SectionLabel>
        <p className="text-sm text-graphite-400">
          Renseigne ta taille (profil) et une mesure de poids pour voir ton IMC ici.
        </p>
      </Card>
    );
  }

  const tailleM = tailleCm / 100;
  const imc = poidsKg / (tailleM * tailleM);
  const categorie = categorieDe(imc);
  const masseMuscPourcent =
    masseMusculaireKg && poidsKg ? Math.round((masseMusculaireKg / poidsKg) * 100) : null;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <SectionLabel>Mon IMC</SectionLabel>
        <p className="font-editorial text-3xl text-graphite-50">{imc.toFixed(1)}</p>
        <p className="text-xs text-graphite-500">D&apos;après ta taille et ton dernier poids enregistré</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-graphite-700 via-laiton-400/60 to-graphite-700">
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-graphite-950 bg-laiton-400 shadow-[0_0_8px_rgba(201,162,98,0.6)]"
            style={{ left: `${positionPct(imc)}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-graphite-500">
          {CATEGORIES.map((c) => (
            <span key={c.label} className={c.label === categorie ? "text-laiton-300" : ""}>
              {c.court}
            </span>
          ))}
        </div>
      </div>

      {(masseGrassePourcent || masseMuscPourcent) && (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
          {masseGrassePourcent != null && (
            <BarreComposition label="Masse grasse" valeur={masseGrassePourcent} couleur="#c9a262" />
          )}
          {masseMuscPourcent != null && (
            <BarreComposition label="Masse musculaire" valeur={masseMuscPourcent} couleur="#3a5a6b" />
          )}
        </div>
      )}
    </Card>
  );
}
