"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { storeDiagnosticAnswers } from "@/lib/diagnostic/storage";
import {
  clearDiagnosticProgress,
  readDiagnosticProgress,
  saveDiagnosticProgress,
} from "@/lib/diagnostic/progress-storage";
import { readUtmCookie } from "@/lib/attribution/utm-cookie";
import { buildMiniDiagnostic, AUCUNE_DOULEUR_LABEL, RESULTATS_TIMELINE } from "@/lib/diagnostic/mini-diagnostic";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

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

// Phase 5.1 (11/08/2026, correction post-test réel) : liste élargie, plus
// un produit "personnalisé" ne peut pas se limiter à 4 objectifs fixes.
// "Autre objectif" ouvre un champ texte libre plutôt que de forcer un choix
// approximatif.
const OBJECTIF_AUTRE_LABEL = "Autre objectif";
const OBJECTIFS = [
  "Perdre du gras",
  "Prendre du muscle",
  "Me sentir mieux au quotidien",
  "Progresser en force",
  "Améliorer mes performances",
  "Gagner en mobilité",
  "Reprendre le sport",
  OBJECTIF_AUTRE_LABEL,
];

// Libellés alignés sur EQUIPEMENTS (profil-form.tsx) pour que la valeur
// stockée corresponde exactement aux chips du vrai formulaire de profil.
// "Poids du corps uniquement" → "Aucun matériel" (Phase 5.1, 11/08/2026,
// correction post-test réel) : l'ancien libellé était ambigu ("uniquement"
// laissait penser qu'il fallait quand même un minimum de matériel).
const EQUIPEMENTS = [
  "Salle de sport complète",
  "Matériel à la maison (haltères, bancs...)",
  "Élastiques / bandes de résistance",
  "Kettlebell",
  "TRX / sangles de suspension",
  "Aucun matériel",
];

// Alignés sur l'enum frequenceEntrainement de /api/profil. Phase 5.1
// (11/08/2026, correction post-test réel) : "2 fois par semaine" comme
// minimum excluait quelqu'un qui ne peut réellement s'entraîner qu'une
// fois — jamais forcer un minimum artificiel (cf. prompt de génération,
// programme-entrainement-structure.ts, qui respecte désormais cette
// fréquence à l'exact, sans jamais la revoir à la hausse).
const FREQUENCES = [
  "1 fois par semaine",
  "2 fois par semaine",
  "3 fois par semaine",
  "4 fois par semaine",
  "5 fois par semaine",
  "6 fois ou plus par semaine",
];

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
function resolveObjectif(objectif: string | null, texteLibre: string): string | null {
  if (objectif !== OBJECTIF_AUTRE_LABEL) return objectif;
  const texte = texteLibre.trim();
  return texte || objectif;
}

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

export function DiagnosticQuiz({
  connecte = false,
  aDejaUnProgramme = false,
}: { connecte?: boolean; aDejaUnProgramme?: boolean } = {}) {
  const [step, setStep] = useState<Step>("intro");
  // Parcours D (Phase 5B, 11/08/2026) : un visiteur déjà connecté qui refait
  // le diagnostic n'a pas besoin de ressaisir son email (déjà connu) — étape
  // retirée de la liste des questions pour ce cas, sans dupliquer tout le
  // reste du composant.
  const questionSteps = useMemo(
    () => (connecte ? QUESTION_STEPS.filter((s) => s !== "email") : QUESTION_STEPS),
    [connecte]
  );
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
  const [objectifAutreTexte, setObjectifAutreTexte] = useState("");
  const [santeAutreTexte, setSanteAutreTexte] = useState("");
  const [sportAutreTexte, setSportAutreTexte] = useState("");
  const [email, setEmail] = useState("");
  const [consentEmail, setConsentEmail] = useState(false);
  const [leadEnvoi, setLeadEnvoi] = useState<"idle" | "loading">("idle");
  const [applyStatus, setApplyStatus] = useState<
    "idle" | "loading" | "done" | "generation" | "pret" | "erreur"
  >("idle");
  const [resumable, setResumable] = useState(false);

  const stepIndex = questionSteps.indexOf(step);
  const progressPct = stepIndex >= 0 ? Math.round((stepIndex / questionSteps.length) * 100) : 0;
  const lastQuestionStep = questionSteps[questionSteps.length - 1];

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

  const STEP_ORDER: Step[] = ["intro", ...questionSteps, "analyse", "result"];

  function goNext() {
    // Événement funnel (section 15) : une vraie question vient d'être
    // répondue — jamais déclenché pour "intro"/"analyse" (pas de question).
    if (questionSteps.includes(step)) {
      trackFunnelEvent("diagnostic_step_completed", { step });
    }
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

  // Reprise du diagnostic (Phase 5B, section 14, 11/08/2026) : au premier
  // rendu, on regarde si une progression a été laissée en cours — si oui,
  // l'écran d'intro propose "Continuer mon diagnostic" plutôt que de
  // recommencer à zéro. Ne s'applique qu'une fois, pas à chaque changement
  // d'étape (sinon on écraserait resumable=false dès le premier goNext).
  useEffect(() => {
    const saved = readDiagnosticProgress<Record<string, unknown>>();
    if (saved && typeof saved.step === "string" && saved.step !== "intro") {
      setResumable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde la progression à chaque étape de question (jamais pendant
  // "intro"/"analyse"/"result" — rien à reprendre une fois le résultat
  // atteint, ce n'est plus un abandon).
  useEffect(() => {
    if (step === "intro" || step === "analyse" || step === "result") return;
    saveDiagnosticProgress({
      step,
      persona,
      personaAutreTexte,
      niveau,
      objectif,
      objectifAutreTexte,
      equipement,
      lieu,
      duree,
      frequence,
      sport,
      sportAutreTexte,
      sexe,
      age,
      tailleCm,
      poidsKg,
      habitudesAlimentaires,
      qualiteSommeil,
      sante,
      santeAutreTexte,
      email,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    persona,
    personaAutreTexte,
    niveau,
    objectif,
    objectifAutreTexte,
    equipement,
    lieu,
    duree,
    frequence,
    sport,
    sportAutreTexte,
    sexe,
    age,
    tailleCm,
    poidsKg,
    habitudesAlimentaires,
    qualiteSommeil,
    sante,
    santeAutreTexte,
    email,
  ]);

  function applySavedProgress(saved: Record<string, unknown>) {
    if (Array.isArray(saved.persona)) setPersona(saved.persona as string[]);
    if (typeof saved.personaAutreTexte === "string") setPersonaAutreTexte(saved.personaAutreTexte);
    if (typeof saved.niveau === "string") setNiveau(saved.niveau);
    if (typeof saved.objectif === "string") setObjectif(saved.objectif);
    if (typeof saved.objectifAutreTexte === "string") setObjectifAutreTexte(saved.objectifAutreTexte);
    if (Array.isArray(saved.equipement)) setEquipement(saved.equipement as string[]);
    if (typeof saved.lieu === "string") setLieu(saved.lieu);
    if (typeof saved.duree === "string") setDuree(saved.duree);
    if (typeof saved.frequence === "string") setFrequence(saved.frequence);
    if (Array.isArray(saved.sport)) setSport(saved.sport as string[]);
    if (typeof saved.sportAutreTexte === "string") setSportAutreTexte(saved.sportAutreTexte);
    if (typeof saved.sexe === "string") setSexe(saved.sexe);
    if (typeof saved.age === "string") setAge(saved.age);
    if (typeof saved.tailleCm === "string") setTailleCm(saved.tailleCm);
    if (typeof saved.poidsKg === "string") setPoidsKg(saved.poidsKg);
    if (typeof saved.habitudesAlimentaires === "string") setHabitudesAlimentaires(saved.habitudesAlimentaires);
    if (typeof saved.qualiteSommeil === "string") setQualiteSommeil(saved.qualiteSommeil);
    if (Array.isArray(saved.sante)) setSante(saved.sante as string[]);
    if (typeof saved.santeAutreTexte === "string") setSanteAutreTexte(saved.santeAutreTexte);
    if (typeof saved.email === "string") setEmail(saved.email);
  }

  function startDiagnostic() {
    trackFunnelEvent("diagnostic_started", { resumed: false });
    goNext();
  }

  function resumeDiagnostic() {
    const saved = readDiagnosticProgress<Record<string, unknown>>();
    if (!saved) {
      startDiagnostic();
      return;
    }
    applySavedProgress(saved);
    trackFunnelEvent("diagnostic_started", { resumed: true });
    const savedStep = saved.step as Step;
    setStep(questionSteps.includes(savedStep) ? savedStep : questionSteps[0] ?? "persona");
  }

  function restartDiagnostic() {
    clearDiagnosticProgress();
    setResumable(false);
    startDiagnostic();
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

  // Résultat atteint : plus rien à reprendre (efface la progression
  // sauvegardée) + événements funnel (section 15) — l'aperçu programme est
  // sur le même écran que le résultat, mais reste un événement distinct
  // pour pouvoir mesurer les deux séparément plus tard.
  useEffect(() => {
    if (step !== "result") return;
    clearDiagnosticProgress();
    trackFunnelEvent("diagnostic_result_viewed");
    trackFunnelEvent("programme_preview_viewed");
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
        objectif: resolveObjectif(objectif, objectifAutreTexte),
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
      objectifAutreTexte,
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

  function signUpHref(): string {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    const query = params.toString();
    return query ? `/sign-up?${query}` : "/sign-up";
  }

  // Réponses au format Profile — partagé entre le pont pré-inscription
  // (handleCreerCompte, visiteur anonyme) et la mise à jour directe du
  // profil (appliquerAuProfil, visiteur déjà connecté — parcours D).
  function reponsesEnProfil() {
    const personaAutreResolue = personaAutreTexte.trim();
    const personaResolue = resolveAutre(persona, personaAutreTexte);
    const objectifResolu = resolveObjectif(objectif, objectifAutreTexte);
    const santeReelle = resolveAutre(sante, santeAutreTexte).filter((s) => s !== AUCUNE_DOULEUR_LABEL);
    const sportResolu = resolveAutre(sport, sportAutreTexte);
    return {
      niveau: niveau ?? undefined,
      persona: personaResolue.length ? personaResolue.join(", ") : undefined,
      objectifs: [objectifResolu, personaAutreResolue].filter(Boolean).join(" — ") || undefined,
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
    };
  }

  function handleCreerCompte() {
    trackFunnelEvent("plan_selected", { plan: "GRATUIT" });
    storeDiagnosticAnswers(reponsesEnProfil());
  }

  // Parcours D (Phase 5B, 11/08/2026) : un visiteur déjà connecté qui refait
  // le diagnostic n'a besoin ni de créer un compte ni de repasser par le
  // pont localStorage — on met à jour son profil réel directement.
  // Correction Anthony (11/08/2026) : un nouvel abonné sans programme
  // encore généré (aDejaUnProgramme=false) enchaîne directement sur la
  // génération et "Ton programme est prêt" — un abonné existant qui
  // ajuste son profil garde le geste explicite habituel, jamais de
  // régénération silencieuse de son programme déjà en place.
  async function appliquerAuProfil() {
    setApplyStatus("loading");
    let profilApplique = false;
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reponsesEnProfil()),
      });
      if (!res.ok) throw new Error();
      profilApplique = true;
      if (aDejaUnProgramme) {
        setApplyStatus("done");
        return;
      }
      setApplyStatus("generation");
      const genRes = await fetch("/api/programmes/generate", { method: "POST" });
      if (!genRes.ok) throw new Error();
      trackFunnelEvent("first_programme_viewed");
      setApplyStatus("pret");
    } catch {
      setApplyStatus(profilApplique ? "erreur" : "idle");
    }
  }

  // Capture le lead avant de révéler le résultat — best-effort : n'importe
  // quel souci réseau/serveur ne doit jamais empêcher la personne de voir
  // son diagnostic, elle a déjà répondu à 10 questions pour ça.
  async function submitLeadAndReveal() {
    setLeadEnvoi("loading");
    try {
      const utm = readUtmCookie();
      await fetch("/api/diagnostic-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...utm,
          reponses: {
            persona: resolveAutre(persona, personaAutreTexte),
            niveau,
            objectif: resolveObjectif(objectif, objectifAutreTexte),
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
      trackFunnelEvent("diagnostic_completed");
      setLeadEnvoi("idle");
      goNext();
    }
  }

  // Dernière question avant le résultat : capture le lead pour un visiteur
  // anonyme (email + consentement déjà validés par canContinue), ou avance
  // directement pour un visiteur connecté (parcours D — pas d'email à
  // capturer, ce n'est pas un lead, c'est déjà un client).
  function finishQuestions() {
    if (connecte) {
      trackFunnelEvent("diagnostic_completed");
      goNext();
      return;
    }
    submitLeadAndReveal();
  }

  return (
    <div className={`mx-auto w-full transition-[max-width] ${step === "result" ? "max-w-3xl" : "max-w-lg"}`}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)]">
        {step !== "intro" && step !== "result" && step !== "analyse" && (
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-400">
              Étape {stepIndex + 1}/{questionSteps.length}
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
                {resumable ? "Reprenons où tu t'étais arrêté(e)." : "Construisons ton profil."}
              </h1>
              <p className="max-w-sm text-sm leading-6 text-graphite-400">
                {resumable ? (
                  "Tes réponses précédentes sont toujours là — inutile de tout recommencer."
                ) : (
                  <>
                    {questionSteps.length - (connecte ? 0 : 1)} questions rapides, aucune bonne ou
                    mauvaise réponse. Chaque réponse compte : c&apos;est ce que COAI utilise pour
                    construire ton profil, pas un simple formulaire. Gratuit
                    {!connecte && ", sans inscription"}.
                  </>
                )}
              </p>
              {resumable ? (
                <div className="mt-2 flex flex-col items-center gap-2">
                  <Button onClick={resumeDiagnostic}>Continuer mon diagnostic</Button>
                  <button
                    type="button"
                    onClick={restartDiagnostic}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite-500 underline transition hover:text-white"
                  >
                    Recommencer à zéro
                  </button>
                </div>
              ) : (
                <Button onClick={startDiagnostic} className="mt-2">
                  Commencer
                </Button>
              )}
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
              {objectif === OBJECTIF_AUTRE_LABEL && (
                <input
                  type="text"
                  value={objectifAutreTexte}
                  onChange={(e) => setObjectifAutreTexte(e.target.value)}
                  placeholder="Quel est ton objectif ?"
                  className="w-full rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60"
                />
              )}
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
                <h2 className="font-display text-xl font-semibold text-white">
                  Combien de fois peux-tu réellement t&apos;entraîner par semaine ?
                </h2>
                <p className="mt-1.5 text-sm text-graphite-400">Pas ta semaine idéale. Ta vraie semaine.</p>
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
                <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 text-left sm:px-6 sm:py-6">
                  <SectionLabel>Aujourd&apos;hui → Avec COAI</SectionLabel>
                  <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-graphite-800 bg-graphite-900/50 px-4 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                        Aujourd&apos;hui
                      </span>
                      <ul className="flex flex-col gap-1.5 text-sm leading-6 text-graphite-300">
                        {diagnostic.pointsATravailler.map((p) => (
                          <li key={p} className="flex items-start gap-2">
                            <span className="mt-0.5 text-acier">✕</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl border border-laiton-400/30 bg-laiton-400/[0.07] px-4 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-300">
                        Avec COAI
                      </span>
                      <ul className="flex flex-col gap-1.5 text-sm leading-6 text-graphite-100">
                        {diagnostic.pointsResolus.map((p) => (
                          <li key={p} className="flex items-start gap-2">
                            <span className="mt-0.5 text-laiton-300">✓</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-laiton-200">{RESULTATS_TIMELINE}</p>
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

              {connecte ? (
                // Parcours D (Phase 5B, 11/08/2026) : déjà abonné, aucune
                // raison de proposer de créer un compte — on applique
                // directement ces réponses à son profil réel. Correction
                // Anthony (11/08/2026) : sans programme existant, enchaîne
                // sur la génération et "Ton programme est prêt" — avec un
                // programme déjà en place, reste au geste explicite habituel
                // (jamais de régénération silencieuse).
                <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-6 text-center">
                  {applyStatus === "pret" ? (
                    <>
                      <SectionLabel>Ton programme est prêt</SectionLabel>
                      <p className="max-w-md text-sm leading-6 text-graphite-300">
                        Entraînement, nutrition et récupération, personnalisés à partir de ton
                        diagnostic.
                      </p>
                      <Link href="/programme/entrainement">
                        <Button className="px-8 py-3">Commencer ma première séance</Button>
                      </Link>
                    </>
                  ) : applyStatus === "generation" ? (
                    <>
                      <SectionLabel>COAI prépare ton programme</SectionLabel>
                      <p className="max-w-md text-sm leading-6 text-graphite-300">
                        Quelques secondes, entraînement, nutrition et récupération.
                      </p>
                    </>
                  ) : applyStatus === "erreur" ? (
                    <>
                      <p className="text-sm text-graphite-300">
                        Ton profil est enregistré, mais la génération de ton programme a rencontré
                        un souci.
                      </p>
                      <Link href="/programme/entrainement" className="text-sm text-laiton-300 underline">
                        Réessayer depuis ton programme →
                      </Link>
                    </>
                  ) : applyStatus === "done" ? (
                    <>
                      <SectionLabel>C&apos;est fait</SectionLabel>
                      <p className="max-w-md text-sm leading-6 text-graphite-300">
                        Profil mis à jour ✓ COAI en sait un peu plus sur toi — ton prochain
                        programme en tiendra compte.
                      </p>
                      <Link href="/dashboard">
                        <Button className="px-8 py-3">Retour au tableau de bord</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <SectionLabel>Mettre à jour ton profil</SectionLabel>
                      <p className="max-w-md text-sm leading-6 text-graphite-300">
                        {aDejaUnProgramme
                          ? "Applique ces réponses à ton profil COAI pour que ton prochain programme en tienne compte."
                          : "Applique ces réponses et génère ton programme personnalisé."}
                      </p>
                      <Button onClick={appliquerAuProfil} disabled={applyStatus === "loading"}>
                        {applyStatus === "loading"
                          ? "…"
                          : aDejaUnProgramme
                            ? "Mettre à jour mon profil"
                            : "Générer mon programme"}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                // Nouveau modèle d'accès libre (13/08/2026, demande Anthony) :
                // ne plus proposer les formules ici — un visiteur non connecté
                // crée un compte gratuit et atterrit sur son dashboard, où
                // toute l'interface est visible et chaque offre se débloque
                // séparément quand il est prêt. Les réponses du diagnostic
                // sont mémorisées (pont pré-inscription existant) et
                // appliquées automatiquement à son profil dès la création du
                // compte, exactement comme avant.
                <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-6 text-center">
                  <SectionLabel>Ton profil est prêt</SectionLabel>
                  <p className="max-w-md text-sm leading-6 text-graphite-300">
                    Crée ton compte gratuitement pour voir ton tableau de bord personnalisé —
                    aucune carte bancaire requise.
                  </p>
                  <Link href={signUpHref()} onClick={handleCreerCompte}>
                    <Button className="px-8 py-3">Créer mon compte gratuit</Button>
                  </Link>
                </div>
              )}

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
              onClick={step === lastQuestionStep ? finishQuestions : goNext}
              disabled={!canContinue || leadEnvoi === "loading"}
              className="px-6 py-2.5 text-sm"
            >
              {step === lastQuestionStep
                ? leadEnvoi === "loading"
                  ? "…"
                  : "Voir mon diagnostic →"
                : "Continuer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
