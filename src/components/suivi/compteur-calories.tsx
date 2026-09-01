import { Card } from "@/components/ui/card";

// Compteur du jour (01/09/2026, demande Anthony). Additionne les repas
// enregistrés aujourd'hui et les compare à l'objectif du programme.
//
// L'objectif vient du plan nutrition généré ; il peut être absent (programme
// pas encore généré). Dans ce cas on affiche le total seul, sans jauge :
// une barre sans repère ne veut rien dire.

type Ligne = { calories: number | null; proteines: number | null; glucides: number | null; lipides: number | null };

function somme(lignes: Ligne[], champ: keyof Ligne) {
  return lignes.reduce((t, l) => t + (l[champ] ?? 0), 0);
}

function Barre({ valeur, objectif, couleur }: { valeur: number; objectif: number | null; couleur: string }) {
  if (!objectif || objectif <= 0) return null;
  const pct = Math.min(100, Math.round((valeur / objectif) * 100));
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: couleur }} />
    </div>
  );
}

export function CompteurCalories({
  repasDuJour,
  objectifs,
}: {
  repasDuJour: Ligne[];
  objectifs: { calories?: number; proteines?: number; glucides?: number; lipides?: number } | null;
}) {
  const renseignes = repasDuJour.filter((r) => r.calories !== null || r.proteines !== null);
  const kcal = somme(repasDuJour, "calories");
  const prot = somme(repasDuJour, "proteines");
  const gluc = somme(repasDuJour, "glucides");
  const lip = somme(repasDuJour, "lipides");

  const objKcal = objectifs?.calories ?? null;
  const restant = objKcal ? objKcal - kcal : null;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-graphite-400">
          Aujourd&apos;hui
        </p>
        {renseignes.length > 0 && (
          <p className="text-[11px] text-graphite-500">
            {renseignes.length} repas renseigné{renseignes.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-[#fffdf8]">
        {kcal.toLocaleString("fr-FR")}
        <span className="ml-1.5 text-lg text-graphite-400">kcal</span>
        {objKcal && <span className="ml-2 text-sm font-semibold text-graphite-500">/ {objKcal.toLocaleString("fr-FR")}</span>}
      </p>
      <Barre valeur={kcal} objectif={objKcal} couleur="linear-gradient(90deg,#34d399,#c9a262)" />

      {restant !== null && (
        <p className="mt-2 text-xs text-graphite-300">
          {restant > 0
            ? `Il te reste ${restant.toLocaleString("fr-FR")} kcal aujourd’hui.`
            : `Tu es à ${Math.abs(restant).toLocaleString("fr-FR")} kcal au-dessus de ton repère.`}
        </p>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {([
          ["Protéines", prot, objectifs?.proteines, "#4cc9f0"],
          ["Glucides", gluc, objectifs?.glucides, "#c9a262"],
          ["Lipides", lip, objectifs?.lipides, "#a78bfa"],
        ] as const).map(([label, v, obj, couleur]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
            <p className="font-display text-base font-bold text-[#fffdf8]">
              {v}
              <span className="text-[11px] text-graphite-400"> g{obj ? ` / ${obj}` : ""}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wide text-graphite-400">{label}</p>
            <Barre valeur={v} objectif={obj ?? null} couleur={couleur} />
          </div>
        ))}
      </div>

      {renseignes.length === 0 && (
        <p className="mt-3 text-xs leading-5 text-graphite-400">
          Renseigne les calories d&apos;un repas ci-dessous et le total s&apos;affiche ici.
          Les macros restent facultatifs : tu peux noter ta journée sans rien peser.
        </p>
      )}
    </Card>
  );
}
