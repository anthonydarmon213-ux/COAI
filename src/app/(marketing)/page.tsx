import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <SectionLabel>Coaching · Suivi · IA</SectionLabel>
      <h1 className="text-4xl font-semibold tracking-tight text-graphite-50 sm:text-5xl">
        Lab <span className="text-laiton-400">Coach</span>
      </h1>
      <p className="max-w-md text-graphite-300">
        La méthode d&apos;Anthony Darmon, 16 ans d&apos;expérience, condensée dans un
        programme généré pour toi — entraînement, nutrition, récupération.
      </p>
      <Link href="/pricing">
        <Button>Découvrir l&apos;offre</Button>
      </Link>
    </main>
  );
}
