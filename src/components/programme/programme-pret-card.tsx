import { CATEGORIE_PROGRAMME_LABEL, type ProgrammePret } from "@/lib/programmes-prets/catalogue";
import Image from "next/image";

// Carte programme prêt à l'emploi (19/08/2026), même langage visuel que
// RecetteCard : photo Pexels en fond, badges catégorie/durée, détail
// (semaine type / journées) replié dans un <details> natif.
export function ProgrammePretCard({
  programme,
  photoUrl,
  sexe,
}: {
  programme: ProgrammePret;
  photoUrl: string | null;
  sexe?: string | null;
}) {
  return (
    <article className="animate-reveal group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111518] shadow-[0_24px_70px_-46px_rgba(0,0,0,.7)] transition hover:border-white/20">
      <div className="relative h-52 w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(196,154,82,.25),transparent_60%),#171b1d]">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {CATEGORIE_PROGRAMME_LABEL[programme.categorie]}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {programme.duree}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[#fffdf8]">{programme.nom}</h3>
          <p className="mt-1 text-xs leading-5 text-graphite-400">{programme.accroche}</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
          <div>
            <strong className="block text-xs text-[#fffdf8]">{programme.niveau}</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">Niveau</span>
          </div>
          <div>
            <strong className="block text-xs text-[#fffdf8]">{programme.frequence}</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">Fréquence</span>
          </div>
        </div>

        <p className="text-xs leading-5 text-graphite-300">{programme.description}</p>

        <details className="group/details mt-1 text-xs">
          <summary className="cursor-pointer list-none font-semibold text-laiton-300 transition hover:text-laiton-200">
            Voir le programme →
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {programme.visuels && programme.visuels.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  Démonstrations · modèle {sexe === "Homme" ? "homme" : "femme"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {programme.visuels.map((visuel) => {
                    // Un visuel n'illustre parfois qu'un seul modèle : on
                    // bascule sur l'autre plutôt que d'afficher un trou.
                    const src =
                      sexe === "Homme"
                        ? (visuel.photoHomme ?? visuel.photoFemme)
                        : (visuel.photoFemme ?? visuel.photoHomme);
                    if (!src) return null;
                    return (
                      <figure key={visuel.nom} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                        <Image
                          src={src}
                          alt={`${visuel.nom} — démonstration COAI`}
                          width={900}
                          height={675}
                          className="h-24 w-full object-cover object-center sm:h-28"
                        />
                        <figcaption className="px-2.5 py-2 text-[10px] leading-4 text-graphite-300">
                          {visuel.nom}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">Objectifs</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-graphite-300">
                {programme.objectifs.map((objectif, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-laiton-400" aria-hidden="true" />
                    {objectif}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                {programme.categorie === "CHALLENGE_30_JOURS" ? "Les 30 jours" : "Semaine type"}
              </p>
              <ol className="mt-1.5 flex flex-col gap-2.5 text-graphite-300">
                {programme.jours.map((jour, i) => (
                  <li key={i}>
                    <span className="font-mono text-[10px] font-bold text-laiton-400">
                      {jour.jour} — {jour.focus}
                    </span>
                    <p className="mt-0.5 leading-5">{jour.contenu}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}
