import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { CoachMemoryStatus } from "@/components/coach/coach-memory-status";

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);
  const intelligence = await buildProfilIntelligence(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Coach IA</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Posez votre question.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Réponse immédiate par l&apos;IA, dans l&apos;esprit de la méthode d&apos;Anthony
          Darmon. Pour un suivi médical ou un ajustement personnalisé approfondi, un échange
          direct avec ton coach reste la meilleure option.
        </p>
        {plan === "GRATUIT" && <Badge tone="warning">4 questions/mois</Badge>}
        <CoachMemoryStatus progression={intelligence.progression} observations={intelligence.items.length} tendances={intelligence.tendances.length} />
      </div>

      <AskCoach />

      <div className="flex flex-col gap-3">
        <SectionLabel>Histoire</SectionLabel>
        <Card className="flex flex-col gap-4 p-6 sm:p-8">
          <h2 className="font-editorial text-2xl font-normal text-graphite-50">
            Pourquoi COAI existe.
          </h2>
          <div className="flex flex-col gap-4 font-editorial text-base leading-8 text-graphite-300">
            <p>
              Anthony Darmon a passé dix-sept ans sur le terrain — en salle, en visio, à corriger
              un mouvement, ajuster un macro, entendre ce qu&apos;un chiffre sur la balance ne dit
              jamais. De cette expérience est né THE METHOD : un accompagnement 1-to-1 exigeant,
              construit séance après séance.
            </p>
            <p className="border-l-2 border-acier pl-5 italic text-graphite-200">
              Mais l&apos;expertise ne devrait pas être un luxe. Et un algorithme seul ne devrait
              jamais avoir le dernier mot sur un corps.
            </p>
            <p>
              COAI est né de cette tension. Donner à chacun un programme d&apos;entraînement, de
              nutrition et de récupération aussi précis qu&apos;une consultation privée — généré
              en quelques secondes par l&apos;IA, à partir d&apos;un vrai profil, pas d&apos;un
              modèle générique. Mais jamais livré sans qu&apos;Anthony, ou un coach qu&apos;il a
              formé, ne l&apos;ait relu, corrigé, validé.
            </p>
            <p>
              L&apos;IA apporte la vitesse et la personnalisation à grande échelle. L&apos;humain
              garde ce que l&apos;IA ne peut pas avoir : le jugement, l&apos;expérience du
              terrain, la responsabilité. COAI n&apos;est pas un chatbot habillé en coach.
              C&apos;est un coach, augmenté.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-8 p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <SectionLabel>Notre pourquoi</SectionLabel>
            <p className="text-sm leading-7 text-graphite-300">
              Le coaching de qualité ne devrait pas être réservé à une minorité. Aujourd&apos;hui,
              des millions de personnes utilisent des applications impersonnelles ou des
              programmes génériques qui ne tiennent pas compte de leur réalité. À l&apos;inverse,
              un accompagnement humain de qualité reste souvent coûteux et peu accessible. COAI
              est né pour réunir le meilleur de ces deux mondes : l&apos;intelligence artificielle
              apporte la rapidité, la personnalisation et la disponibilité ; le coach humain
              apporte l&apos;expérience, le discernement et la confiance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
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
                Faire de COAI la référence mondiale du coaching hybride. Créer une nouvelle
                manière de se faire accompagner — plus intelligente, plus humaine, plus efficace.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
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
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Notre positionnement</SectionLabel>
            <p className="text-sm leading-6 text-graphite-300">
              Nous ne sommes pas une application fitness. Nous ne sommes pas un chatbot. Nous ne
              sommes pas un générateur de PDF. <span className="text-graphite-50">Nous sommes
              une plateforme de coaching.</span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Notre différence</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-graphite-800 bg-graphite-900/40 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
                  Les autres
                </p>
                <p className="mt-2 text-sm text-graphite-300">IA seule. Ou coach seul.</p>
              </div>
              <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
                  COAI
                </p>
                <p className="mt-2 text-sm text-graphite-50">IA + Coach. Toujours.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Nos valeurs</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>Nos piliers</SectionLabel>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Notre ambition</SectionLabel>
            <p className="text-sm leading-6 text-graphite-300">
              Construire la plateforme de coaching hybride la plus respectée. Pas la plus grosse.
              La plus fiable.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Notre philosophie</SectionLabel>
            <p className="text-sm leading-6 text-graphite-300">
              Le meilleur coach n&apos;est pas une IA. Le meilleur coach n&apos;est pas un humain.
              Le meilleur coach est une collaboration intelligente entre les deux.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-graphite-800 pt-6">
            <SectionLabel>Notre manifeste</SectionLabel>
            <p className="font-editorial text-base leading-8 text-graphite-200">
              Nous croyons que chacun mérite un accompagnement personnalisé. Nous croyons que
              l&apos;intelligence artificielle peut rendre le coaching plus accessible. Nous
              croyons que l&apos;expérience humaine reste irremplaçable. Nous refusons les
              programmes génériques. Nous refusons les promesses irréalistes. Nous construisons
              une nouvelle génération de coaching — plus intelligente, plus humaine, plus
              durable.
            </p>
            <p className="font-editorial text-lg italic text-laiton-300">Bienvenue chez COAI.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
