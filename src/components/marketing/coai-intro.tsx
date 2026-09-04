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
          Coaching santé et longévité
        </p>

        <h1 className="mt-6 font-display text-[2.15rem] font-extrabold uppercase leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
          Retrouve ton énergie et ta forme,
          <span className="mt-2 block text-graphite-400">malgré un agenda chargé.</span>
        </h1>

        {/* Reformule le 04/09/2026 (Anthony : « la methode d'un coach
            diplome d'Etat... tu peux reformuler, ce n'est pas top »).
            L'ancienne phrase enchainait deux informations par une simple
            virgule (« un coach diplome d'Etat, 17 ans aupres de dirigeants »),
            ce qui se lisait comme une liste plutot qu'une phrase. Le "avec"
            relie proprement le diplome a l'experience, et le prenom cree un
            lien direct avec la photo d'Anthony juste en dessous. */}
        <p className="mt-8 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg sm:leading-8">
          La méthode d&apos;Anthony Darmon, coach diplômé d&apos;État avec 17 ans d&apos;expérience
          auprès de dirigeants.
        </p>

        <div className="mt-10">
          {/* coai-cta-glow : halo laiton qui respire autour du bouton
              (cf. globals.css) — reprend l'effet de charlesdenis.fr. */}
          <span className="coai-cta-glow">
            <Link href="/diagnostic">
              <Button className="px-10 py-5 text-sm font-extrabold uppercase tracking-[0.07em] sm:text-base">
                Faire mon bilan forme offert →
              </Button>
            </Link>
          </span>
          {/* Ligne de reassurance retiree le 04/09/2026 (Anthony : « enleve »). */}

          {/* Ligne « Pas encore le budget... » retiree le 04/09/2026
              (Anthony : « enleve »). Le bouton principal mene deja au bilan
              ("/diagnostic") juste au-dessus : cette seconde ligne repetait
              la meme destination avec un pretexte differe, ce qui affaiblissait
              le bouton plutot que d'ajouter une vraie option. Le repositionnement
              humain-d'abord du meme jour reste intact — c'etait seulement la
              formulation en trop, pas l'intention. */}
        </div>

        {/* Nettoyage 04/09/2026 (Anthony : « pas de doublon ! », « enleve les
            mentions inutiles »). Trois problemes corriges d'un coup :
            - « 17 ans aupres de dirigeants » etait ecrit deux fois, dans le
              sous-titre ET dans la ligne de preuve, a trois lignes d'ecart.
              Garde une seule fois, dans le sous-titre.
            - « 24 ans, l'age COAI d'Anthony » retire du hero : la notion
              d'age COAI demande une explication qui n'existe pas encore a
              cet endroit de la page, donc elle intrigue au lieu de rassurer.
              Elle reste presentee plus bas, la ou elle est expliquee.
            - les quatre preuves + la ligne clubs + la ligne de reassurance
              faisaient cinq lignes de petit texte empilees sous le bouton.
              charlesdenis.fr n'en a qu'une (ses etoiles). Tout est ramene a
              une seule ligne.
            Deplacee une seconde fois le meme jour (Anthony : « ca ne va pas,
            intervient a la Montgol a cet endroit-la ») : la phrase n'avait
            pas de sujet et flottait, isolee, juste sous un lien sans rapport.
            Elle rejoint la legende de la photo plus bas, ou « Anthony
            Darmon » est ecrit juste au-dessus — le sujet devient evident. */}
      </div>

      {/* Photo réelle d'Anthony, sous l'accroche (structure charlesdenis.fr).
          Elle était jusqu'ici en fond derrière une carte opaque : sur mobile
          on n'en voyait qu'un filet. En portrait plein cadre ici, elle est
          enfin lisible, et c'est elle qui porte la confiance — un visage réel
          plutôt qu'un visuel généré. */}
      <div className="relative z-10 mx-auto mt-16 w-full max-w-lg sm:mt-20">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[2.5rem] border-x border-t border-laiton-300/20 shadow-[0_-30px_120px_-40px_rgba(201,162,98,.45)]">
          {/* Recadrage : la photo source est un portrait haut dont le tiers
              supérieur est le plafond et les sangles TRX. En plein cadre, il
              fallait scroller longtemps avant d'arriver au visage. Le format
              4/5 avec object-[center_35%] cadre directement sur le visage
              souriant, sangle TRX comprise. */}
          <Image
            src="/anthony-trx-reel.jpg"
            alt="Anthony Darmon, coach sportif diplômé d’État, en séance TRX"
            fill
            priority
            quality={95}
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover object-[center_35%]"
          />
          {/* Fondu vers le fond de page pour que la photo se termine sans
              bord net, et que la section suivante enchaîne naturellement. */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,#080909)]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-6 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white/90">
              Anthony Darmon
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-laiton-200">
              Le fondateur
            </p>
          </div>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-graphite-400 sm:text-sm">
          Anthony intervient à La Montgolfière Club et RITM Saint-Germain · 3 100+ abonnés
          Instagram
        </p>
      </div>
    </section>
  );
}
