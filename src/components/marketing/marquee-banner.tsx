// Bandeau déroulant (16/08/2026, demande Anthony : "ça attire l'œil, ça met
// de l'animation"). Contenu dupliqué une fois pour boucler sans à-coup (la
// piste translate exactement -50%, cf. .animate-marquee dans globals.css).
// Sous prefers-reduced-motion, .animate-marquee ne joue pas : la piste reste
// simplement fixe, avec le premier passage des items visible.
const ITEMS = [
  "Algorithme construit sur 17 ans de coaching terrain",
  "Diagnostic express personnalisé en moins de 2 minutes",
  "Coach diplômé d'État disponible si besoin",
  "Entraînement, nutrition et récupération réunis",
  "Programme généré en quelques secondes",
];

export function MarqueeBanner() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="coai-marquee py-3" aria-hidden="true">
      <div className="coai-marquee-track animate-marquee">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap px-6 text-xs font-semibold uppercase tracking-[0.14em] text-laiton-200"
          >
            <span className="h-1 w-1 rounded-full bg-laiton-400" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
