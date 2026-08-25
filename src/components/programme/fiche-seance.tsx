import { MUSCLE_LABEL, musclesPourExercice } from "@/lib/exercices/muscles";
import { variantesPourExercice } from "@/lib/exercices/variantes";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";

// Fiche de séance partageable (23/08/2026, format validé par Anthony sur
// maquette) — pensée pour être imprimée en PDF et postée en story.
//
// Rendue en composant serveur, sans état : c'est ce qui permet à
// l'impression navigateur de produire un PDF fidèle. Une version client
// avec animations aurait donné un PDF incomplet ou décalé.
//
// Photos en noir et blanc via filtre CSS, jamais retraitées ni stockées en
// double : le même fichier sert la fiche et la bibliothèque, et le
// traitement s'applique aussi aux photos futures.

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const texte = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/** Silhouette simplifiée face/dos — un PDF ne peut pas embarquer le
 *  composant React MuscleMap. Les deux vues sont volontairement très
 *  différentes : sans ça, impossible de savoir si le schéma montre
 *  l'avant ou l'arrière du corps (retour d'Anthony sur la maquette). */
function Silhouette({ muscles, vue }: { muscles: string[]; vue: "front" | "back" }) {
  const OR = "#D4AF37";
  const GRIS = "#2A2D35";
  const actif = (...cles: string[]) =>
    muscles.some((m) => cles.some((c) => m.includes(c))) ? OR : GRIS;

  if (vue === "back") {
    return (
      <svg width="34" height="60" viewBox="0 0 30 54" aria-hidden="true">
        <circle cx="15" cy="5" r="4.2" fill="#1E2128" />
        <path d="M11 9.5 q4 2.5 8 0 v9 q-4 2 -8 0 z" fill={actif("lat", "trap", "back")} />
        <path d="M10 18 l5 8 l5 -8 v6 l-5 7 l-5 -7 z" fill={actif("lat", "back")} />
        <rect x="4" y="11" width="5" height="13" rx="2.5" fill={actif("bicep", "tricep", "forearm", "delt")} />
        <rect x="21" y="11" width="5" height="13" rx="2.5" fill={actif("bicep", "tricep", "forearm", "delt")} />
        <rect x="10.2" y="31" width="4.2" height="12" rx="2" fill={actif("glute", "hamstring", "calv")} />
        <rect x="15.6" y="31" width="4.2" height="12" rx="2" fill={actif("glute", "hamstring", "calv")} />
      </svg>
    );
  }
  return (
    <svg width="34" height="60" viewBox="0 0 30 54" aria-hidden="true">
      <circle cx="15" cy="5" r="4.2" fill={GRIS} />
      <circle cx="13.3" cy="4.4" r="0.7" fill="#0D0E12" />
      <circle cx="16.7" cy="4.4" r="0.7" fill="#0D0E12" />
      <path d="M10 10 h10 v7 h-10 z" fill={actif("chest", "pector")} />
      <rect x="10" y="17.5" width="10" height="7" rx="1.5" fill={actif("abdomin", "oblique")} />
      <rect x="4" y="11" width="5" height="13" rx="2.5" fill={actif("bicep", "tricep", "forearm", "delt", "shoulder")} />
      <rect x="21" y="11" width="5" height="13" rx="2.5" fill={actif("bicep", "tricep", "forearm", "delt", "shoulder")} />
      <rect x="10.2" y="26" width="4.2" height="17" rx="2" fill={actif("quad", "glute", "calv", "adduct")} />
      <rect x="15.6" y="26" width="4.2" height="17" rx="2" fill={actif("quad", "glute", "calv", "adduct")} />
    </svg>
  );
}

export function FicheSeance({
  nomSeance,
  dureeMinutes,
  echauffement,
  exercices,
  retourAuCalme,
  prenom,
}: {
  nomSeance: string;
  dureeMinutes?: number | null;
  echauffement?: string | null;
  exercices: unknown[];
  retourAuCalme?: string | null;
  prenom?: string | null;
}) {
  const valides = exercices.filter(isObj);

  return (
    <article className="fiche-seance mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0D0E12]">
      {/* En-tête */}
      <header className="grid border-b border-white/10 sm:grid-cols-[1.35fr_1fr]">
        <div className="bg-gradient-to-br from-laiton-400/[0.12] to-transparent px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-laiton-400">
            Séance du jour · COAI
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
            {nomSeance}
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-400">
            {valides.length} exercice{valides.length > 1 ? "s" : ""}
            {dureeMinutes ? ` · ${dureeMinutes} min` : ""}
            {prenom ? ` · ${prenom}` : ""}
          </p>
        </div>
        <div className="border-t border-white/10 px-5 py-5 sm:border-l sm:border-t-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-400">Objectif</p>
          <div className="mt-2.5 flex flex-col gap-1.5 text-[12.5px] text-graphite-200">
            <span>✓ Respecter la technique avant la charge</span>
            <span>✓ Tenir les temps de repos indiqués</span>
            <span>✓ Finir la séance sans douleur</span>
          </div>
        </div>
      </header>

      {/* Conseils en tête — validé sur maquette : l'échauffement précis et la
          sécurité valent mieux en amont qu'en bas de page. */}
      <section className="border-b border-white/10 bg-laiton-400/[0.045] px-6 py-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-laiton-400">
          Conseils du coach
        </p>
        <div className="mt-2.5 grid gap-4 sm:grid-cols-[1.6fr_1fr_1.1fr]">
          <div>
            <p className="font-display text-[11px] font-extrabold uppercase tracking-wide text-white">
              Échauffement
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-graphite-400">
              {echauffement ??
                "5 à 10 min de cardio léger, puis mobilité ciblée sur les articulations de la séance. Gamme montante sur le premier exercice lourd."}
            </p>
          </div>
          <div>
            <p className="font-display text-[11px] font-extrabold uppercase tracking-wide text-white">
              Hydratation
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-graphite-400">
              Bois régulièrement pendant toute la séance, sans attendre la soif.
            </p>
          </div>
          <div>
            <p className="font-display text-[11px] font-extrabold uppercase tracking-wide text-white">
              Sécurité
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-graphite-400">
              Sur charge lourde en poids libre, fais-toi assurer — ou reste sur machine guidée si tu es seul.
            </p>
          </div>
        </div>
      </section>

      {/* Exercices */}
      {valides.map((ex, i) => {
        const nom = texte(ex.nom) ?? `Exercice ${i + 1}`;
        const photo = photoCoaiPourNom(nom);
        const cible = musclesPourExercice(nom);
        const variante = variantesPourExercice(nom)[0];
        const methode = texte(ex.methode);

        return (
          <div key={i} className="grid border-b border-white/10 last:border-b-0 sm:grid-cols-[150px_1fr_168px]">
            <div className="relative min-h-[118px] overflow-hidden bg-[#111]">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element -- sources externes/publiques, next/image imposerait de whitelister les domaines
                <img
                  src={photo}
                  alt=""
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              )}
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-laiton-400 font-display text-[13px] font-black text-[#0D0E12]">
                {i + 1}
              </span>
              {photo && <CoaiImageMark className="bottom-2 right-2" />}
            </div>

            <div className="flex flex-col justify-center gap-1.5 px-4 py-4">
              <h2 className="font-display text-[17px] font-extrabold uppercase leading-tight tracking-tight text-white">
                {nom}
              </h2>
              {cible && (
                <div className="mt-0.5 flex items-center gap-2.5">
                  <Silhouette muscles={cible.muscles} vue={cible.vue} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-graphite-500">
                    Vue de {cible.vue === "back" ? "dos" : "face"}
                    <b className="mt-0.5 block text-[10px] tracking-[0.05em] text-laiton-400">
                      {cible.muscles.map((m) => MUSCLE_LABEL[m]).filter(Boolean).join(" · ")}
                    </b>
                  </span>
                </div>
              )}
              {variante && (
                <div className="mt-1 border-l-2 border-acier/50 pl-2">
                  <span className="block font-mono text-[8.5px] uppercase tracking-[0.14em] text-acier">
                    Alternative
                  </span>
                  <span className="text-[10.5px] leading-snug text-graphite-400">
                    {variante.nom} — {variante.consigne}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-1.5 border-t border-white/10 bg-white/[0.015] px-3.5 py-3 sm:border-l sm:border-t-0">
              {texte(ex.series) && (
                <div className="rounded-md bg-laiton-400 px-2 py-1.5 text-center font-display text-[13px] font-black text-[#0D0E12]">
                  {texte(ex.series)}{/\d$/.test(texte(ex.series) ?? "") ? " séries" : ""}
                </div>
              )}
              {texte(ex.repetitions) && (
                <div className="rounded-md border border-laiton-400/30 bg-laiton-400/[0.12] px-2 py-1.5 text-center text-[12px] font-bold text-laiton-200">
                  {texte(ex.repetitions)}
                </div>
              )}
              {texte(ex.repos) && (
                <div className="text-center font-mono text-[9px] uppercase tracking-[0.07em] text-graphite-500">
                  Repos {texte(ex.repos)}
                </div>
              )}
              {methode && (
                <div className="rounded-md border border-acier/25 bg-acier/[0.07] px-1.5 py-1 text-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-acier">
                  {methode}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Bas de fiche */}
      <section className="grid border-t border-white/10 sm:grid-cols-2">
        <div className="px-5 py-4">
          <h3 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-laiton-400">
            Retour au calme
          </h3>
          <p className="mt-2 text-[11.5px] leading-relaxed text-graphite-400">
            {retourAuCalme ??
              "Étirements légers des groupes travaillés, 5 à 10 min. Respiration lente pour faire redescendre le rythme cardiaque."}
          </p>
        </div>
        <div className="border-t border-white/10 px-5 py-4 sm:border-l sm:border-t-0">
          <h3 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-laiton-400">
            Après la séance
          </h3>
          <div className="mt-2 flex flex-col gap-1 text-[11.5px] text-graphite-400">
            <span>Repas protéines + glucides dans l&apos;heure</span>
            <span>500 ml à 1 L d&apos;eau pour compenser</span>
            <span>7 h de sommeil avant la prochaine séance lourde</span>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-laiton-400/[0.045] px-5 py-4">
        <h3 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-laiton-400">
          Progresser d&apos;une semaine sur l&apos;autre
        </h3>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
          {[
            "Toutes les séries au haut de la fourchette ? Monte de 2,5 kg en haut du corps, 5 kg en bas.",
            "Une charge qui stagne 2 semaines ? Garde-la et ajoute une série.",
            "Technique qui se dégrade avant la dernière rep ? Baisse de 10 % et reconstruis proprement.",
          ].map((t, i) => (
            <p key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-graphite-400">
              <span className="mt-px flex h-4 w-4 flex-none items-center justify-center rounded bg-laiton-400 font-display text-[9px] font-black text-[#0D0E12]">
                {i + 1}
              </span>
              {t}
            </p>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-laiton-400/[0.05] py-3 text-center font-mono text-[9.5px] uppercase tracking-[0.15em] text-graphite-500">
        Écoute ton corps · <b className="text-laiton-400">COAI — Personal Training, reimagined</b>
      </footer>
    </article>
  );
}
