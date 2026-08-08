// Logomark COAI. Arc plein doré (la main du coach, ouverte) qui entoure un
// œil bleu (iris + pupille + reflet) — la vigilance/l'attention du coach —
// lisible à toute taille, y compris en favicon. La variante "detailed"
// (anneau IA pointillé en plus) est réservée aux grands formats (brand
// book, hero) où le détail reste visible.
export function CoaiMark({
  size = 32,
  variant = "simple",
  className,
}: {
  size?: number;
  variant?: "simple" | "detailed";
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="60"
        cy="60"
        r="42"
        stroke="#c9a262"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="228 36"
        transform="rotate(-90 60 60)"
      />
      {variant === "detailed" && (
        <circle cx="60" cy="60" r="24" stroke="#6b7078" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3.2 3.6" />
      )}
      <circle cx="60" cy="60" r="11" fill="#3d7a99" />
      <circle cx="60" cy="60" r="5" fill="#0d1b22" />
      <circle cx="57" cy="57" r="1.8" fill="#eaf4f8" />
    </svg>
  );
}
