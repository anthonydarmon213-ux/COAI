import { CATEGORIE_PROGRAMME_LABEL, type ProgrammePret } from "@/lib/programmes-prets/catalogue";
import Image from "next/image";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";
import { ExerciceVideo } from "@/components/programme/exercice-video";
import { ProgrammePurchaseButton } from "@/components/programme/programme-purchase-button";
import { ProgrammeCoverAction } from "@/components/programme/programme-cover-action";
import { exerciceAvecMediasCoai, exerciceBibliothequePourNom } from "@/lib/exercices/media-coai";
import { getExperienceProgramme } from "@/lib/programmes-prets/experience";
import Link from "next/link";

// Carte programme prêt à l'emploi (19/08/2026), même langage visuel que
// RecetteCard : visuel COAI en fond, badges catégorie/durée, détail
// (semaine type / journées) replié dans un <details> natif.
export function ProgrammePretCard({
  programme,
  photoUrl,
  deverrouille,
  connecte,
  choixOfferts,
  gratuit,
  suiviInclus,
}: {
  programme: ProgrammePret;
  photoUrl: string | null;
  deverrouille: boolean;
  connecte: boolean;
  choixOfferts: { slug: string; nom: string }[];
  gratuit: boolean;
  suiviInclus: boolean;
}) {
  const experience = getExperienceProgramme(programme);
  const nombreSeances = Number(programme.frequence.match(/\d+/)?.[0] ?? programme.jours.length);
  const joursCalendrier = ["Lundi", "Mercredi", "Samedi", "Dimanche", "Mardi"];
  const detailsId = `details-programme-${programme.slug}`;
  const achatId = `achat-programme-${programme.slug}`;
  // Une démonstration de programme doit toujours pointer vers un exercice
  // canonique du catalogue, avec photo et vidéo COAI réellement disponibles.
  // Les variantes approximatives (ou les anciens clips mannequin) sont
  // retirées plutôt que présentées comme une correspondance valide.
  const mediasDisponibles = (programme.medias ?? []).flatMap((nom) => {
    const canonique = exerciceBibliothequePourNom(nom);
    return canonique && exerciceAvecMediasCoai(canonique.nom) ? [canonique.nom] : [];
  });

  return (
    <article id={`programme-${programme.slug}`} className="animate-reveal group scroll-mt-28 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111518] shadow-[0_24px_70px_-46px_rgba(0,0,0,.7)] transition hover:border-white/20">
      <ProgrammeCoverAction
        targetId={deverrouille ? detailsId : achatId}
        label={deverrouille ? `Voir ${programme.nom}` : `Choisir ${programme.nom}`}
      >
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={`${programme.nom} — visuel COAI`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            // Cadrage haut (demande Anthony) : les modèles sont debout, un
            // centrage vertical coupait les visages sur les couvertures.
            className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
            style={{ objectPosition: "center top" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-[#0c0e10]/70 via-40% to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {CATEGORIE_PROGRAMME_LABEL[programme.categorie]}
        </span>
        {programme.badge && (
          <span className="absolute right-3 top-3 rounded-full border border-laiton-300/50 bg-black/55 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-laiton-200 backdrop-blur-sm">
            {programme.badge}
          </span>
        )}
        {gratuit && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-300/50 bg-emerald-950/90 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200 shadow-[0_6px_20px_rgba(16,185,129,.18)] backdrop-blur-sm">
            Programme offert
          </span>
        )}
        {/* Le nom est pose sur la couverture plutot que sous elle : une
            vignette doit se lire d'un coup d'oeil, sans descendre au texte. */}
        <span className="absolute inset-x-4 bottom-11 block">
          <span className="block font-display text-xl font-semibold leading-tight tracking-[-0.02em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.85)] sm:text-2xl">
            {programme.nom.split(" — ")[0]}
          </span>
          <span className="mt-1.5 block h-px w-12 bg-laiton-300/80" aria-hidden="true" />
        </span>
        <span className="absolute bottom-3 left-4 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {programme.duree}
        </span>
        {photoUrl && <CoaiImageMark />}
      </ProgrammeCoverAction>

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

        <div className="rounded-xl border border-laiton-300/20 bg-laiton-400/[0.05] p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-laiton-200">Pack COAI 360° inclus</p>
          <p className="mt-1.5 text-[10px] leading-4 text-graphite-300">
            Calendrier · démonstrations · plan alimentaire illustré · récupération guidée · bilan · check-in · séance Plan B
          </p>
        </div>

        {gratuit && (
          <Link
            href="/videos#bonus-mobilite"
            className="rounded-xl border border-emerald-300/30 bg-emerald-950/35 p-3 transition hover:border-emerald-200/60 hover:bg-emerald-950/55"
          >
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200">Bonus streaming offert</p>
            <p className="mt-1 text-[11px] leading-5 text-emerald-50">
              Ta routine mobilité exclusive est disponible dans l&apos;espace Vidéos COAI.
            </p>
            <span className="mt-2 inline-flex text-[10px] font-semibold text-emerald-200 underline underline-offset-4">Regarder la routine →</span>
          </Link>
        )}

        {!deverrouille && (
          <>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">Objectifs</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-xs text-graphite-300">
                {programme.objectifs.slice(0, 3).map((objectif) => (
                  <li key={objectif} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-laiton-400" aria-hidden="true" />
                    {objectif}
                  </li>
                ))}
              </ul>
            </div>
            <div id={achatId} className="scroll-mt-28">
              <ProgrammePurchaseButton
                programmePrincipal={{ slug: programme.slug, nom: programme.nom }}
                choixOfferts={choixOfferts}
                connecte={connecte}
              />
            </div>
          </>
        )}

        {deverrouille && <details id={detailsId} className="group/details mt-1 scroll-mt-28 text-xs">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl border border-laiton-300/35 bg-laiton-400/[0.09] px-4 py-3 text-sm font-bold text-laiton-200 transition hover:border-laiton-300/60 hover:bg-laiton-400/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton-300">
            <span className="group-open/details:hidden">Voir le programme</span>
            <span className="hidden group-open/details:inline">Réduire le programme</span>
            <span aria-hidden="true" className="transition group-open/details:rotate-90">→</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <div className="rounded-xl border border-laiton-300/25 bg-laiton-400/[0.06] p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-laiton-200">
                Concrètement sur {programme.duree.toLowerCase()}
              </p>
              <ol className="mt-2 space-y-1.5 text-[11px] leading-5 text-graphite-300">
                <li><strong className="text-white">1.</strong> Planifie {nombreSeances} séance{nombreSeances > 1 ? "s" : ""} dans la semaine et garde au moins un jour plus léger entre les efforts exigeants.</li>
                <li><strong className="text-white">2.</strong> Répète la structure de séances affichée ci-dessous chaque semaine.</li>
                <li><strong className="text-white">3.</strong> Applique uniquement la consigne de progression correspondant à la semaine en cours.</li>
                <li><strong className="text-white">4.</strong> Fais le check-in le week-end avant de maintenir, progresser ou alléger.</li>
              </ol>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {programme.jours.slice(0, Math.min(nombreSeances, programme.jours.length)).map((jour, index) => (
                  <span key={`${jour.jour}-${index}`} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] text-graphite-200">
                    {joursCalendrier[index] ?? `Séance ${index + 1}`} · {jour.focus}
                  </span>
                ))}
              </div>
            </div>

            {programme.visuels && programme.visuels.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  Démonstrations COAI
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {programme.visuels.map((visuel, index) => {
                    // Même règle de parité dans les fiches : on alterne les
                    // modèles et on ne retombe sur l'autre sexe qu'en
                    // l'absence de média dédié.
                    const src = index % 2 === 0
                      ? visuel.photoFemme ?? visuel.photoHomme
                      : visuel.photoHomme ?? visuel.photoFemme;
                    if (!src) return null;
                    return (
                      <figure key={visuel.nom} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                        <div className="relative">
                          <Image
                            src={src}
                            alt={`${visuel.nom} — démonstration COAI`}
                            width={900}
                            height={675}
                            className="h-24 w-full object-cover object-center sm:h-28"
                          />
                          <CoaiImageMark className="bottom-1.5 right-1.5 scale-90" />
                        </div>
                        <figcaption className="px-2.5 py-2 text-[10px] leading-4 text-graphite-300">
                          {visuel.nom}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}
            {mediasDisponibles.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  Vidéos explicatives COAI
                </p>
                <p className="mt-1 text-[10px] leading-4 text-graphite-500">
                  Démonstrations réelles issues de la bibliothèque COAI. Lance chaque vidéo avant ta première série.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {mediasDisponibles.map((nom) => (
                    <div key={nom}>
                      <p className="mb-1.5 text-[10px] font-semibold text-graphite-200">{nom}</p>
                      <ExerciceVideo nom={nom} className="[&_video]:h-36 [&>div]:h-36" />
                    </div>
                  ))}
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
            {programme.progression && programme.progression.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  Progression sur {programme.duree}
                </p>
                <ol className="mt-2 flex flex-col gap-2">
                  {programme.progression.map((phase) => (
                    <li key={phase.periode} className="rounded-xl border border-laiton-400/15 bg-laiton-400/[0.04] p-2.5">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-laiton-300">
                        {phase.periode} · {phase.titre}
                      </p>
                      <p className="mt-1 leading-5 text-graphite-300">{phase.contenu}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                {programme.categorie === "CHALLENGE_30_JOURS" ? "Les 30 jours" : "Tes séances à répéter chaque semaine"}
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
            {programme.nutrition && programme.nutrition.length > 0 && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">Plan alimentaire</p>
                <ul className="mt-2 flex flex-col gap-2 text-graphite-300">
                  {programme.nutrition.map((conseil) => (
                    <li key={conseil.titre}>
                      <strong className="text-[11px] text-emerald-200">{conseil.titre} — </strong>
                      <span className="leading-5">{conseil.contenu}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {experience.nutritionVisuels.map((visuel) => (
                    <figure key={visuel.image} className="overflow-hidden rounded-lg border border-emerald-300/15 bg-black/20">
                      <div className="relative h-20">
                        <Image src={visuel.image} alt={`${visuel.nom} — recette COAI`} fill sizes="180px" className="object-cover object-center" />
                        <CoaiImageMark className="bottom-1 right-1 scale-75" />
                      </div>
                      <figcaption className="px-1.5 py-1.5 text-[8px] leading-3 text-emerald-100">{visuel.nom}</figcaption>
                    </figure>
                  ))}
                </div>
                <Link href="/programme/recettes" className="mt-2.5 inline-flex text-[10px] font-semibold text-emerald-200 underline underline-offset-4">
                  Voir les recettes détaillées →
                </Link>
              </div>
            )}
            {programme.recuperation && programme.recuperation.length > 0 && (
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200">Récupération guidée</p>
                <ul className="mt-2 flex flex-col gap-2 text-graphite-300">
                  {programme.recuperation.map((conseil) => (
                    <li key={conseil.titre}>
                      <strong className="text-[11px] text-cyan-100">{conseil.titre} — </strong>
                      <span className="leading-5">{conseil.contenu}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {experience.recuperationVisuels.map((visuel) => (
                    <figure key={visuel.image} className="overflow-hidden rounded-lg border border-cyan-200/15 bg-black/20">
                      <div className="relative h-20">
                        <Image src={visuel.image} alt={`${visuel.nom} — récupération COAI`} fill sizes="180px" className="object-cover object-center" />
                        <CoaiImageMark className="bottom-1 right-1 scale-75" />
                      </div>
                      <figcaption className="px-1.5 py-1.5 text-[8px] leading-3 text-cyan-100">{visuel.nom}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-300">Bilan départ / arrivée</p>
                <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-graphite-300">
                  {experience.bilan.map((item) => <li key={item}>✓ {item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-300">Check-in chaque semaine</p>
                <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-graphite-300">
                  {experience.checkIn.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
            <div className="rounded-xl border border-violet-300/20 bg-violet-300/[0.05] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-200">Plan B — journée chargée</p>
              <p className="mt-1.5 text-[11px] leading-5 text-graphite-300">{experience.planB}</p>
              <p className="mt-2 text-[10px] text-graphite-500"><strong className="text-graphite-300">Matériel :</strong> {experience.materiel}</p>
            </div>
            {programme.note && (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[10px] leading-4 text-graphite-500">
                {programme.note}
              </p>
            )}
            {!suiviInclus && (
              <div className="rounded-xl border border-laiton-300/30 bg-gradient-to-br from-laiton-400/[0.1] to-cyan-300/[0.04] p-3">
                <p className="text-[11px] font-semibold text-white">Tu veux que le programme évolue avec toi ?</p>
                <p className="mt-1 text-[10px] leading-4 text-graphite-300">
                  Le pack reste accessible à vie. L&apos;abonnement ajoute les ajustements selon tes résultats, ta fatigue, tes douleurs et ton temps disponible, ainsi que les conseils continus du coach COAI.
                </p>
                <Link href="/pricing" className="mt-2 inline-flex text-[10px] font-bold text-laiton-200 underline underline-offset-4">
                  Découvrir le suivi COAI →
                </Link>
              </div>
            )}
          </div>
        </details>}
      </div>
    </article>
  );
}
