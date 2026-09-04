import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { EnterpriseLeadForm } from "@/components/marketing/enterprise-lead-form";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "COAI Entreprise — Santé et performance des équipes",
  description: "Séances small group animées par Anthony Darmon dans vos locaux, accompagnement de vos dirigeants et application pour vos collaborateurs. Sur devis, facture professionnelle fournie.",
  alternates: { canonical: "/entreprise" },
};

export default function EntreprisePage() {
  const whatsappHref = buildWhatsAppLink(
    "Bonjour Anthony, je souhaite échanger avec vous au sujet d’un dispositif COAI pour mon entreprise (accompagnement dirigeant et/ou séances small group pour nos collaborateurs)."
  );

  return (
    <main className="coai-future-hero min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <TrackConversion name="enterprise_page_viewed" />
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-graphite-400 hover:text-white">← Retour à COAI</Link>
        <div className="mt-12 grid gap-16 lg:grid-cols-[1.05fr_.8fr]">
          <div>
            <SectionLabel>COAI Entreprise</SectionLabel>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">Des équipes en meilleure forme. Une entreprise plus performante.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-graphite-300">COAI personnalise l&apos;entraînement, la nutrition et la récupération de chaque collaborateur, tout en donnant à l&apos;entreprise une vision claire de l&apos;engagement — jamais des données de santé individuelles.</p>

            {/* Preuve ajoutee le 04/09/2026 (demande Anthony : « tu peux
                rajouter des centaines d'entrepreneurs accompagnes »).
                Formulation volontairement sans chiffre exact ni date de
                depart — Anthony a choisi de garder « des centaines » plutot
                que de donner un nombre precis a justifier, et je n'invente
                pas de date de debut : « 17 ans d'experience » concerne le
                coaching en general, pas necessairement le meme point de
                depart que l'accompagnement d'entrepreneurs specifiquement. */}
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-laiton-300">
              Des centaines d&apos;entrepreneurs et dirigeants accompagnés
            </p>

            <div className="mt-10 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-6 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">Pour vous, dirigeant(e)</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">Commencez dès aujourd&apos;hui, sans attendre le déploiement de l&apos;offre équipe.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">
                Avant de penser à vos équipes, prenez soin de vous : l&apos;abonnement individuel COAI est accessible
                immédiatement, en libre-service, avec le même diagnostic et le même moteur d&apos;adaptation que le
                dispositif entreprise.
              </p>
              <Link
                href="/diagnostic"
                className="mt-5 inline-flex min-h-12 items-center rounded-full bg-laiton-400 px-6 text-sm font-semibold text-graphite-950 transition hover:bg-laiton-300"
              >
                Faire mon diagnostic offert →
              </Link>
            </div>

            <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">Pour vos collaborateurs — sur devis</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Pilote", "Un groupe restreint pour valider l'adoption."],
                ["Déploiement", "Un parcours personnalisé par collaborateur."],
                ["Pilotage", "Un bilan agrégé pour mesurer l'engagement."],
              ].map(([title, text], index) => <div key={title} className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5"><span className="font-mono text-[10px] text-laiton-300">0{index + 1}</span><h2 className="mt-3 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-graphite-400">{text}</p></div>)}
            </div>
            {/* Small group collaborateurs + argument deductibilite ajoutes le
                04/09/2026 (demande Anthony : « je veux qu'on parle du coaching
                entreprise... deductible... et aussi les collaborateurs small
                group »). La page ne decrivait jusqu'ici que le dispositif
                logiciel (licence par collaborateur, onboarding, pilotage) —
                jamais les seances collectives animees par Anthony sur site,
                qui sont pourtant la porte d'entree la plus simple pour une
                entreprise et ce qu'elle sait deja acheter.
                Aucun tarif affiche : sur devis uniquement (choix Anthony du
                meme jour), le prix dependant de la taille du groupe, du lieu
                et de la frequence. */}
            <div className="mt-6 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-6 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
                Small group — sur site ou en club
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
                Anthony anime vos séances collectives, en petit groupe.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">
                Des séances en petit comité, dans vos locaux, en club ou en extérieur, animées
                personnellement par Anthony — coach diplômé d&apos;État, 17 ans d&apos;expérience.
                Le petit groupe garde ce qui compte : chacun est corrigé individuellement, et
                l&apos;énergie collective fait revenir les gens la semaine suivante.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Format", "Séances régulières, à l'heure qui arrange vos équipes — avant le travail, sur la pause ou en fin de journée."],
                  ["Contenu", "Renforcement, mobilité, boxe, préparation physique et récupération, adaptés au niveau réel du groupe."],
                  ["Sur place", "Dans vos locaux, en club partenaire ou en extérieur — aucun équipement lourd nécessaire."],
                  ["Prolongement", "Chaque participant peut poursuivre entre les séances avec l'application COAI."],
                ].map(([titre, texte]) => (
                  <li key={titre} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <p className="text-sm font-semibold text-laiton-200">{titre}</p>
                    <p className="mt-1.5 text-sm leading-6 text-graphite-400">{texte}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-graphite-400">
                Tarif sur devis, selon la taille du groupe, le lieu et la fréquence.
              </p>
            </div>

            {/* Argument deductibilite volontairement garde au niveau
                commercial, sans detail fiscal (choix Anthony du 04/09/2026) :
                le detail des regles (avantage en nature, exonerations URSSAF
                du sport en entreprise) evolue et engagerait COAI sur un
                terrain qui n'est pas le sien. La reserve « votre comptable
                tranche » n'est pas une precaution de style : c'est ce qui
                evite de repondre d'un conseil fiscal donne a la place d'un
                professionnel. */}
            <div className="mt-6 rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.05] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
                Passé en frais d&apos;entreprise
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
                L&apos;entreprise paie, la facture est professionnelle.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">
                Toutes les prestations — accompagnement d&apos;un dirigeant comme séances small
                group — sont facturées par la société d&apos;Anthony, avec une facture
                professionnelle en bonne et due forme. Réglées par l&apos;entreprise, elles
                entrent dans ses charges au même titre qu&apos;une autre prestation de services.
              </p>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-graphite-500">
                Le traitement exact dépend de votre situation : votre expert-comptable reste seul
                à même de le confirmer.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-laiton-300/20 bg-laiton-300/[0.055] p-6">
              <p className="text-sm font-semibold text-laiton-200">Modèle conçu pour grandir</p>
              <p className="mt-2 text-sm leading-6 text-graphite-300">Licence par collaborateur, onboarding automatisé et accompagnement premium des dirigeants : le dispositif s&apos;adapte de 10 à plusieurs centaines de personnes.</p>
            </div>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">Préparer votre pilote</p>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 flex min-h-14 w-full items-center justify-center rounded-full border border-[#70c989]/40 bg-[#1f7a43] px-6 py-4 text-center text-sm font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_18px_45px_-22px_rgba(37,211,102,.7)] transition hover:-translate-y-0.5 hover:bg-[#176b39]"
              >
                Échanger sur votre projet via WhatsApp →
              </a>
            )}
            <p className="mb-5 text-center text-xs leading-5 text-graphite-400">
              Un projet précis ? Présentez-le directement à Anthony par message.
            </p>
            <EnterpriseLeadForm />
          </div>
        </div>
      </div>
    </main>
  );
}
