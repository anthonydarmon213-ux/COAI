"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Note = { id: string; content: string; createdAt: string; authorName: string };

export function CoachNotes({ clientId, notes }: { clientId: string; notes: Note[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote() {
    if (!content.trim()) return;
    setLoading(true); setError(null);
    const response = await fetch(`/api/admin/clients/${clientId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    if (response.ok) { setContent(""); router.refresh(); } else setError("Impossible d'enregistrer la note.");
    setLoading(false);
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm("Supprimer cette note interne ?")) return;
    const response = await fetch(`/api/admin/clients/${clientId}/notes/${noteId}`, { method: "DELETE" });
    if (response.ok) router.refresh(); else setError("Impossible de supprimer la note.");
  }

  async function editNote(note: Note) {
    const next = window.prompt("Modifier la note interne", note.content)?.trim();
    if (!next || next === note.content) return;
    const response = await fetch(`/api/admin/clients/${clientId}/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: next }) });
    if (response.ok) router.refresh(); else setError("Impossible de modifier la note.");
  }

  return <div className="flex flex-col gap-3">
    <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Décision, point convenu, prochaine action…" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-graphite-600 focus:border-laiton-400/40" />
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-graphite-600">Visible uniquement dans l’espace coach.</span><Button onClick={addNote} disabled={loading || !content.trim()} size="compact">{loading ? "Enregistrement…" : "Ajouter la note"}</Button></div>
    {error && <p className="text-xs text-red-400">{error}</p>}
    {notes.length === 0 ? <p className="border-t border-white/[0.06] pt-3 text-sm text-graphite-500">Aucune note interne.</p> : <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">{notes.map((note) => <div key={note.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="whitespace-pre-wrap text-sm leading-6 text-graphite-200">{note.content}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-graphite-500"><span>{note.authorName} · {new Date(note.createdAt).toLocaleString("fr-FR")}</span><span className="flex gap-3"><button type="button" onClick={() => editNote(note)} className="hover:text-laiton-300">Modifier</button><button type="button" onClick={() => deleteNote(note.id)} className="hover:text-red-300">Supprimer</button></span></div></div>)}</div>}
  </div>;
}
