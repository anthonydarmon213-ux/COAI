import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata = {
  title: "Correction de mouvement | COAI",
  description:
    "Filme ta série, envoie-la à Anthony sur WhatsApp et reçois l'ajustement précis à appliquer.",
};

const ETAPES = [
  {
    titre: "Filme une série complète",
    texte:
      "De profil de préférence, corps entier dans le cadre. Une série suffit, inutile de filmer toute la séance.",
  },
  {
    titre: "Envoie-la sur WhatsApp",
    texte:
      "Précise l'exercice et ce qui te fait douter : une gêne, une position, une sensation inhabituelle.",
  },
  {
    titre: "Reçois ton ajustement",
    texte:
      "Anthony regarde ta vidéo et te répond avec la correction précise à appliquer dès ta prochaine séance.",
  },
];

// Correction de mouvement (02/09/2026, demande Anthony) : la bibliothèque
// montre le geste juste, mais rien ne permettait de faire vérifier le sien.
// L'envoi passe par WhatsApp plutôt que par un import dans l'app — Anthony
// répond depuis son fil habituel, et aucune vidéo de membre ne transite ni
// ne dort sur nos serveurs.
export default async function CorrectionMouvementPage() {
  const user = await getCurrentAppUser();
  const acces = user ? hasPaidSubscription(user.subscription) : false;
  const lien = buildWhatsAppLink(
    "Bonjour Anthony, je t'envoie une vidéo de mon mouvement pour avoir ton avis. Exercice concerné : "
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <SectionLabel>Correction de mouvement</SectionLabel>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Fais valider ta technique.
        </h1>
        <p className="mt-3 text-base leading-7 text-graphite-300">
          Les démonstrations te montrent le geste juste. Ici, tu fais vérifier le
          tien par Anthony, en trois minutes.
        </p>
      </header>

      <ol className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.09]">
        {ETAPES.map((etape, index) => (
          <li key={etape.titre} className="flex gap-4 bg-[#0d0d0c]/95 p-5">
            <span className="font-display text-2xl font-semibold text-cyan-300">{index + 1}</span>
            <div>
              <p className="font-semibold text-white">{etape.titre}</p>
              <p className="mt-1 text-sm leading-6 text-graphite-400">{etape.texte}</p>
            </div>
          </li>
        ))}
      </ol>

      {acces ? (
        <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-6">
          {lien ? (
            <a
              href={lien}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-cyan-300 px-7 py-3.5 text-sm font-bold text-[#04121a] transition hover:bg-cyan-200"
            >
              Envoyer ma vidéo sur WhatsApp
            </a>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-graphite-400">
            Ta vidéo reste entre Anthony et toi, dans ta conversation WhatsApp.
            Elle n&apos;est stockée nulle part dans COAI.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.05] p-6">
          <p className="font-semibold text-white">Inclus à partir du Coaching Hybride.</p>
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
