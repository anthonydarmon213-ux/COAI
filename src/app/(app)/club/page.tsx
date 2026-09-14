import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = { title: "COAI Club — Le Direct du Coach", description: "Un rendez-vous collectif mensuel avec Anthony Darmon : une heure de questions-réponses, en direct, sans replay." };

const activites = [
  { nom: "Run & café", lieu: "Paris · parcours à définir", texte: "Courir ensemble, à son rythme, puis prendre le temps de se rencontrer." },
  { nom: "Tennis", lieu: "Paris · terrain à définir", texte: "Trouver des partenaires et partager une session selon son niveau." },
  { nom: "Street workout", lieu: "Paris · lieu à définir", texte: "Force, mobilité et entraide en plein air, en petit groupe." },
  { nom: "Yoga aux Tuileries", lieu: "Jardin des Tuileries · projet à confirmer", texte: "Un petit groupe pour bouger, respirer et partager une pause ensemble." },
];

export default function ClubPage() {
  const questionHref = buildWhatsAppLink("Bonjour Anthony, voici ma question pour le prochain Direct du Coach COAI : ");
  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
    <header className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-cyan-950/60 to-black/20 p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">COAI Club</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Le Direct du Coach.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-graphite-200">Ton programme au quotidien. Un rendez-vous collectif avec Anthony Darmon pour poser tes questions et progresser ensemble.</p>
      <p className="mt-5 text-sm font-semibold text-laiton-200">1 heure par mois · En groupe · Sans replay</p>
    </header>
    <section aria-labelledby="club-direct" className="rounded-2xl border border-laiton-400/30 bg-laiton-400/[0.04] p-6">
      <h2 id="club-direct" className="text-2xl font-semibold text-white">Prochain direct</h2>
      <p className="mt-3 text-base text-graphite-200">Premier rendez-vous en préparation.</p>
      <p className="mt-2 text-sm leading-6 text-graphite-300">La date, l’heure et les modalités d’accès seront précisées ici avant l’ouverture des inscriptions.</p>
      <a href={questionHref ?? "/contact"} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-laiton-400 px-5 py-3 text-center text-sm font-semibold text-black">Préparer ma question sur WhatsApp</a>
      <p className="mt-3 text-xs leading-5 text-graphite-300">Le message s’ouvre dans WhatsApp : tu peux le modifier avant de l’envoyer. Cela ne réserve pas une place. Évite les informations de santé personnelles dans une question destinée au groupe.</p>
      <details className="mt-5 border-t border-white/15 pt-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-white">Comment se passe le direct ?</summary>
        <p className="mt-2 text-sm leading-6 text-graphite-300">Les questions sont regroupées par thème pour profiter au plus grand nombre. Une réponse à chaque question n’est pas garantie. Ce rendez-vous collectif ne remplace pas un suivi individuel. Il n’y a pas de replay.</p>
      </details>
    </section>
    <section aria-labelledby="club-activites">
      <h2 id="club-activites" className="mb-4 text-2xl font-semibold text-white">Et pour bouger ensemble</h2>
      <p className="mb-4 text-sm text-graphite-300">Rencontres sportives en préparation à Paris, distinctes du direct mensuel.</p>
      <div className="grid gap-4 sm:grid-cols-2">{activites.map((activite) => <article key={activite.nom} className="flex flex-col rounded-2xl border border-white/15 bg-white/[0.035] p-6">
        <h3 className="text-xl font-semibold text-white">{activite.nom}</h3>
        <p className="mt-2 text-xs text-cyan-200">{activite.lieu}</p>
        <p className="mt-3 flex-1 text-sm leading-6 text-graphite-300">{activite.texte}</p>
        <a href={buildWhatsAppLink(`Bonjour, je suis intéressé(e) par COAI Club : ${activite.nom}. Quels sont les prochains rendez-vous ?`) ?? "/contact"} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-laiton-200 underline underline-offset-4">En parler sur WhatsApp →</a>
      </article>)}</div>
    </section>
    <section className="rounded-2xl border border-cyan-300/20 p-6">
      <h2 className="text-xl font-semibold text-white">Les rencontres à Paris</h2>
      <p className="mt-3 text-sm leading-6 text-graphite-300">Aucune date n’est encore ouverte à la réservation. Chaque rencontre précisera le lieu, le niveau, l’encadrement, le nombre de places et le tarif éventuel avant ton inscription. Manifester ton intérêt sur WhatsApp ne réserve pas une place.</p>
    </section>
    <Link href="/fonctionnalites" className="text-sm text-cyan-200 underline underline-offset-4">Explorer les fonctions COAI →</Link>
  </div>;
}
