import { Activity, ChartNoAxesCombined, Dumbbell } from "lucide-react";

type FonctionsDiagnosticCardProps = {
  objectif: string;
  rythme: string;
  environnement: string;
  avecContrainte: boolean;
};

// Le résultat du bilan ne présente pas un catalogue de fonctions. Il montre
// le parcours concret que cette personne vivra dans l'app, dans l'ordre où
// elle l'utilisera : préparer, réaliser, progresser.
export function FonctionsDiagnosticCard({
  objectif,
  rythme,
  environnement,
  avecContrainte,
}: FonctionsDiagnosticCardProps) {
  const etapes = [
    {
      numero: "01",
      moment: "Avant la séance",
      titre: "Daily COAI",
      texte: `En quelques secondes, indique ta forme, ton sommeil et ton temps disponible. COAI calibre une séance compatible avec ton rythme : ${rythme.toLowerCase()}.${avecContrainte ? " Tes contraintes restent prioritaires." : ""}`,
      Icone: Activity,
      couleur: "cyan" as const,
    },
    {
      numero: "02",
      moment: "Pendant",
      titre: "Séance guidée + RepCount",
      texte: `Dans ton environnement — ${environnement.toLowerCase()} — suis les exercices, le repos et le chrono. Tes répétitions et tes charges sont enregistrées sans double saisie.`,
      Icone: Dumbbell,
      couleur: "gold" as const,
    },
    {
      numero: "03",
      moment: "Après",
      titre: "Courbes + adaptation",
      texte: `Visualise tes records et ta régularité. COAI utilise ces données pour faire évoluer le plan vers ton objectif : ${objectif.toLowerCase()}.`,
      Icone: ChartNoAxesCombined,
      couleur: "cyan" as const,
    },
  ];

  return (
    <section
      className="relative w-full overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_8%_0%,rgba(56,189,248,.13),transparent_20rem),radial-gradient(circle_at_92%_100%,rgba(201,162,98,.12),transparent_22rem),#0b1116] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.06)] sm:p-7"
      aria-labelledby="fonctions-diagnostic-title"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-200">
            Ton expérience dans l&apos;app
          </p>
          <h3 id="fonctions-diagnostic-title" className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            Concrètement, voici comment COAI t&apos;accompagne.
          </h3>
        </div>
        <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[10px] font-semibold text-emerald-200">
          Adapté à ton bilan
        </span>
      </div>

      <ol className="relative mt-5 grid gap-3 lg:grid-cols-3">
        <span
          className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-cyan-300/35 via-laiton-300/50 to-cyan-300/35 lg:block"
          aria-hidden="true"
        />
        {etapes.map(({ numero, moment, titre, texte, Icone, couleur }) => (
          <li
            key={numero}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-black/25 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 motion-reduce:transform-none"
          >
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl ${
                couleur === "gold" ? "bg-laiton-300/10" : "bg-cyan-300/10"
              }`}
            />
            <div className="relative flex items-center justify-between">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_0_24px_rgba(56,189,248,.12)] ${
                  couleur === "gold"
                    ? "border-laiton-300/35 bg-laiton-300/10 text-laiton-200"
                    : "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-200"
                }`}
              >
                <Icone size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-graphite-500">{numero}</span>
            </div>
            <p className="relative mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-graphite-400">
              {moment}
            </p>
            <h4 className="relative mt-1 text-base font-semibold text-white">{titre}</h4>
            <p className="relative mt-2 text-xs leading-5 text-graphite-300">{texte}</p>
          </li>
        ))}
      </ol>

      <p className="relative mt-5 border-t border-white/[0.08] pt-4 text-center text-sm font-medium text-laiton-100">
        Tu n&apos;as pas à apprendre l&apos;application : COAI te présente la prochaine action utile.
      </p>
    </section>
  );
}
