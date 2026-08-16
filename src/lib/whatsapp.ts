// Numéro public de réservation d'Anthony. La variable Vercel permet de le
// remplacer sans modifier le code ; ce numéro garantit que les CTA VIP et
// Entreprise restent fonctionnels même si la variable n'est pas renseignée.
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_COACH_NUMBER?.replace(/\D/g, "") || "33678989640";

// Construit un lien wa.me pré-rempli vers le numéro WhatsApp du coach.
// Retourne null si le numéro n'est pas configuré (le composant appelant
// doit alors masquer le CTA ou proposer une alternative).
export function buildWhatsAppLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
