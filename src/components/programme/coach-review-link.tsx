import { buildWhatsAppLink } from "@/lib/whatsapp";

// Ouvre une demande destinée à Anthony, pas le chat IA.
// Le message reste à envoyer par le client dans WhatsApp.
export function CoachReviewLink() {
  const href = buildWhatsAppLink("Bonjour Anthony, je souhaite une relecture de mon programme COAI ou de mon profil avant de commencer.");
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center rounded-xl border border-laiton-400/40 px-4 py-2 text-sm font-semibold text-laiton-300 hover:bg-laiton-400/10">
      Demander une relecture à Anthony →
    </a>
  );
}
