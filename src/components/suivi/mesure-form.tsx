"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

export function MesureForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [poidsKg, setPoidsKg] = useState("");
  const [tourTailleCm, setTourTailleCm] = useState("");
  const [masseGrassePourcent, setMasseGrassePourcent] = useState("");
  const [masseMusculaireKg, setMasseMusculaireKg] = useState("");
  const [frequenceCardiaqueReposBpm, setFrequenceCardiaqueReposBpm] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let photoPath: string | undefined;

      if (photo) {
        const optimized = await compressProgressPhoto(photo);
        const formData = new FormData();
        formData.append("file", optimized.file);
        const photoRes = await fetch("/api/mesures/photo", { method: "POST", body: formData });
        const photoData = await photoRes.json();
        if (!photoRes.ok) throw new Error(photoData.error ?? "Échec de l'envoi de la photo.");
        photoPath = photoData.path;
      }

      const res = await fetch("/api/mesures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          poidsKg: poidsKg ? Number(poidsKg) : undefined,
          tourTailleCm: tourTailleCm ? Number(tourTailleCm) : undefined,
          masseGrassePourcent: masseGrassePourcent ? Number(masseGrassePourcent) : undefined,
          masseMusculaireKg: masseMusculaireKg ? Number(masseMusculaireKg) : undefined,
          frequenceCardiaqueReposBpm: frequenceCardiaqueReposBpm
            ? Number(frequenceCardiaqueReposBpm)
            : undefined,
          photoPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'ajout.");
      setPoidsKg("");
      setTourTailleCm("");
      setMasseGrassePourcent("");
      setMasseMusculaireKg("");
      setFrequenceCardiaqueReposBpm("");
      setPhoto(null);
      setPhotoInfo(null);
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
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Poids (kg)">
          <Input
            type="number"
            step="0.1"
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
          />
        </Field>
        <Field label="Tour de taille (cm)">
          <Input
            type="number"
            step="0.1"
            value={tourTailleCm}
            onChange={(e) => setTourTailleCm(e.target.value)}
          />
        </Field>

        <SectionLabel>Composition corporelle (type InBody, optionnel)</SectionLabel>
        <Field label="Masse grasse (%)">
          <Input
            type="number"
            step="0.1"
            value={masseGrassePourcent}
            onChange={(e) => setMasseGrassePourcent(e.target.value)}
          />
        </Field>
        <Field label="Masse musculaire (kg)">
          <Input
            type="number"
            step="0.1"
            value={masseMusculaireKg}
            onChange={(e) => setMasseMusculaireKg(e.target.value)}
          />
        </Field>
        <Field label="Fréquence cardiaque de repos (bpm)">
          <Input
            type="number"
            value={frequenceCardiaqueReposBpm}
            onChange={(e) => setFrequenceCardiaqueReposBpm(e.target.value)}
          />
        </Field>

        <Field label="Photo de progression (optionnel)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setPhoto(selected);
              setPhotoInfo(selected ? "La photo sera optimisée automatiquement avant l’envoi." : null);
            }}
            className="text-sm text-graphite-300 file:mr-3 file:rounded-md file:border-0 file:bg-laiton-500 file:px-3 file:py-1.5 file:text-graphite-950 file:transition hover:file:bg-laiton-400"
          />
        </Field>
        {photoInfo && <p className="-mt-2 text-xs text-graphite-400">{photoInfo}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout…" : "Ajouter la mesure"}
        </Button>
      </form>
    </Card>
  );
}
