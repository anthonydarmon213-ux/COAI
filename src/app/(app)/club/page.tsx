import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = { title: "COAI Club — Rencontres sportives", description: "Bouger ensemble : running, tennis, street workout et yoga en petit groupe." };

const activites = [
  { nom: "Run & café", lieu: "Paris · parcours à définir", texte: "Courir ensemble, à son rythme, puis prendre le temps de se rencontrer." },
  { nom: "Tennis", lieu: "Paris · terrain à définir", texte: "Trouver des partenaires et partager une session selon son niveau." },
  { nom: "Street workout", lieu: "Paris · lieu à définir", texte: "Force, mobilité et entraide en plein air, en petit groupe." },
  { nom: "Yoga aux Tuileries", lieu: "Jardin des Tuileries · projet à confirmer", texte: "Un petit groupe pour bouger, respirer et partager une pause ensemble." },
];

export default function ClubPage() {
  return <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
    <header className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-cyan-950/60 to-black/20 p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">COAI Club · Rencontres sportives</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Bouge. Rencontre. Recommence.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-graphite-200">Un corps plus fort, des rencontres qui te font bouger. Retrouve la communauté COAI pour partager le sport et le plaisir de progresser ensemble.</p>
      <p className="mt-5 inline-block rounded-full border border-cyan-200/30 px-4 py-2 text-sm text-cyan-100">Premières rencontres en préparation · Paris</p>
    </header>
    <section aria-labelledby="club-activites">
      <h2 id="club-activites" className="mb-4 text-2xl font-semibold text-white">Quel rendez-vous te tente ?</h2>
      <div className="grid gap-4 sm:grid-cols-2">{activites.map((activite) => <article key={activite.nom} className="flex flex-col rounded-2xl border border-white/15 bg-white/[0.035] p-6">
        <h3 className="text-xl font-semibold text-white">{activite.nom}</h3>
        <p className="mt-2 text-xs text-cyan-200">{activite.lieu}</p>
        <p className="mt-3 flex-1 text-sm leading-6 text-graphite-300">{activite.texte}</p>
        <a href={buildWhatsAppLink(`Bonjour, je suis intéressé(e) par COAI Club : ${activite.nom}. Quels sont les prochains rendez-vous ?`) ?? "/contact"} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-laiton-200 underline underline-offset-4">En parler sur WhatsApp →</a>
      </article>)}</div>
    </section>
    <section className="rounded-2xl border border-cyan-300/20 p-6">
      <h2 className="text-xl font-semibold text-white">Les prochains rendez-vous</h2>
      <p className="mt-3 text-sm leading-6 text-graphite-300">Aucune date n’est encore ouverte à la réservation. Chaque rencontre précisera le lieu, le niveau, l’encadrement, le nombre de places et le tarif éventuel avant ton inscription. Manifester ton intérêt sur WhatsApp ne réserve pas une place.</p>
    </section>
    <Link href="/fonctionnalites" className="text-sm text-cyan-200 underline underline-offset-4">Explorer les fonctions COAI →</Link>
  </main>;
}
