// Halo animé léger (CSS/SVG, pas de WebGL) évoquant l'IA en fond du hero.
// Respecte prefers-reduced-motion via les classes définies dans globals.css.
export function HeroOrb() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
      <div className="animate-pulse-glow absolute h-72 w-72 rounded-full bg-laiton-400/10 blur-3xl sm:h-96 sm:w-96" />
      <svg viewBox="0 0 400 400" className="animate-spin-slow h-[26rem] w-[26rem] max-w-none opacity-70 sm:h-[34rem] sm:w-[34rem]">
        <circle cx="200" cy="200" r="180" fill="none" stroke="rgb(201 162 98 / 0.16)" strokeWidth="1" strokeDasharray="1 12" />
        <circle cx="200" cy="200" r="140" fill="none" stroke="rgb(201 162 98 / 0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
}
