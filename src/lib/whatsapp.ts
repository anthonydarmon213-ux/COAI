const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_COACH_NUMBER;

// Construit un lien wa.me pré-rempli vers le numéro WhatsApp du coach.
// Retourne null si le numéro n'est pas configuré (le composant appelant
// doit alors masquer le CTA ou proposer une alternative).
export function buildWhatsAppLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
