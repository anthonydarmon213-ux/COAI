import { SectionLabel } from "@/components/ui/section-label";

// Page dédiée (14/08/2026, demande Anthony) : tout le contenu "Histoire" +
// "Notre pourquoi" (mission/vision/valeurs/manifeste) vivait par erreur au
// bas de la page Coach IA (/coach) — hors sujet là-bas, jamais accessible
// depuis un menu "À propos". Reprend le contenu déjà écrit tel quel, sans
// rien inventer, déplacé ici et relié depuis SiteNav ("À propos") et
// AppNav pour être accessible aux visiteurs comme aux abonnés connectés.
export const metadata = {
  title: "À propos — COAI",
  description:
    "Pourquoi COAI existe, notre mission, notre vision et ce qui nous différencie d'une application fitness ou d'un chatbot.",
  alternates: { canonical: "/a-propos" },
};

export default function AProposPage() {
  return (
    <div className="coai-landing-lux mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-24 sm:py-28">
      <section>
        <SectionLabel>Histoire</SectionLabel>
        <h1 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Pourquoi COAI existe.
        </h1>
        <div className="mt-8 flex flex-col gap-6 font-editorial text-lg leading-8 text-graphite-200 sm:text-xl sm:leading-9">
          <p>
            Anthony Darmon a passé dix-sept ans sur le terrain — en salle, en visio, à corriger un
            mouvement, ajuster un macro, entendre ce qu&apos;un chiffre sur la balance ne dit
            jamais. Cette expérience terrain, COAI la met directement dans l&apos;algorithme qui
            construit chaque programme.
          </p>
          <p className="border-l-2 border-laiton-400 pl-6 italic text-white">
            Mais l&apos;expertise ne devrait pas être un luxe. Et un algorithme seul ne devrait
            jamais avoir le dernier mot sur un corps.
          </p>
          <p>
            COAI est né de cette tension. Donner à chacun un programme d&apos;entraînement, de
            nutrition et de récupération aussi précis qu&apos;une consultation privée — généré en
            quelques secondes par l&apos;IA, à partir d&apos;un vrai profil, pas d&apos;un modèle
            générique. Sur Coaching Hybride, il n&apos;est jamais livré sans qu&apos;Anthony, ou un
            coach qu&apos;il a formé, ne l&apos;ait relu, corrigé, validé ; sur Pass IA, il
            reste généré par l&apos;IA seule, sans relecture.
          </p>
          <p>
            L&apos;IA apporte la vitesse et la personnalisation à grande échelle. L&apos;humain
            garde ce que l&apos;IA ne peut pas avoir : le jugement, l&apos;expérience du terrain,
            la responsabilité. COAI n&apos;est pas un chatbot habillé en coach. C&apos;est un
            coach, augmenté.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Notre pourquoi</SectionLabel>
        <p className="text-base leading-7 text-graphite-300">
          Le coaching de qualité ne devrait pas être réservé à une minorité. Aujourd&apos;hui, des
          millions de personnes utilisent des applications impersonnelles ou des programmes
          génériques qui ne tiennent pas compte de leur réalité. À l&apos;inverse, un
          accompagnement humain de qualité reste souvent coûteux et peu accessible. COAI est né
          pour réunir le meilleur de ces deux mondes : l&apos;intelligence artificielle apporte la
          rapidité, la personnalisation et la disponibilité ; le coach humain apporte
          l&apos;expérience, le discernement et la confiance.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <SectionLabel>Notre mission</SectionLabel>
          <p className="text-sm leading-6 text-graphite-300">
            Construire le premier véritable coach hybride — une plateforme capable
            d&apos;accompagner durablement chaque personne vers une meilleure santé.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <SectionLabel>Notre vision</SectionLabel>
          <p className="text-sm leading-6 text-graphite-300">
            Faire de COAI la référence mondiale du coaching hybride. Créer une nouvelle manière de
            se faire accompagner — plus intelligente, plus humaine, plus efficace.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Notre promesse</SectionLabel>
        <p className="text-sm text-graphite-300">Chaque programme est :</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-graphite-300">
          {["Personnalisé", "Intelligent", "Évolutif", "Validé par un coach"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-laiton-400">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Notre positionnement</SectionLabel>
        <p className="text-sm leading-6 text-graphite-300">
          Nous ne sommes pas une application fitness. Nous ne sommes pas un chatbot. Nous ne
          sommes pas un générateur de PDF.{" "}
          <span className="text-graphite-50">Nous sommes une plateforme de coaching.</span>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>Notre différence</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-graphite-800 bg-graphite-900/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
              Les autres
            </p>
            <p className="mt-2 text-sm text-graphite-300">IA seule. Ou coach seul.</p>
          </div>
          <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.04] p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">COAI</p>
            <p className="mt-2 text-sm text-graphite-50">IA + Coach. Toujours.</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>Nos valeurs</SectionLabel>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            { titre: "Human First", texte: "La technologie doit renforcer l'humain. Jamais le remplacer." },
            { titre: "Excellence", texte: "Chaque détail compte — le produit, le design, les vidéos, les programmes, le support." },
            { titre: "Simplicité", texte: "Le meilleur logiciel est celui qu'on comprend immédiatement." },
            { titre: "Science", texte: "Nous construisons avec des données, pas avec des tendances." },
            { titre: "Évolution", texte: "Chaque interaction améliore l'expérience." },
          ].map((v) => (
            <div key={v.titre} className="flex flex-col gap-1">
              <p className="text-sm font-medium text-graphite-50">{v.titre}</p>
              <p className="text-sm leading-6 text-graphite-400">{v.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>Nos piliers</SectionLabel>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { titre: "Training", texte: "Des programmes réellement personnalisés." },
            { titre: "Nutrition", texte: "Simple, flexible, applicable." },
            { titre: "Recovery", texte: "Sommeil, mobilité, respiration, stress." },
            { titre: "Longevity", texte: "Le vrai objectif : être performant longtemps." },
          ].map((p) => (
            <div key={p.titre} className="flex flex-col gap-1">
              <p className="text-sm font-medium text-graphite-50">{p.titre}</p>
              <p className="text-xs leading-5 text-graphite-400">{p.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Notre ambition</SectionLabel>
        <p className="text-sm leading-6 text-graphite-300">
          Construire la plateforme de coaching hybride la plus respectée. Pas la plus grosse. La
          plus fiable.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Notre philosophie</SectionLabel>
        <p className="text-sm leading-6 text-graphite-300">
          Le meilleur coach n&apos;est pas une IA. Le meilleur coach n&apos;est pas un humain. Le
          meilleur coach est une collaboration intelligente entre les deux.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-graphite-800 pt-10">
        <SectionLabel>Notre manifeste</SectionLabel>
        <p className="font-editorial text-lg leading-9 text-graphite-200 sm:text-xl">
          Nous croyons que chacun mérite un accompagnement personnalisé. Nous croyons que
          l&apos;intelligence artificielle peut rendre le coaching plus accessible. Nous croyons
          que l&apos;expérience humaine reste irremplaçable. Nous refusons les programmes
          génériques. Nous refusons les promesses irréalistes. Nous construisons une nouvelle
          génération de coaching — plus intelligente, plus humaine, plus durable.
        </p>
        <p className="font-editorial text-xl italic text-laiton-300">Bienvenue chez COAI.</p>
      </section>
    </div>
  );
}
