"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

type Profil = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
};

export function ProfilForm({ profil }: { profil: Profil }) {
  const router = useRouter();
  const [objectifs, setObjectifs] = useState(profil.objectifs ?? "");
  const [niveau, setNiveau] = useState(profil.niveau ?? "");
  const [equipementDisponible, setEquipementDisponible] = useState(
    profil.equipementDisponible ?? ""
  );
  const [contraintesSante, setContraintesSante] = useState(profil.contraintesSante ?? "");
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
        body: JSON.stringify({ objectifs, niveau, equipementDisponible, contraintesSante }),
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
        <Field label="Équipement disponible">
          <Textarea
            placeholder="ex: salle de sport complète, haltères à la maison, aucun matériel..."
            value={equipementDisponible}
            onChange={(e) => setEquipementDisponible(e.target.value)}
          />
        </Field>
        <Field label="Contraintes de santé">
          <Textarea
            placeholder="ex: aucune connue, douleur au genou, hypertension..."
            value={contraintesSante}
            onChange={(e) => setContraintesSante(e.target.value)}
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
