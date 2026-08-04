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

type Profil = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
  tailleCm?: number | null;
  morphologie?: string | null;
  entrainementActuel?: string | null;
  habitudesAlimentaires?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
};

export function ProfilForm({ profil }: { profil: Profil }) {
  const router = useRouter();
  const [objectifs, setObjectifs] = useState(profil.objectifs ?? "");
  const [niveau, setNiveau] = useState(profil.niveau ?? "");
  const [equipementDisponible, setEquipementDisponible] = useState(
    profil.equipementDisponible ?? ""
  );
  const [contraintesSante, setContraintesSante] = useState(profil.contraintesSante ?? "");
  const [tailleCm, setTailleCm] = useState(profil.tailleCm ? String(profil.tailleCm) : "");
  const [morphologie, setMorphologie] = useState(profil.morphologie ?? "");
  const [entrainementActuel, setEntrainementActuel] = useState(profil.entrainementActuel ?? "");
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState(
    profil.habitudesAlimentaires ?? ""
  );
  const [consommationCafe, setConsommationCafe] = useState(profil.consommationCafe ?? "");
  const [consommationAlcool, setConsommationAlcool] = useState(profil.consommationAlcool ?? "");
  const [qualiteSommeil, setQualiteSommeil] = useState(profil.qualiteSommeil ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
          niveau,
          equipementDisponible,
          contraintesSante,
          tailleCm: tailleCm ? Number(tailleCm) : undefined,
          morphologie,
          entrainementActuel,
          habitudesAlimentaires,
          consommationCafe,
          consommationAlcool,
          qualiteSommeil,
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
          <Input
            placeholder="ex: débutant, intermédiaire, avancé"
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
          />
        </Field>
        <Field label="Entraînement actuel">
          <Textarea
            placeholder="ex: 2 séances de musculation par semaine, aucun sport actuellement..."
            value={entrainementActuel}
            onChange={(e) => setEntrainementActuel(e.target.value)}
          />
        </Field>
        <Field label="Équipement disponible">
          <Textarea
            placeholder="ex: salle de sport complète, haltères à la maison, aucun matériel..."
            value={equipementDisponible}
            onChange={(e) => setEquipementDisponible(e.target.value)}
          />
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
        <Field label="Morphologie">
          <Select value={morphologie} onChange={(e) => setMorphologie(e.target.value)}>
            <option value="">Non renseigné</option>
            <option value="Ectomorphe">Ectomorphe (fine, difficulté à prendre du muscle)</option>
            <option value="Mésomorphe">Mésomorphe (athlétique naturellement)</option>
            <option value="Endomorphe">Endomorphe (prise de masse facile, y compris grasse)</option>
            <option value="Mixte">Mixte / je ne sais pas</option>
          </Select>
        </Field>
        <Field label="Contraintes de santé">
          <Textarea
            placeholder="ex: aucune connue, douleur au genou, hypertension..."
            value={contraintesSante}
            onChange={(e) => setContraintesSante(e.target.value)}
          />
        </Field>

        <SectionLabel>Hygiène de vie</SectionLabel>
        <Field label="Habitudes alimentaires">
          <Textarea
            placeholder="ex: 3 repas/jour, peu de fibres, grignotage le soir..."
            value={habitudesAlimentaires}
            onChange={(e) => setHabitudesAlimentaires(e.target.value)}
          />
        </Field>
        <Field label="Consommation de café">
          <Input
            placeholder="ex: 2 tasses par jour"
            value={consommationCafe}
            onChange={(e) => setConsommationCafe(e.target.value)}
          />
        </Field>
        <Field label="Consommation d'alcool">
          <Input
            placeholder="ex: occasionnel, weekends uniquement"
            value={consommationAlcool}
            onChange={(e) => setConsommationAlcool(e.target.value)}
          />
        </Field>
        <Field label="Qualité du sommeil">
          <Input
            placeholder="ex: ~6h/nuit, sommeil léger"
            value={qualiteSommeil}
            onChange={(e) => setQualiteSommeil(e.target.value)}
          />
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
