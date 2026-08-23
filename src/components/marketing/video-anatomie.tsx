// Vidéo anatomique du hero (23/08/2026, fournie par Anthony) — film COAI
// de 10 s en trois scènes (squat, pompe, dashboard), sous-titres incrustés.
//
// Source .mov 2,7 Mo réencodée en MP4 534 Ko + WebM 688 Ko, sans piste
// audio : elle joue en boucle muette, un flux son inutilisé aurait été
// téléchargé pour rien.
//
// Chargement asynchrone volontaire : preload="none" + poster JPEG 25 Ko.
// Le visiteur voit l'image tout de suite, la vidéo n'est téléchargée que
// si elle entre réellement dans le viewport — sur mobile en 4G, imposer
// 534 Ko avant le premier rendu aurait dégradé le LCP de la landing.
export function VideoAnatomie({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0D0E12] ${className}`}>
      <video
        className="h-full w-full object-cover"
        poster="/videos/coai-anatomie.jpg"
        preload="none"
        autoPlay
        muted
        loop
        playsInline
        // Un lecteur natif sur une boucle décorative de 10 s n'apporte
        // rien et casse l'esthétique du hero.
        controls={false}
        aria-label="Animation anatomique COAI : muscles sollicités mis en lumière pendant l'effort"
      >
        <source src="/videos/coai-anatomie.webm" type="video/webm" />
        <source src="/videos/coai-anatomie.mp4" type="video/mp4" />
      </video>

      {/* Dégradé bas : les sous-titres incrustés dans la vidéo restent
          lisibles quel que soit le fond de la scène. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0D0E12] to-transparent"
      />
    </div>
  );
}
