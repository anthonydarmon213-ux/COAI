"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

// Aimant à trafic organique (14/08/2026) : outil autonome, aucun compte ni
// appel serveur requis — le calcul tourne entièrement côté client. Mêmes
// formules de référence que ProfilPhysiqueCalcule (compte/profil-form.tsx,
// Mifflin-St Jeor), étendues ici avec un facteur d'activité (TDEE) et un
// objectif, absents de ce composant-là. Volontairement pas branché sur le
// profil réel : ce calcul générique sert justement à montrer, par contraste,
// ce qu'un vrai profil COAI apporte en plus (cf. CTA en bas).
const NIVEAUX_ACTIVITE = [
  { value: "1.2", label: "Sédentaire (peu ou pas de sport)" },
  { value: "1.375", label: "Légèrement actif (1 à 3 séances/semaine)" },
  { value: "1.55", label: "Modérément actif (3 à 5 séances/semaine)" },
  { value: "1.725", label: "Très actif (6 à 7 séances/semaine)" },
  { value: "1.9", label: "Extrêmement actif (sport intense + métier physique)" },
];

const OBJECTIFS = [
  { value: "-0.15", label: "Perdre du gras" },
  { value: "0", label: "Maintenir mon poids" },
  { value: "0.1", label: "Prendre du muscle" },
];

const PROTEINES_PAR_KG = 1.8;
const RATIO_LIPIDES = 0.25;

export function CalculateurCaloriesForm() {
  const [sexe, setSexe] = useState<"Homme" | "Femme">("Femme");
  const [age, setAge] = useState("30");
  const [tailleCm, setTailleCm] = useState("170");
  const [poidsKg, setPoidsKg] = useState("70");
  const [activite, setActivite] = useState("1.375");
  const [objectif, setObjectif] = useState("0");
  const [calcule, setCalcule] = useState(false);

  const resultat = useMemo(() => {
    const a = Number(age);
    const t = Number(tailleCm);
    const p = Number(poidsKg);
    if (!a || !t || !p) return null;

    const bmr = sexe === "Homme" ? 10 * p + 6.25 * t - 5 * a + 5 : 10 * p + 6.25 * t - 5 * a - 161;
    const tdee = bmr * Number(activite);
    const objectifCalories = Math.round(tdee * (1 + Number(objectif)));

    const proteinesG = Math.round(p * PROTEINES_PAR_KG);
    const proteinesKcal = proteinesG * 4;
    const lipidesKcal = objectifCalories * RATIO_LIPIDES;
    const lipidesG = Math.round(lipidesKcal / 9);
    const glucidesKcal = Math.max(0, objectifCalories - proteinesKcal - lipidesKcal);
    const glucidesG = Math.round(glucidesKcal / 4);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      objectifCalories,
      proteinesG,
      lipidesG,
      glucidesG,
    };
  }, [sexe, age, tailleCm, poidsKg, activite, objectif]);

  function handleCalculer() {
    setCalcule(true);
    // Événement dédié, hors vocabulaire du funnel diagnostic (funnel-events.ts)
    // — cet outil est un aimant à trafic autonome, pas une étape du parcours.
    trackEvent("calories_calculator_used");
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Sexe">
            <Select value={sexe} onChange={(e) => setSexe(e.target.value as "Homme" | "Femme")}>
              <option value="Femme">Femme</option>
              <option value="Homme">Homme</option>
            </Select>
          </Field>
          <Field label="Âge">
            <Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Taille (cm)">
            <Input type="number" inputMode="numeric" value={tailleCm} onChange={(e) => setTailleCm(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Poids (kg)">
            <Input type="number" inputMode="numeric" value={poidsKg} onChange={(e) => setPoidsKg(e.target.value)} />
          </Field>
          <Field label="Objectif">
            <Select value={objectif} onChange={(e) => setObjectif(e.target.value)}>
              {OBJECTIFS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Niveau d'activité physique">
          <Select value={activite} onChange={(e) => setActivite(e.target.value)}>
            {NIVEAUX_ACTIVITE.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={handleCalculer} className="mt-1">
          Calculer mes besoins
        </Button>
      </Card>

      {calcule && resultat && (
        <Card className="flex flex-col gap-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">Ton résultat</span>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-graphite-500">Métabolisme de base</span>
              <span className="font-editorial text-xl text-graphite-50">{resultat.bmr} kcal</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-graphite-500">Dépense totale (TDEE)</span>
              <span className="font-editorial text-xl text-graphite-50">{resultat.tdee} kcal</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <span className="text-xs text-graphite-500">Objectif calorique/jour</span>
              <span className="font-editorial text-2xl text-laiton-300">{resultat.objectifCalories} kcal</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-4">
            <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5 text-center">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">Protéines</span>
              <span className="mt-1 block text-sm font-semibold text-graphite-50">{resultat.proteinesG} g</span>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5 text-center">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">Glucides</span>
              <span className="mt-1 block text-sm font-semibold text-graphite-50">{resultat.glucidesG} g</span>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5 text-center">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">Lipides</span>
              <span className="mt-1 block text-sm font-semibold text-graphite-50">{resultat.lipidesG} g</span>
            </div>
          </div>
          <p className="text-xs leading-5 text-graphite-500">
            Estimation générique (formule de Mifflin-St Jeor) — ne remplace pas un avis médical ou
            un suivi personnalisé, et ne tient compte ni de ta morphologie, ni de tes contraintes de
            santé, ni de l&apos;évolution de ta forme au fil des semaines.
          </p>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-laiton-400/25 bg-laiton-400/[0.06] px-5 py-5 text-center">
            <p className="text-sm leading-6 text-graphite-200">
              Ce chiffre est un point de départ générique, figé. COAI va plus loin : un programme
              construit à partir de plus de 17 ans d&apos;expérience terrain d&apos;Anthony Darmon, qui
              s&apos;ajuste vraiment à ta forme, ton énergie et ton quotidien, semaine après semaine.
            </p>
            <Link href="/diagnostic">
              <Button>Faire mon diagnostic offert</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
