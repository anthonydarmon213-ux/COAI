import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export default function NotFound() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <SectionLabel>Erreur 404</SectionLabel>
      <h1 className="text-3xl font-semibold text-graphite-50">Page introuvable</h1>
      <p className="max-w-sm text-graphite-400">
        Cette page n&apos;existe pas ou plus. Retourne à l&apos;accueil pour continuer.
      </p>
      <Link href="/">
        <Button variant="secondary">Retour à l&apos;accueil</Button>
      </Link>
    </main>
  );
}
