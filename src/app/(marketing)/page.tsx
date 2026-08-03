import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 text-center">
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

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="relative h-64 w-64 overflow-hidden rounded-lg border border-graphite-800 sm:h-72 sm:w-72">
          <Image
            src="/anthony-darmon.jpg"
            alt="Anthony Darmon — THE METHOD"
            fill
            className="object-cover"
            priority
          />
        </div>
        <p className="max-w-sm text-sm text-graphite-400">
          THE METHOD by Anthony Darmon — expert en coaching sportif depuis 17 ans. Lab
          Coach s&apos;appuie sur cette méthode pour générer ton programme.
        </p>
      </div>
    </main>
  );
}
