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

function ToggleChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            aria-pressed={isSelected}
            className={
              isSelected
                ? "rounded-full border border-laiton-400/40 bg-laiton-400/[0.12] px-3 py-1.5 text-sm text-laiton-300 transition"
                : "rounded-full border border-graphite-700 bg-graphite-900 px-3 py-1.5 text-sm text-graphite-300 transition hover:border-graphite-600 hover:text-white"
            }
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

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
  "Élastiques / bandes de résistance",
  "Kettlebell",
  "TRX / sangles de suspension",
  "Poids du corps uniquement",
  "Aucun équipement",
];

// Alignés sur diagnostic-quiz.tsx (Phase 5, 11/08/2026).
const LIEUX = ["Salle de sport", "À la maison", "En extérieur", "Ça dépend des jours"];
const DUREES = ["30 minutes", "45 minutes", "1 heure", "1h30 ou plus"];
const DUREE_EN_MINUTES: Record<string, number> = {
  "30 minutes": 30,
  "45 minutes": 45,
  "1 heure": 60,
  "1h30 ou plus": 90,
};
const MINUTES_EN_DUREE: Record<number, string> = {
  30: "30 minutes",
  45: "45 minutes",
  60: "1 heure",
  90: "1h30 ou plus",
};

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

const SPORTS_PRATIQUES = [
  "Musculation / Fitness",
  "Course à pied",
  "Football",
  "Basketball",
  "Natation",
  "Cyclisme",
  "Boxe / Arts martiaux",
  "Tennis / Sports de raquette",
  "Yoga / Pilates",
  "CrossFit",
  "Hyrox",
  "Randonnée",
  "Breathwork / Méditation",
  "Aucun actuellement",
];

const REPAS_PAR_JOUR = [
  "1 repas par jour",
  "2 repas par jour",
  "3 repas par jour",
  "4 repas par jour",
  "5 repas ou plus par jour",
  "Repas irréguliers / pas de structure fixe",
];

const HYDRATATIONS = [
  "Moins d'1L par jour",
  "1 à 1,5L par jour",
  "1,5 à 2L par jour",
  "2L ou plus par jour",
];

const ANTECEDENTS_MEDICAUX = [
  "Scoliose",
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
  "Apnée du sommeil",
  "Autre",
];

type Profil = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  lieuEntrainement?: string | null;
  dureeSeanceMinutes?: number | null;
  contraintesSante?: string | null;
  antecedentsMedicaux?: string | null;
  tailleCm?: number | null;
  poidsKg?: number | null;
  age?: number | null;
  sexe?: string | null;
  morphologie?: string | null;
  frequenceEntrainement?: string | null;
  sportsPratiques?: string | null;
  habitudesAlimentaires?: string | null;
  allergiesAlimentaires?: string | null;
  repasParJour?: string | null;
  hydratation?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
  pasMoyenParJour?: number | null;
  frequenceCardiaqueRepos?: number | null;
  sommeilMoyenHeures?: number | null;
  vo2Max?: number | null;
  caloriesMoyennesParJour?: number | null;
  hrv?: number | null;
  resumeMontre?: string | null;
  derniereAnalyseMontre?: string | Date | null;
  morphologieDetectee?: string | null;
  observationsPosture?: string | null;
};

function parseMultiSelect(value?: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export function ProfilForm({ profil }: { profil: Profil }) {
  const router = useRouter();
  const [objectifs, setObjectifs] = useState(profil.objectifs ?? "");
  const [niveau, setNiveau] = useState(profil.niveau ?? "");
  const [equipementDisponible, setEquipementDisponible] = useState<string[]>(
    parseMultiSelect(profil.equipementDisponible)
  );
  const [lieuEntrainement, setLieuEntrainement] = useState(profil.lieuEntrainement ?? "");
  const [dureeSeance, setDureeSeance] = useState(
    profil.dureeSeanceMinutes ? MINUTES_EN_DUREE[profil.dureeSeanceMinutes] ?? "" : ""
  );
  const [contraintesSante, setContraintesSante] = useState(profil.contraintesSante ?? "");
  const [antecedentsMedicaux, setAntecedentsMedicaux] = useState<string[]>(
    parseMultiSelect(profil.antecedentsMedicaux)
  );
  const [tailleCm, setTailleCm] = useState(profil.tailleCm ? String(profil.tailleCm) : "");
  const [poidsKg, setPoidsKg] = useState(profil.poidsKg ? String(profil.poidsKg) : "");
  const [age, setAge] = useState(profil.age ? String(profil.age) : "");
  const [sexe, setSexe] = useState(profil.sexe ?? "");
  const [morphologie, setMorphologie] = useState(profil.morphologie ?? "");
  const [frequenceEntrainement, setFrequenceEntrainement] = useState(
    profil.frequenceEntrainement ?? ""
  );
  const [sportsPratiques, setSportsPratiques] = useState<string[]>(
    parseMultiSelect(profil.sportsPratiques)
  );
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState(
    profil.habitudesAlimentaires ?? ""
  );
  const [allergiesAlimentaires, setAllergiesAlimentaires] = useState(
    profil.allergiesAlimentaires ?? ""
  );
  const [repasParJour, setRepasParJour] = useState(profil.repasParJour ?? "");
  const [hydratation, setHydratation] = useState(profil.hydratation ?? "");
  const [consommationCafe, setConsommationCafe] = useState(profil.consommationCafe ?? "");
  const [consommationAlcool, setConsommationAlcool] = useState(profil.consommationAlcool ?? "");
  const [qualiteSommeil, setQualiteSommeil] = useState(profil.qualiteSommeil ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [montreData, setMontreData] = useState({
    pasMoyenParJour: profil.pasMoyenParJour ?? null,
    frequenceCardiaqueRepos: profil.frequenceCardiaqueRepos ?? null,
    sommeilMoyenHeures: profil.sommeilMoyenHeures ?? null,
    vo2Max: profil.vo2Max ?? null,
    caloriesMoyennesParJour: profil.caloriesMoyennesParJour ?? null,
    hrv: profil.hrv ?? null,
    resumeMontre: profil.resumeMontre ?? null,
  });
  const [montreLoading, setMontreLoading] = useState(false);
  const [montreError, setMontreError] = useState<string | null>(null);

  async function handleAnalyserMontre(file: File) {
    setMontreLoading(true);
    setMontreError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profil/montre", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse du screenshot.");
      setMontreData({
        pasMoyenParJour: data.pasMoyenParJour ?? null,
        frequenceCardiaqueRepos: data.frequenceCardiaqueRepos ?? null,
        sommeilMoyenHeures: data.sommeilMoyenHeures ?? null,
        vo2Max: data.vo2Max ?? null,
        caloriesMoyennesParJour: data.caloriesMoyennesParJour ?? null,
        hrv: data.hrv ?? null,
        resumeMontre: data.resumeMontre ?? null,
      });
    } catch (err) {
      setMontreError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setMontreLoading(false);
    }
  }

  const [photoData, setPhotoData] = useState({
    morphologieDetectee: profil.morphologieDetectee ?? null,
    observationsPosture: profil.observationsPosture ?? null,
  });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoRejected, setPhotoRejected] = useState<string | null>(null);

  async function handleAnalyserPhoto(file: File) {
    setPhotoLoading(true);
    setPhotoError(null);
    setPhotoRejected(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profil/photo-morphologie", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse de la photo.");
      if (!data.analysable) {
        setPhotoRejected(data.resume ?? "Cette photo n'a pas pu être analysée.");
        return;
      }
      setPhotoData({
        morphologieDetectee: data.morphologieDetectee ?? null,
        observationsPosture: data.observationsPosture ?? null,
      });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setPhotoLoading(false);
    }
  }

  function toggleAntecedent(item: string) {
    setAntecedentsMedicaux((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  }

  function toggleSport(item: string) {
    setSportsPratiques((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  }

  function toggleEquipement(item: string) {
    setEquipementDisponible((prev) =>
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
          equipementDisponible: equipementDisponible.length ? equipementDisponible.join(", ") : undefined,
          lieuEntrainement: lieuEntrainement || undefined,
          dureeSeanceMinutes: dureeSeance ? DUREE_EN_MINUTES[dureeSeance] : undefined,
          contraintesSante,
          antecedentsMedicaux: antecedentsMedicaux.length ? antecedentsMedicaux.join(", ") : undefined,
          tailleCm: tailleCm ? Number(tailleCm) : undefined,
          poidsKg: poidsKg ? Number(poidsKg) : undefined,
          age: age ? Number(age) : undefined,
          sexe: sexe || undefined,
          morphologie,
          frequenceEntrainement: frequenceEntrainement || undefined,
          sportsPratiques: sportsPratiques.length ? sportsPratiques.join(", ") : undefined,
          habitudesAlimentaires: habitudesAlimentaires || undefined,
          allergiesAlimentaires: allergiesAlimentaires || undefined,
          repasParJour: repasParJour || undefined,
          hydratation: hydratation || undefined,
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
        <SectionLabel>Bracelet connecté</SectionLabel>
        <div className="flex flex-col gap-3 rounded-lg border border-graphite-800 bg-graphite-900/40 p-4">
          <p className="text-sm text-graphite-300">
            Envoie un screenshot de ton bracelet ou app santé (Apple Watch, Garmin, Fitbit, Samsung
            Health...) — on en extrait automatiquement pas, fréquence cardiaque, sommeil, VO2 max
            et calories pour affiner ton programme.
          </p>
          <label className="w-fit">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={montreLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAnalyserMontre(file);
                e.target.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-laiton-400/40 bg-laiton-400/[0.08] px-4 py-2 text-sm font-medium text-laiton-300 transition hover:bg-laiton-400/[0.14]">
              {montreLoading ? "Analyse en cours…" : "Analyser un screenshot"}
            </span>
          </label>
          {montreError && <p className="text-sm text-red-400">{montreError}</p>}
          {(montreData.resumeMontre ||
            montreData.pasMoyenParJour ||
            montreData.frequenceCardiaqueRepos ||
            montreData.sommeilMoyenHeures ||
            montreData.vo2Max ||
            montreData.caloriesMoyennesParJour ||
            montreData.hrv) && (
            <div className="flex flex-col gap-1.5 text-sm text-graphite-300">
              {montreData.pasMoyenParJour != null && (
                <p>Pas moyen/jour : {montreData.pasMoyenParJour.toLocaleString("fr-FR")}</p>
              )}
              {montreData.frequenceCardiaqueRepos != null && (
                <p>Fréquence cardiaque de repos : {montreData.frequenceCardiaqueRepos} bpm</p>
              )}
              {montreData.sommeilMoyenHeures != null && (
                <p>Sommeil moyen : {montreData.sommeilMoyenHeures} h</p>
              )}
              {montreData.vo2Max != null && <p>VO2 max : {montreData.vo2Max}</p>}
              {montreData.caloriesMoyennesParJour != null && (
                <p>Calories moyennes/jour : {montreData.caloriesMoyennesParJour}</p>
              )}
              {montreData.hrv != null && <p>HRV : {montreData.hrv} ms</p>}
              {montreData.resumeMontre && (
                <p className="italic text-graphite-400">{montreData.resumeMontre}</p>
              )}
            </div>
          )}
        </div>

        <SectionLabel>Photo morphologique</SectionLabel>
        <div className="flex flex-col gap-3 rounded-lg border border-graphite-800 bg-graphite-900/40 p-4">
          <p className="text-sm text-graphite-300">
            Envoie une photo de toi en tenue de sport (legging, short, brassière, débardeur...),
            de face, en pied — on en extrait des observations de posture et de morphologie pour
            affiner ton programme d&apos;entraînement. Photo jamais conservée, uniquement les
            observations.
          </p>
          <label className="w-fit">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={photoLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAnalyserPhoto(file);
                e.target.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-laiton-400/40 bg-laiton-400/[0.08] px-4 py-2 text-sm font-medium text-laiton-300 transition hover:bg-laiton-400/[0.14]">
              {photoLoading ? "Analyse en cours…" : "Analyser une photo"}
            </span>
          </label>
          {photoError && <p className="text-sm text-red-400">{photoError}</p>}
          {photoRejected && <p className="text-sm text-graphite-400">{photoRejected}</p>}
          {(photoData.morphologieDetectee || photoData.observationsPosture) && (
            <div className="flex flex-col gap-1.5 text-sm text-graphite-300">
              {photoData.morphologieDetectee && <p>Morphologie détectée : {photoData.morphologieDetectee}</p>}
              {photoData.observationsPosture && (
                <p className="italic text-graphite-400">{photoData.observationsPosture}</p>
              )}
            </div>
          )}
        </div>

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
        <Field label="Sport(s) pratiqué(s) (coche tout ce qui s'applique)">
          <ToggleChips options={SPORTS_PRATIQUES} selected={sportsPratiques} onToggle={toggleSport} />
        </Field>
        <Field label="Équipement disponible (coche tout ce qui s'applique)">
          <ToggleChips options={EQUIPEMENTS} selected={equipementDisponible} onToggle={toggleEquipement} />
        </Field>
        <Field label="Lieu d'entraînement habituel">
          <Select value={lieuEntrainement} onChange={(e) => setLieuEntrainement(e.target.value)}>
            <option value="">Non renseigné</option>
            {LIEUX.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Durée de séance visée">
          <Select value={dureeSeance} onChange={(e) => setDureeSeance(e.target.value)}>
            <option value="">Non renseignée</option>
            {DUREES.map((d) => (
              <option key={d} value={d}>
                {d}
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
        <Field label="Poids (kg)">
          <Input
            type="number"
            step="0.1"
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
          />
        </Field>
        <Field label="Âge">
          <Input type="number" step="1" value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label="Sexe (optionnel)">
          <Select value={sexe} onChange={(e) => setSexe(e.target.value)}>
            <option value="">Non renseigné</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
            <option value="Préfère ne pas dire">Préfère ne pas dire</option>
          </Select>
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
        <Field label="Pathologies (coche tout ce qui s'applique)">
          <ToggleChips
            options={ANTECEDENTS_MEDICAUX}
            selected={antecedentsMedicaux}
            onToggle={toggleAntecedent}
          />
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
        <Field label="Allergies, intolérances ou régime particulier">
          <Textarea
            placeholder="ex: allergie aux arachides, intolérance au lactose, végétarien, sans gluten..."
            value={allergiesAlimentaires}
            onChange={(e) => setAllergiesAlimentaires(e.target.value)}
          />
        </Field>
        <Field label="Repas par jour">
          <Select value={repasParJour} onChange={(e) => setRepasParJour(e.target.value)}>
            <option value="">Non renseigné</option>
            {REPAS_PAR_JOUR.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hydratation">
          <Select value={hydratation} onChange={(e) => setHydratation(e.target.value)}>
            <option value="">Non renseigné</option>
            {HYDRATATIONS.map((h) => (
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
