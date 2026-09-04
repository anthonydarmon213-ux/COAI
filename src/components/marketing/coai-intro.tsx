import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Hero refondu le 04/09/2026 (demande Anthony : « je veux qu'on change notre
// landing pour faire comme charlesdenis.fr — moins de blabla, simple,
// efficace, mets ma photo sous le hero comme lui »).
//
// Ancien hero : photo en fond + carte sombre par-dessus contenant l'accroche,
// une phrase de positionnement, un paragraphe de 3 lignes, 4 bénéfices à
// puces, 2 boutons, 4 preuves chiffrées et une ligne clubs. Soit ~12 blocs de
// texte avant le premier scroll — le visiteur devait lire pour comprendre.
//
// Nouveau hero, structure charlesdenis.fr : sur-titre de ciblage → accroche
// géante centrée → UNE phrase de méthode → UN bouton → preuve → photo réelle
// juste en dessous. 5 éléments, lisibles en 3 secondes.
//
// Ce qui a été retiré du hero (et non supprimé du site) : les 4 bénéfices
// produit et le paragraphe explicatif sont déjà racontés plus bas sur la home
// (section « Simple du début à la première séance » + piliers visuels), donc
// les garder ici faisait lire deux fois la même chose.
//
// Ce qui a été gardé volontairement : uniquement des preuves vérifiables
// (diplôme, années d'exercice, abonnés, clubs nommés). charlesdenis.fr affiche
// une note « 5.0 · 92 avis » — COAI n'a pas encore de recueil d'avis, donc
// aucune note n'est affichée : un chiffre inventé se verrait et se paierait.
export function CoaiIntro() {
  return (
    <section className="coai-future-hero coai-landing-hero relative overflow-hidden px-6 pb-0 pt-28 sm:px-10 sm:pt-36">
      {/* Halo laiton derrière l'accroche — remplace la photo de fond, qui
          descend maintenant sous le hero. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[1100px] max-w-[160vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,98,.16),transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.22em] text-laiton-300 sm:text-xs">
          Coaching santé et longévité pour dirigeants
        </p>

        <h1 className="mt-6 font-display text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
          Retrouve ton énergie et ta forme,
          <span className="mt-2 block text-graphite-400">malgré un agenda chargé.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg sm:leading-8">
          La méthode d&apos;un coach diplômé d&apos;État, 17 ans auprès de dirigeants — amplifiée
          par l&apos;IA. L&apos;IA génère, ton coach valide.
        </p>

        <div className="mt-10">
          <Link href="/diagnostic">
            <Button className="px-10 py-5 text-sm font-extrabold uppercase tracking-[0.07em] shadow-[0_0_60px_-8px_rgba(201,162,98,.85)] sm:text-base">
              Faire mon bilan offert →
            </Button>
          </Link>
          <p className="mt-4 text-xs text-graphite-500">
            Moins de 5 minutes · résultat immédiat · aucune carte bancaire
          </p>
        </div>

        {/* Preuve juste sous le bouton, à l'emplacement où charlesdenis.fr
            place ses étoiles : uniquement des faits contrôlables. */}
        <ul
          className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
          aria-label="Ce qui garantit le sérieux de COAI"
        >
          {[
            { chiffre: "17 ans", texte: "auprès de dirigeants" },
            { chiffre: "DE", texte: "coach diplômé d’État" },
            { chiffre: "24 ans", texte: "l’âge COAI d’Anthony, à plus de 40 ans" },
            { chiffre: "3 100+", texte: "abonnés Instagram" },
          ].map((preuve) => (
            <li key={preuve.chiffre} className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold tracking-[-0.03em] text-laiton-300">
                {preuve.chiffre}
              </span>
              <span className="text-xs leading-4 text-graphite-400">{preuve.texte}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-5 text-graphite-500">
          Intervient dans les clubs premium parisiens — La Montgolfière Club et RITM Saint-Germain.
        </p>
      </div>

      {/* Photo réelle d'Anthony, sous l'accroche (structure charlesdenis.fr).
          Elle était jusqu'ici en fond derrière une carte opaque : sur mobile
          on n'en voyait qu'un filet. En portrait plein cadre ici, elle est
          enfin lisible, et c'est elle qui porte la confiance — un visage réel
          plutôt qu'un visuel généré. */}
      <div className="relative z-10 mx-auto mt-16 w-full max-w-lg sm:mt-20">
        <div className="relative overflow-hidden rounded-t-[2.5rem] border-x border-t border-laiton-300/20 shadow-[0_-30px_120px_-40px_rgba(201,162,98,.45)]">
          <Image
            src="/anthony-trx-reel.jpg"
            alt="Anthony Darmon, coach sportif diplômé d’État, en séance TRX"
            width={1400}
            height={2096}
            priority
            quality={95}
            sizes="(max-width: 640px) 100vw, 512px"
            className="h-auto w-full object-cover"
          />
          {/* Fondu vers le fond de page pour que la photo se termine sans
              bord net, et que la section suivante enchaîne naturellement. */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,#080909)]"
            aria-hidden="true"
          />
          <p className="absolute inset-x-0 bottom-6 text-center font-display text-sm font-bold uppercase tracking-[0.18em] text-white/90">
            Anthony Darmon
          </p>
        </div>
      </div>
    </section>
  );
}
