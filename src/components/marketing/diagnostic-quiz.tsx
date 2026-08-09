"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { storeDiagnosticAnswers } from "@/lib/diagnostic/storage";

// Quiz public (visiteur anonyme, avant inscription) : sert d'aimant à leads
// — "on la fait goûter, et après on vend" — un aperçu personnalisé gratuit
// pour convaincre, sans jamais appeler la vraie génération IA (réservée aux
// abonnés payants, cf. canGenerateProgramme). L'aperçu est donc assemblé
// côté client à partir de règles simples, pas un vrai appel IA — ni coût,
// ni abus possible en spammant le quiz.
const AUTRE_LABEL = "Autre, à préciser";

const PERSONAS = [
  "Je ne sais pas quoi faire à la salle",
  "Je suis plutôt sédentaire",
  "Je m'entraîne à la maison, sans structure",
  "Même programme depuis des années, sans résultat",
  "Je veux progresser sans me blesser",
  AUTRE_LABEL,
];

const NIVEAUX = [
  { value: "Débutant", hint: "Peu ou pas d'expérience en musculation" },
  { value: "Intermédiaire", hint: "Tu connais les bases, tu veux structurer" },
  { value: "Avancé", hint: "Tu cherches à optimiser, pas à découvrir" },
];

const OBJECTIFS = ["Perdre du gras", "Prendre du muscle", "Me sentir mieux au quotidien", "Progresser en force"];

// Libellés alignés sur EQUIPEMENTS (profil-form.tsx) pour que la valeur
// stockée corresponde exactement aux chips du vrai formulaire de profil.
const EQUIPEMENTS = [
  "Salle de sport complète",
  "Matériel à la maison (haltères, bancs...)",
  "Élastiques / bandes de résistance",
  "Kettlebell",
  "TRX / sangles de suspension",
  "Poids du corps uniquement",
];

// Alignés sur l'enum frequenceEntrainement de /api/profil.
const FREQUENCES = ["2 fois par semaine", "3 fois par semaine", "4 fois par semaine", "5 fois ou plus par semaine"];

const CONTRAINTES = ["Dos", "Genoux", "Épaules", "Grossesse / post-partum", AUTRE_LABEL];

// Alignés sur les listes équivalentes de profil-form.tsx (mêmes libellés
// exacts) pour que le pré-remplissage post-inscription tombe pile sur les
// bonnes cases à cocher.
const SPORTS = [
  "Musculation / Fitness",
  "Course à pied",
  "Football",
  "Basketball",
  "Natation",
  "Cyclisme",
  "Boxe / Arts martiaux",
  "Tennis / Sports de raquette",
  "Yoga / Pilates",
  "CrossFit",
  "Hyrox",
  "Randonnée",
  "Breathwork / Méditation",
  "Aucun actuellement",
];

const SEXES = ["Homme", "Femme", "Préfère ne pas dire"];

const HABITUDES_ALIMENTAIRES = [
  "Repas structurés et équilibrés",
  "Grignotage fréquent / repas irréguliers",
  "Jeûne intermittent",
  "Beaucoup de plats préparés ou fast-food",
  "Déjà suivi par un nutritionniste",
];

const QUALITES_SOMMEIL = [
  "Mauvaise (moins de 5h, sommeil agité)",
  "Moyenne (5-6h, réveils fréquents)",
  "Bonne (7-8h, plutôt réparateur)",
  "Excellente (8h ou plus, réparateur)",
];

// Remplace le libellé générique "Autre, à préciser" par le texte
// effectivement saisi (si renseigné) — garde le libellé tel quel sinon,
// plutôt que de perdre la sélection.
function resolveAutre(list: string[], texteLibre: string): string[] {
  if (!list.includes(AUTRE_LABEL)) return list;
  const texte = texteLibre.trim();
  return texte ? list.map((v) => (v === AUTRE_LABEL ? texte : v)) : list;
}

const EXEMPLES_DEFAUT = ["pompes", "squats au poids du corps", "gainage"];
const EXEMPLES_PAR_EQUIPEMENT: Record<string, string[]> = {
  "Salle de sport complète": ["développé couché", "tirage poulie haute", "presse à cuisses"],
  "Matériel à la maison (haltères, bancs...)": ["développé haltères", "rowing haltère", "fentes"],
  "Élastiques / bandes de résistance": ["squat élastique", "tirage horizontal élastique", "extension triceps élastique"],
  Kettlebell: ["swing kettlebell", "goblet squat", "soulevé de terre roumain kettlebell"],
  "TRX / sangles de suspension": ["rowing TRX", "pompes TRX", "fentes bulgares TRX"],
  "Poids du corps uniquement": EXEMPLES_DEFAUT,
};

function exemplesPour(equipement: string): string[] {
  return EXEMPLES_PAR_EQUIPEMENT[equipement] ?? EXEMPLES_DEFAUT;
}

type Step =
  | "intro"
  | "persona"
  | "niveau"
  | "objectif"
  | "equipement"
  | "frequence"
  | "sport"
  | "sexe"
  | "alimentation"
  | "sommeil"
  | "sante"
  | "email"
  | "result";
// Ordonné pour couvrir explicitement les 3 piliers COAI (entraînement,
// nutrition, récupération) plutôt que de s'arrêter à l'entraînement —
// chaque question nourrit un vrai champ de Profile, jamais du remplissage.
// "email" est la dernière étape, juste avant la révélation : c'est le
// moment où la personne a le plus investi, donc le plus disposée à le
// laisser (cf. effet IKEA / coût irrécupérable).
const QUESTION_STEPS: Step[] = [
  "persona",
  "niveau",
  "objectif",
  "equipement",
  "frequence",
  "sport",
  "sexe",
  "alimentation",
  "sommeil",
  "sante",
  "email",
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function OptionCard({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-laiton-400/50 bg-laiton-400/[0.08] text-laiton-200"
          : "border-graphite-800 bg-graphite-900/60 text-graphite-200 hover:border-graphite-600 hover:text-white"
      }`}
    >
      <span className="font-medium">{label}</span>
      {hint && <span className="text-xs text-graphite-500">{hint}</span>}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-laiton-400/50 bg-laiton-400/[0.1] text-laiton-200"
          : "border-graphite-800 bg-graphite-900/60 text-graphite-300 hover:border-graphite-600 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function DiagnosticQuiz() {
  const [step, setStep] = useState<Step>("intro");
  const [persona, setPersona] = useState<string[]>([]);
  const [niveau, setNiveau] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string[]>([]);
  const [frequence, setFrequence] = useState<string | null>(null);
  const [sport, setSport] = useState<string[]>([]);
  const [sexe, setSexe] = useState<string | null>(null);
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState<string | null>(null);
  const [qualiteSommeil, setQualiteSommeil] = useState<string | null>(null);
  const [sante, setSante] = useState<string[]>([]);
  const [personaAutreTexte, setPersonaAutreTexte] = useState("");
  const [santeAutreTexte, setSanteAutreTexte] = useState("");
  const [email, setEmail] = useState("");
  const [consentEmail, setConsentEmail] = useState(false);
  const [leadEnvoi, setLeadEnvoi] = useState<"idle" | "loading">("idle");

  const stepIndex = QUESTION_STEPS.indexOf(step);
  const progressPct = stepIndex >= 0 ? Math.round((stepIndex / QUESTION_STEPS.length) * 100) : 0;

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function goNext() {
    const order: Step[] = ["intro", ...QUESTION_STEPS, "result"];
    const i = order.indexOf(step);
    const target = order[i + 1];
    if (target) setStep(target);
  }
  function goBack() {
    const order: Step[] = ["intro", ...QUESTION_STEPS, "result"];
    const i = order.indexOf(step);
    const target = order[i - 1];
    if (target) setStep(target);
  }

  const canContinue = useMemo(() => {
    if (step === "persona") return persona.length > 0;
    if (step === "niveau") return Boolean(niveau);
    if (step === "objectif") return Boolean(objectif);
    if (step === "equipement") return equipement.length > 0;
    if (step === "frequence") return Boolean(frequence);
    if (step === "sport") return true; // peut n'en pratiquer aucun
    if (step === "sexe") return Boolean(sexe);
    if (step === "alimentation") return Boolean(habitudesAlimentaires);
    if (step === "sommeil") return Boolean(qualiteSommeil);
    if (step === "sante") return true; // peut n'avoir rien à signaler
    if (step === "email") return isValidEmail(email) && consentEmail;
    return true;
  }, [step, persona, niveau, objectif, equipement, frequence, sexe, habitudesAlimentaires, qualiteSommeil, email, consentEmail]);

  const teaser = useMemo(() => {
    if (!niveau || !objectif || equipement.length === 0 || !frequence) return null;
    const premierEquipement = equipement[0] ?? "Poids du corps uniquement";
    const exemples = exemplesPour(premierEquipement);
    const santeResolue = resolveAutre(sante, santeAutreTexte);

    let description = `Avec ${equipement.length > 1 ? "ton équipement" : premierEquipement.toLowerCase()} et ${frequence.toLowerCase()}, un programme ${niveau.toLowerCase()} orienté "${objectif.toLowerCase()}" s'articulerait autour d'exercices comme ${exemples.join(", ")} — dosés et progressifs, pas une liste au hasard.`;
    if (habitudesAlimentaires || qualiteSommeil) {
      description += ` Côté nutrition et récupération, on tiendrait aussi compte de${
        habitudesAlimentaires ? ` tes habitudes actuelles (${habitudesAlimentaires.toLowerCase()})` : ""
      }${habitudesAlimentaires && qualiteSommeil ? " et de" : ""}${
        qualiteSommeil ? ` ton sommeil (${qualiteSommeil.toLowerCase()})` : ""
      }.`;
    }

    return {
      titre: `Profil ${niveau.toLowerCase()} — objectif ${objectif.toLowerCase()}`,
      description,
      alerte:
        santeResolue.length > 0
          ? `Signalé : ${santeResolue.join(", ")} — le vrai programme évite les mouvements à risque pour ces zones.`
          : null,
    };
  }, [niveau, objectif, equipement, frequence, sante, santeAutreTexte, habitudesAlimentaires, qualiteSommeil]);

  // "Audit" : on ne recommande pas la même offre à tout le monde. Douleur/
  // contrainte signalée ou plateau depuis des années → le suivi humain de
  // Transformation a plus de valeur que sur un profil sans signal
  // particulier, pour qui Impulsion suffit à démarrer.
  const recommandation = useMemo(() => {
    const aBesoinDeSuivi = sante.length > 0 || persona.includes("Même programme depuis des années, sans résultat");
    return aBesoinDeSuivi
      ? {
          plan: "STANDARD" as const,
          label: "Transformation",
          raison:
            sante.length > 0
              ? "Vu la contrainte que tu as signalée, un coach diplômé d'État qui valide et suit ton programme nous semble plus rassurant."
              : "Casser un plateau qui dure demande souvent un vrai suivi humain, pas juste un nouveau programme.",
        }
      : {
          plan: "GRATUIT" as const,
          label: "Impulsion",
          raison: "Ton profil n'a pas de signal particulier — de quoi démarrer efficacement, sans surpayer.",
        };
  }, [sante, persona]);

  function signUpHref(standard: boolean): string {
    const params = new URLSearchParams();
    if (standard) params.set("plan", "STANDARD");
    if (email) params.set("email", email);
    const query = params.toString();
    return query ? `/sign-up?${query}` : "/sign-up";
  }

  function handleCreerCompte() {
    const personaAutreResolue = personaAutreTexte.trim();
    storeDiagnosticAnswers({
      niveau: niveau ?? undefined,
      objectifs: [objectif, personaAutreResolue].filter(Boolean).join(" — ") || undefined,
      equipementDisponible: equipement.length ? equipement.join(", ") : undefined,
      frequenceEntrainement: frequence ?? undefined,
      contraintesSante: sante.length ? resolveAutre(sante, santeAutreTexte).join(", ") : undefined,
      sexe: sexe ?? undefined,
      sportsPratiques: sport.length ? sport.join(", ") : undefined,
      habitudesAlimentaires: habitudesAlimentaires ?? undefined,
      qualiteSommeil: qualiteSommeil ?? undefined,
    });
  }

  // Capture le lead avant de révéler le résultat — best-effort : n'importe
  // quel souci réseau/serveur ne doit jamais empêcher la personne de voir
  // son diagnostic, elle a déjà répondu à 10 questions pour ça.
  async function submitLeadAndReveal() {
    setLeadEnvoi("loading");
    try {
      await fetch("/api/diagnostic-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reponses: {
            persona: resolveAutre(persona, personaAutreTexte),
            niveau,
            objectif,
            equipement,
            frequence,
            sport,
            sexe,
            habitudesAlimentaires,
            qualiteSommeil,
            sante: resolveAutre(sante, santeAutreTexte),
          },
        }),
      });
    } catch {
      // best-effort, cf. commentaire ci-dessus
    } finally {
      setLeadEnvoi("idle");
      goNext();
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)]">
        {step !== "intro" && step !== "result" && (
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-400">
              Étape {stepIndex + 1}/{QUESTION_STEPS.length}
            </span>
            <div className="h-1 w-28 overflow-hidden rounded-full bg-graphite-800">
              <div
                className="h-full rounded-full bg-laiton-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-7 sm:px-8">
          {step === "intro" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <SectionLabel>Diagnostic COAI</SectionLabel>
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
                Construisons ton profil.
              </h1>
              <p className="max-w-sm text-sm leading-6 text-graphite-400">
                6 questions rapides, aucune bonne ou mauvaise réponse — à la fin, tu vois un
                aperçu de ce que ton programme pourrait être. Gratuit, sans inscription.
              </p>
              <Button onClick={goNext} className="mt-2">
                Commencer
              </Button>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite-600">
                ≈ 60 secondes
              </span>
            </div>
          )}

          {step === "persona" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Qu&apos;est-ce qui te ressemble ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Coche tout ce qui s&apos;applique.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERSONAS.map((p) => (
                  <Chip key={p} label={p} active={persona.includes(p)} onClick={() => toggle(persona, p, setPersona)} />
                ))}
              </div>
              {persona.includes(AUTRE_LABEL) && (
                <input
                  type="text"
                  value={personaAutreTexte}
                  onChange={(e) => setPersonaAutreTexte(e.target.value)}
                  placeholder="Précise en quelques mots..."
                  className="w-full rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60"
                />
              )}
            </div>
          )}

          {step === "niveau" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ton niveau aujourd&apos;hui ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Sois honnête, pas ambitieux.</p>
              </div>
              <div className="flex flex-col gap-2">
                {NIVEAUX.map((n) => (
                  <OptionCard key={n.value} label={n.value} hint={n.hint} active={niveau === n.value} onClick={() => setNiveau(n.value)} />
                ))}
              </div>
            </div>
          )}

          {step === "objectif" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ton objectif principal ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Un seul, celui qui compte le plus maintenant.</p>
              </div>
              <div className="flex flex-col gap-2">
                {OBJECTIFS.map((o) => (
                  <OptionCard key={o} label={o} active={objectif === o} onClick={() => setObjectif(o)} />
                ))}
              </div>
            </div>
          )}

          {step === "equipement" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ton équipement ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Coche tout ce qui est vraiment disponible.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {EQUIPEMENTS.map((e) => (
                  <Chip key={e} label={e} active={equipement.includes(e)} onClick={() => toggle(equipement, e, setEquipement)} />
                ))}
              </div>
            </div>
          )}

          {step === "frequence" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ta fréquence idéale ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Vise ce que tu peux tenir sur la durée.</p>
              </div>
              <div className="flex flex-col gap-2">
                {FREQUENCES.map((f) => (
                  <OptionCard key={f} label={f} active={frequence === f} onClick={() => setFrequence(f)} />
                ))}
              </div>
            </div>
          )}

          {step === "sport" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Tu pratiques déjà un sport ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Coche tout ce qui s&apos;applique, ou passe si aucun.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <Chip key={s} label={s} active={sport.includes(s)} onClick={() => toggle(sport, s, setSport)} />
                ))}
              </div>
            </div>
          )}

          {step === "sexe" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ton sexe ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Sert à ajuster les repères caloriques et protéiques — jamais un jugement sur ton apparence.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {SEXES.map((s) => (
                  <OptionCard key={s} label={s} active={sexe === s} onClick={() => setSexe(s)} />
                ))}
              </div>
            </div>
          )}

          {step === "alimentation" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Tes habitudes alimentaires aujourd&apos;hui ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Ce qui se rapproche le plus de ta réalité actuelle.</p>
              </div>
              <div className="flex flex-col gap-2">
                {HABITUDES_ALIMENTAIRES.map((h) => (
                  <OptionCard key={h} label={h} active={habitudesAlimentaires === h} onClick={() => setHabitudesAlimentaires(h)} />
                ))}
              </div>
            </div>
          )}

          {step === "sommeil" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Ta qualité de sommeil ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Important pour la récupération, pas juste l&apos;entraînement.</p>
              </div>
              <div className="flex flex-col gap-2">
                {QUALITES_SOMMEIL.map((s) => (
                  <OptionCard key={s} label={s} active={qualiteSommeil === s} onClick={() => setQualiteSommeil(s)} />
                ))}
              </div>
            </div>
          )}

          {step === "sante" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Douleurs ou contraintes à connaître ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Coche ce qui s&apos;applique, ou passe si rien à signaler.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CONTRAINTES.map((c) => (
                  <Chip key={c} label={c} active={sante.includes(c)} onClick={() => toggle(sante, c, setSante)} />
                ))}
              </div>
              {sante.includes(AUTRE_LABEL) && (
                <Input
                  type="text"
                  value={santeAutreTexte}
                  onChange={(e) => setSanteAutreTexte(e.target.value)}
                  placeholder="Précise en quelques mots..."
                />
              )}
            </div>
          )}

          {step === "email" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Dernière étape.</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Ton email pour voir ton diagnostic et le retrouver plus tard.
                </p>
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.fr"
                autoComplete="email"
              />
              <label className="flex items-start gap-2 text-xs leading-5 text-graphite-400">
                <input
                  type="checkbox"
                  checked={consentEmail}
                  onChange={(e) => setConsentEmail(e.target.checked)}
                  className="mt-0.5"
                />
                J&apos;accepte de recevoir mon diagnostic et des informations sur COAI par email.
                Désinscription possible à tout moment.
              </label>
            </div>
          )}

          {step === "result" && teaser && (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <SectionLabel>Ton diagnostic</SectionLabel>
              <h2 className="font-display text-2xl font-semibold text-white">{teaser.titre}.</h2>
              <p className="max-w-sm text-sm leading-6 text-graphite-300">{teaser.description}</p>
              {teaser.alerte && (
                <p className="max-w-sm rounded-lg border border-acier/40 bg-acier/10 px-3 py-2 text-xs leading-5 text-acier">
                  {teaser.alerte}
                </p>
              )}

              <div className="w-full max-w-sm rounded-xl border border-laiton-400/25 bg-laiton-400/[0.06] px-4 py-4 text-left">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-400">
                  Notre recommandation
                </span>
                <p className="mt-1.5 font-display text-lg font-semibold text-white">{recommandation.label}</p>
                <p className="mt-1 text-xs leading-5 text-graphite-400">{recommandation.raison}</p>
              </div>

              <div className="mt-1 flex w-full max-w-xs flex-col gap-2">
                <Link href={signUpHref(recommandation.plan === "STANDARD")} onClick={handleCreerCompte}>
                  <Button className="w-full">Créer mon compte — {recommandation.label} →</Button>
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-600">
                  7 jours offerts, sans engagement
                </span>
                <Link
                  href={signUpHref(recommandation.plan !== "STANDARD")}
                  onClick={handleCreerCompte}
                  className="mt-1 text-xs text-graphite-500 underline hover:text-graphite-300"
                >
                  Je préfère {recommandation.plan === "STANDARD" ? "Impulsion" : "Transformation"}
                </Link>
              </div>
            </div>
          )}
        </div>

        {step !== "intro" && step !== "result" && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
            <button
              type="button"
              onClick={goBack}
              className="font-mono text-xs uppercase tracking-[0.12em] text-graphite-500 transition hover:text-white"
            >
              ← Retour
            </button>
            <Button
              variant="primary"
              onClick={step === "email" ? submitLeadAndReveal : goNext}
              disabled={!canContinue || leadEnvoi === "loading"}
              className="px-6 py-2.5 text-sm"
            >
              {step === "email" ? (leadEnvoi === "loading" ? "…" : "Voir mon diagnostic →") : "Continuer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
