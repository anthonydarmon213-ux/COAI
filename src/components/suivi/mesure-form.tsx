"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocalDateInput } from "@/lib/suivi/use-local-date-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";
import { mesureBodySchema, mesureValidationErrors, type MesureFieldErrors } from "@/lib/suivi/mesure-validation";

export function MesureForm() {
  const router = useRouter();
  const [date, setDate] = useLocalDateInput();
  const [poidsKg, setPoidsKg] = useState("");
  const [tourTailleCm, setTourTailleCm] = useState("");
  const [masseGrassePourcent, setMasseGrassePourcent] = useState("");
  const [masseMusculaireKg, setMasseMusculaireKg] = useState("");
  const [frequenceCardiaqueReposBpm, setFrequenceCardiaqueReposBpm] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<MesureFieldErrors>({});
  const submitting = useRef(false);
  const photoInput = useRef<HTMLInputElement>(null);

  function showErrors(form: HTMLFormElement, fields: MesureFieldErrors, message: string) {
    setFieldErrors(fields);
    setError(message);
    const name = Object.keys(fields)[0];
    const input = form.elements.namedItem(name || "poidsKg");
    if (input instanceof HTMLInputElement) {
      const details = input.closest("details");
      if (details) details.open = true;
      input.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    const form = e.currentTarget as HTMLFormElement;
    const values = {
      date,
      poidsKg: poidsKg ? Number(poidsKg) : undefined,
      tourTailleCm: tourTailleCm ? Number(tourTailleCm) : undefined,
      masseGrassePourcent: masseGrassePourcent ? Number(masseGrassePourcent) : undefined,
      masseMusculaireKg: masseMusculaireKg ? Number(masseMusculaireKg) : undefined,
      frequenceCardiaqueReposBpm: frequenceCardiaqueReposBpm ? Number(frequenceCardiaqueReposBpm) : undefined,
    };
    // Local presence marker only; the upload response supplies the real path below.
    const parsed = mesureBodySchema.safeParse({ ...values, photoPath: photo ? "selection-locale" : undefined });
    if (!parsed.success) {
      const validation = mesureValidationErrors(parsed.error);
      showErrors(form, validation.fields, validation.message);
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError(null);
    setFieldErrors({});
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
          ...values,
          photoPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showErrors(form, data.fieldErrors ?? {}, typeof data.error === "string" ? data.error : "Impossible d’enregistrer. Réessaie dans un instant.");
        return;
      }
      setPoidsKg("");
      setTourTailleCm("");
      setMasseGrassePourcent("");
      setMasseMusculaireKg("");
      setFrequenceCardiaqueReposBpm("");
      setPhoto(null);
      setPhotoInfo(null);
      if (photoInput.current) photoInput.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof TypeError ? "Connexion interrompue. Tes valeurs sont conservées : réessaie dans un instant." : err instanceof Error ? err.message : "Impossible d’enregistrer. Réessaie dans un instant.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <Card className="coai-action-card">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <SectionLabel>Mise à jour rapide</SectionLabel>
          <p className="mt-2 text-sm leading-6 text-graphite-300">Le poids et le tour de taille suffisent pour suivre la tendance.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" error={fieldErrors.date}>
            <Input name="date" aria-invalid={Boolean(fieldErrors.date)} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Poids (kg)" error={fieldErrors.poidsKg}>
            <Input name="poidsKg" aria-invalid={Boolean(fieldErrors.poidsKg)} type="number" step="0.1" inputMode="decimal" value={poidsKg} onChange={(e) => setPoidsKg(e.target.value)} />
          </Field>
          <Field label="Tour de taille (cm)" error={fieldErrors.tourTailleCm}>
            <Input name="tourTailleCm" aria-invalid={Boolean(fieldErrors.tourTailleCm)} type="number" step="0.1" inputMode="decimal" value={tourTailleCm} onChange={(e) => setTourTailleCm(e.target.value)} />
          </Field>
        </div>

        <details className="coai-advanced-fields">
          <summary>Ajouter une analyse complète ou une photo</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Masse grasse (%)" error={fieldErrors.masseGrassePourcent}>
              <Input name="masseGrassePourcent" aria-invalid={Boolean(fieldErrors.masseGrassePourcent)} type="number" step="0.1" inputMode="decimal" value={masseGrassePourcent} onChange={(e) => setMasseGrassePourcent(e.target.value)} />
            </Field>
            <Field label="Masse musculaire (kg)" error={fieldErrors.masseMusculaireKg}>
              <Input name="masseMusculaireKg" aria-invalid={Boolean(fieldErrors.masseMusculaireKg)} type="number" step="0.1" inputMode="decimal" value={masseMusculaireKg} onChange={(e) => setMasseMusculaireKg(e.target.value)} />
            </Field>
            <Field label="Fréquence cardiaque au repos" error={fieldErrors.frequenceCardiaqueReposBpm}>
              <Input name="frequenceCardiaqueReposBpm" aria-invalid={Boolean(fieldErrors.frequenceCardiaqueReposBpm)} type="number" inputMode="numeric" placeholder="bpm" value={frequenceCardiaqueReposBpm} onChange={(e) => setFrequenceCardiaqueReposBpm(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Photo de progression">
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setPhoto(selected);
                  setPhotoInfo(selected ? "La photo sera optimisée automatiquement avant l’envoi." : null);
                }}
                className="text-sm text-graphite-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-graphite-950 file:transition hover:file:bg-cyan-200"
              />
            </Field>
            {photoInfo && <p className="mt-2 text-xs text-graphite-400">{photoInfo}</p>}
          </div>
        </details>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:self-start">
          {loading ? "Ajout…" : "Ajouter la mesure"}
        </Button>
      </form>
    </Card>
  );
}
