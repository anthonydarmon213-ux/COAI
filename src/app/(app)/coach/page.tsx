import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);

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
        {plan === "GRATUIT" && (
          <Badge tone="warning">4 questions/mois en offre Gratuite · illimité en Premium</Badge>
        )}
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
      </div>
    </div>
  );
}
