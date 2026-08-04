const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_COACH_NUMBER;

const MESSAGE =
  "Bonjour Anthony, je suis sur mon espace Holos et j'aimerais échanger en visio sur mon accompagnement.";

export function CoachingVisioCta() {
  if (!WHATSAPP_NUMBER) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5 transition hover:border-laiton-500"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        Coaching humain · Visio
      </span>
      <p className="text-sm text-graphite-200">
        Un besoin plus poussé que ce que le programme couvre ? Échange en visio directement avec
        Anthony Darmon.
      </p>
      <span className="mt-1 text-sm font-medium text-laiton-300 group-hover:text-laiton-200">
        Réserver un échange sur WhatsApp →
      </span>
    </a>
  );
}
