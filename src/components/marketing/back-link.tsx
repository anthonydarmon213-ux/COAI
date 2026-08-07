"use client";

import { useRouter } from "next/navigation";

// Retour à la page précédente (navigateur), sans dépendre d'une destination
// fixe (ex: /dashboard) ni d'une vérification de session — ramène
// exactement là d'où l'utilisateur vient (ex: /programme), sans risque de
// donner l'impression d'être déconnecté.
export function BackLink() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-graphite-400 transition hover:text-white"
    >
      ← Retour
    </button>
  );
}
