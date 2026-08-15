import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

const neatLetters = [
  ["N", "Non", "Tout ce qui n'est pas une séance programmée."],
  ["E", "Exercise", "L'activité physique réalisée en dehors de l'entraînement."],
  ["A", "Activity", "Marcher, monter les escaliers, rester debout, faire les courses."],
  ["T", "Thermogenesis", "L'énergie dépensée par tous ces mouvements du quotidien."],
] as const;

const easyWins = [
  "Marcher 5 à 10 minutes après un repas.",
  "Prendre les escaliers quand c'est réaliste.",
  "Bouger quelques minutes après une longue période assise.",
  "Faire un trajet court à pied plutôt qu'en voiture.",
  "Ajouter du mouvement sans sacrifier ton sommeil ni ta récupération.",
] as const;

export default function NeatGuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-acier/25 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <SectionLabel>Comprendre ton activité</SectionLabel>
          <Badge>Guide COAI</Badge>
        </div>
        <h1 className="max-w-4xl font-editorial text-4xl font-normal tracking-tight text-graphite-50 sm:text-6xl">
          Le NEAT : le levier invisible de ta progression.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-graphite-300 sm:text-lg">
          Tes séances comptent. Mais tout ce que tu fais entre tes séances compte aussi. Le NEAT
          mesure cette activité quotidienne souvent sous-estimée — et COAI l’utilise pour mieux
          comprendre ta dépense, ta récupération et ton rythme réel.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Définition du NEAT">
        {neatLetters.map(([letter, word, description]) => (
          <Card key={letter} className="flex min-h-48 flex-col gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-laiton-400/45 bg-laiton-500/10 font-editorial text-2xl text-laiton-300">
              {letter}
            </span>
            <div>
              <h2 className="text-base font-semibold text-graphite-50">{word}</h2>
              <p className="mt-1 text-sm leading-6 text-graphite-400">{description}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="flex flex-col gap-4">
          <SectionLabel>Pourquoi c’est important</SectionLabel>
          <h2 className="font-editorial text-3xl text-graphite-50">
            Deux personnes peuvent suivre le même programme et dépenser très différemment.
          </h2>
          <p className="text-sm leading-7 text-graphite-300">
            Une journée assise, une journée de déplacements et une journée passée debout ne
            sollicitent pas le corps de la même façon. Le NEAT peut donc influencer la gestion du
            poids, l’énergie disponible et la récupération, même lorsque les séances sont
            identiques.
          </p>
          <p className="text-sm leading-7 text-graphite-300">
            Il n’existe pas de chiffre universel obligatoire. Les « 10 000 pas » ne sont pas une
            règle magique : la bonne cible dépend de ton niveau actuel, de ton travail, de ta
            fatigue, de tes douleurs et de ton objectif.
          </p>
        </Card>

        <Card className="flex flex-col gap-4 border-laiton-400/35 bg-laiton-500/8">
          <SectionLabel>Comment COAI l’utilise</SectionLabel>
          <h2 className="font-editorial text-3xl text-graphite-50">Une cible adaptée à ta vraie vie.</h2>
          <p className="text-sm leading-7 text-graphite-300">
            COAI croise ton activité déclarée avec tes séances, ton énergie, ton sommeil, tes
            déplacements et tes contraintes. L’objectif n’est pas de te faire bouger toujours
            plus, mais de trouver le niveau utile et tenable pour toi.
          </p>
          <p className="text-sm font-medium leading-6 text-laiton-300">
            La progression doit rester graduelle. En cas de douleur, de fatigue marquée, de
            grossesse ou de post-partum, la prudence passe avant le nombre de pas.
          </p>
        </Card>
      </section>

      <Card className="flex flex-col gap-5">
        <div>
          <SectionLabel>Passer à l’action</SectionLabel>
          <h2 className="mt-2 font-editorial text-3xl text-graphite-50 sm:text-4xl">
            Améliorer ton NEAT sans bouleverser ta journée.
          </h2>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {easyWins.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-acier/25 bg-graphite-900/35 p-4 text-sm leading-6 text-graphite-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-laiton-500/15 text-xs font-semibold text-laiton-300">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col items-start gap-4 border-laiton-400/35 bg-gradient-to-r from-laiton-500/12 to-bleu-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-editorial text-2xl text-graphite-50">Donne à COAI ton activité réelle.</h2>
          <p className="mt-1 text-sm text-graphite-300">
            Renseigne tes pas et ton type de journée pour obtenir des recommandations plus justes.
          </p>
        </div>
        <Link href="/dashboard">
          <Button>Renseigner mon activité</Button>
        </Link>
      </Card>
    </div>
  );
}
