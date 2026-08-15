import { LoadingScreen } from "@/components/ui/loading-screen";

// Sans le thème clair, cet écran retombait sur le fond sombre par défaut
// du body — un flash sombre entre deux pages déjà passées au thème clair
// (ex: accueil → /diagnostic), repéré par Anthony au clic sur le CTA du hero.
export default function Loading() {
  return (
    <div className="coai-landing-lux flex min-h-screen flex-col items-center justify-center">
      <LoadingScreen />
    </div>
  );
}
