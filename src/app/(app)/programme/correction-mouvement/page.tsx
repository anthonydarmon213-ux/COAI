import Link from "next/link";
import { CorrectionMouvement } from "@/components/programme/correction-mouvement";
import { EXERCICES } from "@/lib/exercices/catalogue";
import { getCurrentAppUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata = {
  title: "Correction de mouvement | COAI",
  description:
    "Filme ta série, envoie-la à Anthony et reçois l'ajustement précis à appliquer.",
};

// Correction de mouvement (02/09/2026, demande Anthony) : la bibliothèque
// montrait le geste juste, mais rien ne permettait de vérifier le sien.
// Réservé aux formules payantes — chaque envoi mobilise du temps de coach.
export default async function CorrectionMouvementPage() {
  const user = await getCurrentAppUser();
  const acces = user ? hasPaidSubscription(user.subscription) : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <SectionLabel>Correction de mouvement</SectionLabel>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Fais valider ta technique.
        </h1>
        <p className="mt-3 text-base leading-7 text-graphite-300">
          Les démonstrations te montrent le geste juste. Ici, tu vérifies le tien.
        </p>
      </header>

      {acces ? (
        <CorrectionMouvement exercices={EXERCICES.map((e) => e.nom)} />
      ) : (
        <section className="rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.05] p-6">
          <p className="font-semibold text-white">
            Inclus à partir du Coaching Hybride.
          </p>
          <p className="mt-2 text-sm leading-6 text-graphite-300">
            Anthony regarde ta vidéo et te répond personnellement. C&apos;est du
            temps de coach : cette fonction est réservée aux formules qui
            l&apos;incluent.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex rounded-full bg-laiton-300 px-6 py-3 text-sm font-bold text-[#0d0d0c]"
          >
            Voir les formules
          </Link>
        </section>
      )}
    </main>
  );
}
