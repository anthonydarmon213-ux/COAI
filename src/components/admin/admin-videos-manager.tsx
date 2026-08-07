"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";

type Video = {
  id: string;
  titre: string;
  description: string | null;
  youtubeId: string;
  categorie: string | null;
};

export function AdminVideosManager({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lien, setLien] = useState("");
  const [categorie, setCategorie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, description, lien, categorie }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Échec de l'ajout.");
      setTitre("");
      setDescription("");
      setLien("");
      setCategorie("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette vidéo de la bibliothèque ?")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <Field label="Titre">
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} required />
          </Field>
          <Field label="Lien YouTube (non répertorié)">
            <Input
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="https://youtu.be/..."
              required
            />
          </Field>
          <Field label="Catégorie (optionnel)">
            <Input
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              placeholder="Yoga, Mobilité, Respiration…"
            />
          </Field>
          <Field label="Description (optionnel)">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Ajout…" : "Ajouter la vidéo"}
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {videos.length === 0 && (
          <p className="text-sm text-graphite-400">Aucune vidéo pour le moment.</p>
        )}
        {videos.map((video) => (
          <Card key={video.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-graphite-50">{video.titre}</p>
                {video.categorie && <p className="text-xs text-laiton-400">{video.categorie}</p>}
              </div>
              <button
                onClick={() => handleDelete(video.id)}
                className="shrink-0 text-xs text-red-400 underline hover:text-red-300"
              >
                Supprimer
              </button>
            </div>
            {video.description && <p className="text-sm text-graphite-400">{video.description}</p>}
            <p className="font-mono text-xs text-graphite-600">ID YouTube : {video.youtubeId}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
