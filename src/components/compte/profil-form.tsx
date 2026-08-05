"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Select } from "@/components/ui/select";

const NIVEAUX = ["Débutant", "Intermédiaire", "Avancé"];

const FREQUENCES_ENTRAINEMENT = [
  "Jamais",
  "1 fois par semaine",
  "2 fois par semaine",
  "3 fois par semaine",
  "4 fois par semaine",
  "5 fois ou plus par semaine",
];

const EQUIPEMENTS = [
  "Salle de sport complète",
  "Matériel à la maison (haltères, bancs...)",
  "Élastiques / bandes de résistance uniquement",
  "Poids du corps uniquement",
  "Aucun équipement",
];

const HABITUDES_ALIMENTAIRES = [
  "Repas structurés et équilibrés",
  "Grignotage fréquent / repas irréguliers",
  "Jeûne intermittent",
  "Beaucoup de plats préparés ou fast-food",
  "Déjà suivi par un nutritionniste",
];

const CONSOMMATIONS_CAFE = ["Aucune", "1 tasse par jour", "2-3 tasses par jour", "4 tasses ou plus par jour"];

const CONSOMMATIONS_ALCOOL = [
  "Jamais",
  "Occasionnel (soirées, événements)",
  "1-2 fois par semaine",
  "Régulier (3 fois ou plus par semaine)",
];

const QUALITES_SOMMEIL = [
  "Mauvaise (moins de 5h, sommeil agité)",
  "Moyenne (5-6h, réveils fréquents)",
  "Bonne (7-8h, plutôt réparateur)",
  "Excellente (8h ou plus, réparateur)",
];

const ANTECEDENTS_MEDICAUX = [
  "Douleurs / problèmes de dos",
  "Douleurs / problèmes de genoux",
  "Problèmes d'épaule",
  "Hypertension",
  "Problèmes cardiaques",
  "Diabète",
  "Asthme",
  "Blessure en cours de rééducation",
  "Grossesse / post-partum",
  "Chirurgie récente",
];

type Profil = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
  antecedentsMedicaux?: string | null;
  tailleCm?: number | null;
  age?: number | null;
  morphologie?: string | null;
  frequenceEntrainement?: string | null;
  habitudesAlimentaires?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
};

function parseAntecedents(value?: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export function ProfilForm({ profil }: { profil: Profil }) {
  const router = useRouter();
  const [objectifs, setObjectifs] = useState(profil.objectifs ?? "");
  const [niveau, setNiveau] = useState(profil.niveau ?? "");
  const [equipementDisponible, setEquipementDisponible] = useState(
    profil.equipementDisponible ?? ""
  );
  const [contraintesSante, setContraintesSante] = useState(profil.contraintesSante ?? "");
  const [antecedentsMedicaux, setAntecedentsMedicaux] = useState<string[]>(
    parseAntecedents(profil.antecedentsMedicaux)
  );
  const [tailleCm, setTailleCm] = useState(profil.tailleCm ? String(profil.tailleCm) : "");
  const [age, setAge] = useState(profil.age ? String(profil.age) : "");
  const [morphologie, setMorphologie] = useState(profil.morphologie ?? "");
  const [frequenceEntrainement, setFrequenceEntrainement] = useState(
    profil.frequenceEntrainement ?? ""
  );
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState(
    profil.habitudesAlimentaires ?? ""
  );
  const [consommationCafe, setConsommationCafe] = useState(profil.consommationCafe ?? "");
  const [consommationAlcool, setConsommationAlcool] = useState(profil.consommationAlcool ?? "");
  const [qualiteSommeil, setQualiteSommeil] = useState(profil.qualiteSommeil ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleAntecedent(item: string) {
    setAntecedentsMedicaux((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectifs,
          niveau: niveau || undefined,
          equipementDisponible: equipementDisponible || undefined,
          contraintesSante,
          antecedentsMedicaux: antecedentsMedicaux.length ? antecedentsMedicaux.join(", ") : undefined,
          tailleCm: tailleCm ? Number(tailleCm) : undefined,
          age: age ? Number(age) : undefined,
          morphologie,
          frequenceEntrainement: frequenceEntrainement || undefined,
          habitudesAlimentaires: habitudesAlimentaires || undefined,
          consommationCafe: consommationCafe || undefined,
          consommationAlcool: consommationAlcool || undefined,
          qualiteSommeil: qualiteSommeil || undefined,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SectionLabel>Objectifs & niveau</SectionLabel>
        <Field label="Objectifs">
          <Textarea
            placeholder="ex: prise de muscle, perte de poids, préparation à un objectif sportif..."
            value={objectifs}
            onChange={(e) => setObjectifs(e.target.value)}
          />
        </Field>
        <Field label="Niveau">
          <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
            <option value="">Non renseigné</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fréquence d'entraînement">
          <Select
            value={frequenceEntrainement}
            onChange={(e) => setFrequenceEntrainement(e.target.value)}
          >
            <option value="">Non renseigné</option>
            {FREQUENCES_ENTRAINEMENT.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Équipement disponible">
          <Select value={equipementDisponible} onChange={(e) => setEquipementDisponible(e.target.value)}>
            <option value="">Non renseigné</option>
            {EQUIPEMENTS.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </Select>
        </Field>

        <SectionLabel>Santé & morphologie</SectionLabel>
        <Field label="Taille (cm)">
          <Input
            type="number"
            step="0.1"
            value={tailleCm}
            onChange={(e) => setTailleCm(e.target.value)}
          />
        </Field>
        <Field label="Âge">
          <Input type="number" step="1" value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label="Morphologie">
          <Select value={morphologie} onChange={(e) => setMorphologie(e.target.value)}>
            <option value="">Non renseigné</option>
            <option value="Ectomorphe">Ectomorphe (fine, difficulté à prendre du muscle)</option>
            <option value="Mésomorphe">Mésomorphe (athlétique naturellement)</option>
            <option value="Endomorphe">Endomorphe (prise de masse facile, y compris grasse)</option>
            <option value="Mixte">Mixte / je ne sais pas</option>
          </Select>
        </Field>
        <Field label="Antécédents médicaux (coche tout ce qui s'applique)">
          <div className="flex flex-col gap-1.5 rounded-md border border-graphite-700 bg-graphite-900 p-3">
            {ANTECEDENTS_MEDICAUX.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-graphite-200">
                <input
                  type="checkbox"
                  checked={antecedentsMedicaux.includes(item)}
                  onChange={() => toggleAntecedent(item)}
                />
                {item}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Contraintes de santé (précisions)">
          <Textarea
            placeholder="ex: détails sur une douleur, autre chose non listée ci-dessus..."
            value={contraintesSante}
            onChange={(e) => setContraintesSante(e.target.value)}
          />
        </Field>

        <SectionLabel>Hygiène de vie</SectionLabel>
        <Field label="Habitudes alimentaires">
          <Select value={habitudesAlimentaires} onChange={(e) => setHabitudesAlimentaires(e.target.value)}>
            <option value="">Non renseigné</option>
            {HABITUDES_ALIMENTAIRES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consommation de café">
          <Select value={consommationCafe} onChange={(e) => setConsommationCafe(e.target.value)}>
            <option value="">Non renseigné</option>
            {CONSOMMATIONS_CAFE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consommation d'alcool">
          <Select value={consommationAlcool} onChange={(e) => setConsommationAlcool(e.target.value)}>
            <option value="">Non renseigné</option>
            {CONSOMMATIONS_ALCOOL.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Qualité du sommeil">
          <Select value={qualiteSommeil} onChange={(e) => setQualiteSommeil(e.target.value)}>
            <option value="">Non renseigné</option>
            {QUALITES_SOMMEIL.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && !error && <p className="text-sm text-laiton-400">Profil enregistré.</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer mon profil"}
        </Button>
      </form>
    </Card>
  );
}
