"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { storeDiagnosticAnswers } from "@/lib/diagnostic/storage";
import { buildMiniDiagnostic, AUCUNE_DOULEUR_LABEL, RESULTATS_TIMELINE } from "@/lib/diagnostic/mini-diagnostic";
import { Badge } from "@/components/ui/badge";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";

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

// Lieu d'entraînement (Phase 5, 11/08/2026) — distinct de l'équipement :
// deux personnes peuvent avoir le même matériel mais un lieu différent
// (salle vs maison vs extérieur), ce qui change la structure du programme
// (trajet, disponibilité, ambiance). Alignés sur profil-form.tsx.
const LIEUX = ["Salle de sport", "À la maison", "En extérieur", "Ça dépend des jours"];

// Durée de séance visée (Phase 5, 11/08/2026) — jusque-là jamais demandée,
// la génération de programme utilisait une durée implicite non renseignée.
const DUREES = ["30 minutes", "45 minutes", "1 heure", "1h30 ou plus"];
// Valeur numérique envoyée à Profile.dureeSeanceMinutes (1h30 ou plus → 90,
// valeur plancher plutôt qu'une fourchette non représentable en Int).
const DUREE_EN_MINUTES: Record<string, number> = {
  "30 minutes": 30,
  "45 minutes": 45,
  "1 heure": 60,
  "1h30 ou plus": 90,
};

// Messages du step "analyse" (Phase 5, 11/08/2026) — reflètent ce qui est
// réellement fait avec les réponses (calcul du split, du format...), pas du
// texte générique type "chargement...".
const ANALYSE_MESSAGES = [
  "Analyse de ton objectif...",
  "Calcul de ton format d'entraînement...",
  "Personnalisation de ton profil...",
];

const CONTRAINTES = [AUCUNE_DOULEUR_LABEL, "Dos", "Genoux", "Épaules", "Grossesse / post-partum", AUTRE_LABEL];

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
  AUTRE_LABEL,
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

type Step =
  | "intro"
  | "persona"
  | "niveau"
  | "objectif"
  | "equipement"
  | "lieu"
  | "duree"
  | "frequence"
  | "sport"
  | "sexe"
  | "profilPhysique"
  | "alimentation"
  | "sommeil"
  | "sante"
  | "email"
  | "analyse"
  | "result";
// Ordonné pour couvrir explicitement les 3 piliers COAI (entraînement,
// nutrition, récupération) plutôt que de s'arrêter à l'entraînement —
// chaque question nourrit un vrai champ de Profile, jamais du remplissage.
// "email" est la dernière étape, juste avant la révélation : c'est le
// moment où la personne a le plus investi, donc le plus disposée à le
// laisser (cf. effet IKEA / coût irrécupérable).
// "lieu"/"duree" (Phase 5, 11/08/2026) : lieu distinct de l'équipement,
// durée de séance visée — deux infos jusque-là jamais demandées.
// "profilPhysique" regroupe âge/taille/poids en une seule étape, tous
// facultatifs (peu de friction, mais utile pour un aperçu plus précis).
// "analyse" (Phase 5) : moment de transition avant la révélation, pas une
// vraie question — exclu de la barre de progression comme "result".
const QUESTION_STEPS: Step[] = [
  "persona",
  "niveau",
  "objectif",
  "equipement",
  "lieu",
  "duree",
  "frequence",
  "sport",
  "sexe",
  "profilPhysique",
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

function VoletCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col rounded-xl border border-graphite-800 bg-graphite-900/50 px-4 py-4 text-left">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">{label}</span>
      <div className="mt-1.5 text-sm leading-6 text-graphite-300">{children}</div>
    </div>
  );
}

// Présentation des 3 formules pour l'écran de résultat (11/08/2026, demande
// d'Anthony) : la personne qui fait le quiz ne connaît pas les noms/offres
// COAI, "Notre recommandation : Transformation" seul ne veut rien dire sans
// contexte — on explique les 3 en même temps que la recommandation.
const FORMULES = [
  {
    plan: "GRATUIT" as const,
    nom: "Impulsion",
    prix: "19€/mois",
    accroche: "Coaching 100% IA pour démarrer sans attendre.",
    bullets: [
      "Programme généré par IA (entraînement, nutrition, récupération)",
      "Suivi séances, mesures, progression",
      "Coach IA — 4 questions/mois",
    ],
  },
  {
    plan: "STANDARD" as const,
    nom: "Transformation",
    prix: "49€/mois",
    accroche: "L'IA génère, un coach diplômé d'État valide et te suit jusqu'à ton objectif.",
    bullets: [
      "Suivi de progression avec un coach diplômé d'État, jusqu'à l'atteinte de tes objectifs",
      "Chaque programme relu et validé par un vrai coach",
      "Coach IA illimité, disponible 24h/24, 7j/7",
      "1 séance visio/mois avec Anthony Darmon incluse",
    ],
  },
  {
    plan: "VIP" as const,
    nom: "VIP",
    prix: "dès 100€/séance",
    accroche: "Coaching 100% humain avec Anthony, à la séance.",
    bullets: ["1-to-1 avec Anthony Darmon", "Présentiel ou visio", "Sans abonnement"],
  },
];

function FormuleCard({
  formule,
  recommandee,
  cta,
}: {
  formule: (typeof FORMULES)[number];
  recommandee: boolean;
  cta: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-5 text-left ${
        recommandee ? "border-laiton-400/40 bg-laiton-400/[0.06]" : "border-graphite-800 bg-graphite-900/40"
      }`}
    >
      {recommandee && <Badge tone="success">Recommandé pour toi</Badge>}
      <div>
        <p className="font-display text-lg font-semibold text-white">{formule.nom}</p>
        <p className="font-mono text-sm text-laiton-300">{formule.prix}</p>
      </div>
      <p className="text-xs leading-5 text-graphite-400">{formule.accroche}</p>
      <ul className="flex flex-col gap-1.5 text-xs leading-5 text-graphite-300">
        {formule.bullets.map((b) => (
          <li key={b} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-laiton-400">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1">{cta}</div>
    </div>
  );
}

export function DiagnosticQuiz() {
  const [step, setStep] = useState<Step>("intro");
  const [persona, setPersona] = useState<string[]>([]);
  const [niveau, setNiveau] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string[]>([]);
  const [lieu, setLieu] = useState<string | null>(null);
  const [duree, setDuree] = useState<string | null>(null);
  const [frequence, setFrequence] = useState<string | null>(null);
  const [sport, setSport] = useState<string[]>([]);
  const [sexe, setSexe] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [tailleCm, setTailleCm] = useState("");
  const [poidsKg, setPoidsKg] = useState("");
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState<string | null>(null);
  const [qualiteSommeil, setQualiteSommeil] = useState<string | null>(null);
  const [sante, setSante] = useState<string[]>([]);
  const [personaAutreTexte, setPersonaAutreTexte] = useState("");
  const [santeAutreTexte, setSanteAutreTexte] = useState("");
  const [sportAutreTexte, setSportAutreTexte] = useState("");
  const [email, setEmail] = useState("");
  const [consentEmail, setConsentEmail] = useState(false);
  const [leadEnvoi, setLeadEnvoi] = useState<"idle" | "loading">("idle");

  const stepIndex = QUESTION_STEPS.indexOf(step);
  const progressPct = stepIndex >= 0 ? Math.round((stepIndex / QUESTION_STEPS.length) * 100) : 0;

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  // "Aucune, je suis en pleine forme" est exclusif avec toute vraie
  // contrainte : la sélectionner efface le reste, en sélectionner une
  // efface "Aucune" — évite l'incohérence "Dos" + "Aucune douleur" en même
  // temps (demande d'Anthony du 11/08/2026).
  function toggleSante(value: string) {
    if (value === AUCUNE_DOULEUR_LABEL) {
      setSante((prev) => (prev.includes(AUCUNE_DOULEUR_LABEL) ? [] : [AUCUNE_DOULEUR_LABEL]));
      return;
    }
    setSante((prev) => {
      const sansAucune = prev.filter((v) => v !== AUCUNE_DOULEUR_LABEL);
      return sansAucune.includes(value) ? sansAucune.filter((v) => v !== value) : [...sansAucune, value];
    });
  }

  const STEP_ORDER: Step[] = ["intro", ...QUESTION_STEPS, "analyse", "result"];

  function goNext() {
    const i = STEP_ORDER.indexOf(step);
    const target = STEP_ORDER[i + 1];
    if (target) setStep(target);
  }
  function goBack() {
    const i = STEP_ORDER.indexOf(step);
    // "analyse" n'est pas une vraie étape (rien à corriger) : "Retour" depuis
    // "result" n'existe pas (pas de bouton nav sur ce step), et "analyse"
    // enchaîne automatiquement vers "result" sans jamais s'arrêter dessus.
    const target = STEP_ORDER[i - 1];
    if (target) setStep(target);
  }

  // "COAI analyse ton profil" (Phase 5, 11/08/2026) : moment de transition
  // volontaire avant la révélation — la personne vient de répondre à 14
  // questions, ce court passage matérialise le "travail" fait sur ses
  // réponses plutôt qu'un résultat qui apparaît instantanément.
  const [analyseIndex, setAnalyseIndex] = useState(0);
  useEffect(() => {
    if (step !== "analyse") return;
    setAnalyseIndex(0);
    const stepDuration = 750;
    const messageInterval = setInterval(() => {
      setAnalyseIndex((i) => (i + 1 < ANALYSE_MESSAGES.length ? i + 1 : i));
    }, stepDuration);
    const advance = setTimeout(goNext, stepDuration * ANALYSE_MESSAGES.length + 300);
    return () => {
      clearInterval(messageInterval);
      clearTimeout(advance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === "persona") return persona.length > 0;
    if (step === "niveau") return Boolean(niveau);
    if (step === "objectif") return Boolean(objectif);
    if (step === "equipement") return equipement.length > 0;
    if (step === "lieu") return Boolean(lieu);
    if (step === "duree") return Boolean(duree);
    if (step === "frequence") return Boolean(frequence);
    if (step === "sport") return true; // peut n'en pratiquer aucun
    if (step === "sexe") return Boolean(sexe);
    if (step === "profilPhysique") return true; // âge/taille/poids facultatifs
    if (step === "alimentation") return Boolean(habitudesAlimentaires);
    if (step === "sommeil") return Boolean(qualiteSommeil);
    if (step === "sante") return true; // peut n'avoir rien à signaler
    if (step === "email") return isValidEmail(email) && consentEmail;
    return true;
  }, [step, persona, niveau, objectif, equipement, lieu, duree, frequence, sexe, habitudesAlimentaires, qualiteSommeil, email, consentEmail]);

  // Même logique que l'email envoyé au lead (/api/diagnostic-lead) — extraite
  // dans lib/diagnostic/mini-diagnostic.ts pour garantir que les deux disent
  // exactement la même chose.
  const diagnostic = useMemo(
    () =>
      buildMiniDiagnostic({
        persona: resolveAutre(persona, personaAutreTexte),
        niveau,
        objectif,
        equipement,
        lieu,
        duree,
        frequence,
        habitudesAlimentaires,
        qualiteSommeil,
        sante: resolveAutre(sante, santeAutreTexte),
      }),
    [
      persona,
      personaAutreTexte,
      niveau,
      objectif,
      equipement,
      lieu,
      duree,
      frequence,
      habitudesAlimentaires,
      qualiteSommeil,
      sante,
      santeAutreTexte,
    ]
  );

  function signUpHref(standard: boolean): string {
    const params = new URLSearchParams();
    if (standard) params.set("plan", "STANDARD");
    if (email) params.set("email", email);
    const query = params.toString();
    return query ? `/sign-up?${query}` : "/sign-up";
  }

  const vipHref = buildWhatsAppLink(
    "Bonjour Anthony, je viens de faire le diagnostic sur coai.fr et je suis intéressé(e) par une séance VIP."
  );

  function handleCreerCompte() {
    const personaAutreResolue = personaAutreTexte.trim();
    const santeReelle = resolveAutre(sante, santeAutreTexte).filter((s) => s !== AUCUNE_DOULEUR_LABEL);
    const sportResolu = resolveAutre(sport, sportAutreTexte);
    storeDiagnosticAnswers({
      niveau: niveau ?? undefined,
      objectifs: [objectif, personaAutreResolue].filter(Boolean).join(" — ") || undefined,
      equipementDisponible: equipement.length ? equipement.join(", ") : undefined,
      lieuEntrainement: lieu ?? undefined,
      dureeSeanceMinutes: duree ? DUREE_EN_MINUTES[duree] : undefined,
      frequenceEntrainement: frequence ?? undefined,
      contraintesSante: santeReelle.length ? santeReelle.join(", ") : undefined,
      sexe: sexe ?? undefined,
      sportsPratiques: sportResolu.length ? sportResolu.join(", ") : undefined,
      habitudesAlimentaires: habitudesAlimentaires ?? undefined,
      qualiteSommeil: qualiteSommeil ?? undefined,
      age: age ? Number(age) : undefined,
      tailleCm: tailleCm ? Number(tailleCm) : undefined,
      poidsKg: poidsKg ? Number(poidsKg) : undefined,
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
            lieu,
            duree,
            frequence,
            sport: resolveAutre(sport, sportAutreTexte),
            sexe,
            age: age ? Number(age) : undefined,
            tailleCm: tailleCm ? Number(tailleCm) : undefined,
            poidsKg: poidsKg ? Number(poidsKg) : undefined,
            habitudesAlimentaires,
            qualiteSommeil,
            sante: resolveAutre(sante, santeAutreTexte),
          },
        }),
      });
    } catch {
      // best-effort, cf. commentaire ci-dessus
    } finally {
      // Seul point d'entrée du funnel qui n'envoyait encore aucun signal de
      // conversion (11/08/2026) — pourtant c'est la page vers laquelle
      // pointent les pubs Meta actuelles (cf. CLAUDE.md, /coach-sportif-paris
      // avec utm_source=meta). Déclenché sur la tentative, pas sur un succès
      // serveur confirmé, pour rester cohérent avec le best-effort ci-dessus
      // (l'utilisateur a bien complété le quiz, quoi qu'il arrive côté API).
      trackEvent("lead_diagnostic");
      trackMetaEvent("Lead");
      setLeadEnvoi("idle");
      goNext();
    }
  }

  return (
    <div className={`mx-auto w-full transition-[max-width] ${step === "result" ? "max-w-3xl" : "max-w-lg"}`}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)]">
        {step !== "intro" && step !== "result" && step !== "analyse" && (
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
                {QUESTION_STEPS.length - 1} questions rapides, aucune bonne ou mauvaise réponse —
                à la fin, tu vois un aperçu de ce que ton programme pourrait être. Gratuit, sans
                inscription.
              </p>
              <Button onClick={goNext} className="mt-2">
                Commencer
              </Button>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite-600">
                ≈ 2 minutes
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

          {step === "lieu" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Où t&apos;entraînes-tu le plus souvent ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Distinct de ton équipement — ça change la structure du programme.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {LIEUX.map((l) => (
                  <OptionCard key={l} label={l} active={lieu === l} onClick={() => setLieu(l)} />
                ))}
              </div>
            </div>
          )}

          {step === "duree" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Combien de temps par séance ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Ce que tu peux vraiment tenir, pas ce que tu voudrais.</p>
              </div>
              <div className="flex flex-col gap-2">
                {DUREES.map((d) => (
                  <OptionCard key={d} label={d} active={duree === d} onClick={() => setDuree(d)} />
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
              {sport.includes(AUTRE_LABEL) && (
                <Input
                  type="text"
                  value={sportAutreTexte}
                  onChange={(e) => setSportAutreTexte(e.target.value)}
                  placeholder="Précise en quelques mots..."
                />
              )}
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

          {step === "profilPhysique" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Quelques repères physiques ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Facultatif — sert à affiner tes repères caloriques et de charge. Tu peux passer.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Âge"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={tailleCm}
                  onChange={(e) => setTailleCm(e.target.value)}
                  placeholder="Taille (cm)"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={poidsKg}
                  onChange={(e) => setPoidsKg(e.target.value)}
                  placeholder="Poids (kg)"
                />
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
                  <Chip key={c} label={c} active={sante.includes(c)} onClick={() => toggleSante(c)} />
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

          {step === "analyse" && (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg width="96" height="96" viewBox="0 0 120 120" fill="none" className="absolute inset-0" aria-hidden="true">
                  <circle cx="60" cy="60" r="44" stroke="#26282d" strokeWidth="6" />
                  <circle
                    className="coai-loader-arc"
                    cx="60"
                    cy="60"
                    r="44"
                    stroke="#c9a262"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="90 190"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <span className="font-display text-2xl font-semibold text-white">COAI</span>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-400">
                COAI analyse ton profil
              </p>
              <p className="text-sm text-graphite-400">{ANALYSE_MESSAGES[analyseIndex]}</p>
            </div>
          )}

          {step === "result" && diagnostic && (
            <div className="flex flex-col items-center gap-7 py-2 text-center">
              <div className="flex flex-col items-center gap-3">
                <SectionLabel>Ton diagnostic</SectionLabel>
                <h2 className="coai-gradient-text font-display text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
                  Voici ce que COAI a compris de toi.
                </h2>
                <p className="max-w-md text-sm leading-6 text-graphite-300">{diagnostic.profilParagraphe}</p>
                {diagnostic.alerte && (
                  <p className="max-w-md rounded-lg border border-acier/40 bg-acier/10 px-3 py-2 text-xs leading-5 text-acier">
                    {diagnostic.alerte}
                  </p>
                )}
              </div>

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: "Objectif", valeur: diagnostic.profil.objectif },
                  { label: "Rythme", valeur: diagnostic.profil.rythme },
                  { label: "Format", valeur: diagnostic.profil.format },
                  { label: "Environnement", valeur: diagnostic.profil.environnement },
                  ...(diagnostic.profil.frein ? [{ label: "Frein", valeur: diagnostic.profil.frein }] : []),
                ].map((bloc) => (
                  <div
                    key={bloc.label}
                    className="flex flex-col gap-1 rounded-xl border border-graphite-800 bg-graphite-900/40 px-3 py-3 text-left"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-graphite-500">
                      {bloc.label}
                    </span>
                    <span className="text-xs font-medium leading-5 text-white">{bloc.valeur}</span>
                  </div>
                ))}
              </div>

              {diagnostic.pointsATravailler.length > 0 && (
                <div className="w-full rounded-xl border border-graphite-800 bg-graphite-900/50 px-5 py-4 text-left">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                    Ce qui freine ta progression aujourd&apos;hui
                  </span>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-6 text-graphite-300">
                    {diagnostic.pointsATravailler.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <span className="mt-0.5 text-acier">✕</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm leading-6 text-graphite-200">
                    <span className="font-semibold text-white">COAI corrige ces points un par un</span> —
                    voici comment, avec le programme ci-dessous.
                  </p>
                </div>
              )}

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                <VoletCard label="Entraînement">
                  {diagnostic.split && <p>{diagnostic.split}</p>}
                  <ul className="mt-2 flex flex-col gap-1 text-graphite-400">
                    {diagnostic.exercices.map((ex) => (
                      <li key={ex}>• {ex}</li>
                    ))}
                  </ul>
                </VoletCard>

                {diagnostic.nutrition && <VoletCard label="Nutrition">{diagnostic.nutrition}</VoletCard>}

                {diagnostic.recuperation && <VoletCard label="Récupération">{diagnostic.recuperation}</VoletCard>}
              </div>

              <p className="max-w-lg text-sm leading-6 text-laiton-200">{RESULTATS_TIMELINE}</p>

              <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-6 text-left">
                <SectionLabel>Ce que tu viens de voir n&apos;est qu&apos;un début</SectionLabel>
                <p className="text-sm leading-6 text-graphite-200">{diagnostic.pitchEvolution}</p>
              </div>

              <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-5 text-left sm:flex-row sm:items-center sm:gap-5">
                <span className="text-2xl">🎯</span>
                <p className="text-sm leading-6 text-graphite-200">
                  <span className="font-semibold text-white">Jamais livré à toi-même :</span> avec
                  Transformation, un <span className="text-laiton-300">coach diplômé d&apos;État</span>{" "}
                  valide ton programme et te suit dans la durée — pas juste à la génération, à chaque
                  plateau ou gêne — pendant que ton{" "}
                  <span className="text-laiton-300">Coach IA répond 24h/24, 7j/7</span> entre deux
                  séances. La vraie différence, ce n&apos;est pas la validation, c&apos;est le suivi.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4">
                <SectionLabel>Nos formules</SectionLabel>
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                  {FORMULES.map((formule) => {
                    const recommandee = formule.plan === diagnostic.recommandation.plan;
                    if (formule.plan === "VIP") {
                      return (
                        <FormuleCard
                          key={formule.nom}
                          formule={formule}
                          recommandee={recommandee}
                          cta={
                            vipHref ? (
                              <a href={vipHref} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" className="w-full">
                                  Réserver via WhatsApp
                                </Button>
                              </a>
                            ) : (
                              <Button variant="secondary" className="w-full" disabled>
                                Contacter Anthony
                              </Button>
                            )
                          }
                        />
                      );
                    }
                    return (
                      <FormuleCard
                        key={formule.nom}
                        formule={formule}
                        recommandee={recommandee}
                        cta={
                          <div className="flex flex-col gap-1.5">
                            <Link href={signUpHref(formule.plan === "STANDARD")} onClick={handleCreerCompte}>
                              <Button variant={recommandee ? "primary" : "secondary"} className="w-full">
                                Créer mon compte
                              </Button>
                            </Link>
                            <span className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-graphite-600">
                              7 jours offerts
                            </span>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-6 text-center sm:flex-row sm:text-left">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-laiton-400/25">
                  <Image
                    src="/anthony-darmon-portrait.jpg"
                    alt="Anthony Darmon, fondateur de COAI"
                    fill
                    sizes="6rem"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                    Derrière COAI
                  </span>
                  <p className="font-display text-lg font-semibold text-white">Anthony Darmon</p>
                  <p className="text-xs leading-5 text-graphite-400">
                    Coach diplômé d&apos;État, expert en coaching sportif depuis plus de 17 ans,
                    spécialiste des dirigeants et entrepreneurs. Ton programme est toujours validé
                    par lui ou un coach qu&apos;il a formé — jamais de l&apos;IA brute.
                  </p>
                  <p className="text-xs leading-5 text-graphite-500">
                    Tu peux aussi le croiser à Paris, à La Montgolfière Club ou au RITM
                    Saint-Germain.
                  </p>
                  <div className="flex items-center justify-center gap-2.5 sm:justify-start">
                    <a
                      href="https://instagram.com/anthonydarmoncoach"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/darmon-anthony-7a1303101"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
                    >
                      <LinkedinIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="max-w-lg text-xs leading-5 text-graphite-500">
                Cette expérience t&apos;a plu ? Parles-en à quelqu&apos;un qui a besoin de s&apos;y
                mettre — une fois abonné(e), tu auras aussi ton propre lien de parrainage.
              </p>
            </div>
          )}
        </div>

        {step !== "intro" && step !== "result" && step !== "analyse" && (
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
