"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
import { DiagnosticShareButton } from "@/components/marketing/diagnostic-share-button";

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

const ECHEANCES = ["Dans 3 mois", "Dans 6 mois", "Dans 12 mois", "Pas de date précise"];
const MOBILITE_REPERES = ["Fluide, sans gêne", "Quelques raideurs", "Mouvement limité", "Douleur — je ne teste pas"];
const CARDIO_REPERES = ["Je monte 3 étages facilement", "Je suis légèrement essoufflé", "Je dois faire une pause", "Je ne peux pas l’évaluer"];
const FORCE_REPERES = ["10 levers de chaise faciles", "10 levers avec effort", "Moins de 10 répétitions", "Je ne peux pas l’évaluer"];
const MOUVEMENT_REPERES = ["Stable et contrôlé", "Manque d’équilibre", "Compensation ou raideur", "Douleur — je ne teste pas"];

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
  | "echeance"
  | "evaluationPhysique"
  | "equipement"
  | "lieu"
  | "duree"
  | "frequence"
  | "sport"
  | "sexe"
  | "santeFeminine"
  | "profilPhysique"
  | "alimentation"
  | "sommeil"
  | "sante"
  | "coach"
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
// "santeFeminine" (14/08/2026, retour utilisatrice) : cycle menstruel /
// grossesse / post-partum — n'apparaît que si sexe === "Femme" (filtré dans
// questionSteps ci-dessous), jamais présumé, toujours opt-in.
// "analyse" (Phase 5) : moment de transition avant la révélation, pas une
// vraie question — exclu de la barre de progression comme "result".
const QUESTION_STEPS: Step[] = [
  "persona",
  "niveau",
  "objectif",
  "echeance",
  "evaluationPhysique",
  "equipement",
  "lieu",
  "duree",
  "frequence",
  "sport",
  "sexe",
  "santeFeminine",
  "profilPhysique",
  "alimentation",
  "sommeil",
  "sante",
  "coach",
  "email",
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Format international requis (16/08/2026, demande Anthony : pouvoir
// contacter le lead par téléphone/WhatsApp) — même règle que
// /api/compte/telephone (phoneWhatsapp), pour rester compatible avec un
// lien wa.me construit derrière.
function normalizeTelephone(value: string): string {
  const compact = value.replace(/[\s().-]/g, "");
  if (/^0[67]\d{8}$/.test(compact)) return `+33${compact.slice(1)}`;
  if (/^33[67]\d{8}$/.test(compact)) return `+${compact}`;
  return compact;
}

function isValidTelephone(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(normalizeTelephone(value));
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
      className={`coai-diagnostic-option flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-sm transition ${
        active
          ? "border-laiton-400/50 bg-laiton-400/[0.08] text-laiton-200"
          : "border-graphite-800 bg-graphite-900/60 text-graphite-200 hover:border-graphite-600 hover:text-white"
      }`}
    >
      <span className="flex flex-col items-start gap-0.5">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-graphite-500">{hint}</span>}
      </span>
      <span className="coai-diagnostic-option-mark" aria-hidden="true">{active ? "✓" : ""}</span>
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`coai-diagnostic-chip rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-laiton-400/50 bg-laiton-400/[0.1] text-laiton-200"
          : "border-graphite-800 bg-graphite-900/60 text-graphite-300 hover:border-graphite-600 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function AssessmentRow({ number, title, instruction, options, value, onChange }: {
  number: string; title: string; instruction: string; options: string[];
  value: string | null; onChange: (value: string) => void;
}) {
  return (
    <fieldset className="coai-assessment-row">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        <span className="coai-assessment-number">{number}</span>
        <div><p className="font-semibold text-[#20211e]">{title}</p><p className="mt-1 text-xs leading-5 text-[#666159]">{instruction}</p></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className="coai-assessment-choice">
            <span>{option}</span><i aria-hidden="true">{value === option ? "✓" : ""}</i>
          </button>
        ))}
      </div>
    </fieldset>
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
  const [persona, setPersona] = useState<string[]>([]);
  const [niveau, setNiveau] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string | null>(null);
  const [echeance, setEcheance] = useState<string | null>(null);
  const [mobiliteRepere, setMobiliteRepere] = useState<string | null>(null);
  const [cardioRepere, setCardioRepere] = useState<string | null>(null);
  const [forceRepere, setForceRepere] = useState<string | null>(null);
  const [mouvementRepere, setMouvementRepere] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string[]>([]);
  const [lieu, setLieu] = useState<string | null>(null);
  const [duree, setDuree] = useState<string | null>(null);
  const [frequence, setFrequence] = useState<string | null>(null);
  const [sport, setSport] = useState<string[]>([]);
  const [sexe, setSexe] = useState<string | null>(null);
  // Parcours D (Phase 5B, 11/08/2026) : un visiteur déjà connecté qui refait
  // le diagnostic n'a pas besoin de ressaisir son email (déjà connu) — étape
  // retirée de la liste des questions pour ce cas, sans dupliquer tout le
  // reste du composant.
  const questionSteps = useMemo(() => {
    let steps = QUESTION_STEPS;
    if (connecte) steps = steps.filter((s) => s !== "email");
    // "santeFeminine" ne s'affiche que si "Femme" est déjà sélectionné —
    // jamais présumé pour "Homme"/"Préfère ne pas dire".
    if (sexe !== "Femme") steps = steps.filter((s) => s !== "santeFeminine");
    return steps;
  }, [connecte, sexe]);
  const [age, setAge] = useState("");
  const [tailleCm, setTailleCm] = useState("");
  const [poidsKg, setPoidsKg] = useState("");
  // Cycle menstruel / maternité (14/08/2026) — opt-in explicite, jamais
  // présumé. dateDernieresRegles/dateReferenceMaternite en "YYYY-MM-DD"
  // (valeur brute d'un <input type="date">), converties en ISO complet
  // uniquement au moment de reponsesEnProfil().
  const [cycleMenstruelSuivi, setCycleMenstruelSuivi] = useState(false);
  const [dateDernieresRegles, setDateDernieresRegles] = useState("");
  const [dureeCycleJours, setDureeCycleJours] = useState("");
  const [reglesDouloureuses, setReglesDouloureuses] = useState<boolean | null>(null);
  const [statutMaternite, setStatutMaternite] = useState<"ENCEINTE" | "POST_PARTUM" | null>(null);
  const [dateReferenceMaternite, setDateReferenceMaternite] = useState("");
  const [habitudesAlimentaires, setHabitudesAlimentaires] = useState<string | null>(null);
  const [qualiteSommeil, setQualiteSommeil] = useState<string | null>(null);
  const [sante, setSante] = useState<string[]>([]);
  // Choix du style d'accompagnement (16/08/2026, modèle Future demandé par
  // Anthony) — n'assigne aucun coach réel, sert juste à orienter la formule
  // mise en avant sur l'écran résultat.
  const [coachPreference, setCoachPreference] = useState<"FULL_IA" | "HYBRIDE" | "VIP_PRESENTIEL" | null>(null);
  const [personaAutreTexte, setPersonaAutreTexte] = useState("");
  const [objectifAutreTexte, setObjectifAutreTexte] = useState("");
  const [santeAutreTexte, setSanteAutreTexte] = useState("");
  const [antecedentsMedicaux, setAntecedentsMedicaux] = useState("");
  const [sportAutreTexte, setSportAutreTexte] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
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

  function chooseSingle<T>(setter: (value: T) => void, value: T) {
    setter(value);
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
      echeance,
      mobiliteRepere,
      cardioRepere,
      forceRepere,
      mouvementRepere,
      equipement,
      lieu,
      duree,
      frequence,
      sport,
      sportAutreTexte,
      sexe,
      cycleMenstruelSuivi,
      dateDernieresRegles,
      dureeCycleJours,
      reglesDouloureuses,
      statutMaternite,
      dateReferenceMaternite,
      age,
      tailleCm,
      poidsKg,
      habitudesAlimentaires,
      qualiteSommeil,
      sante,
      santeAutreTexte,
      antecedentsMedicaux,
      coachPreference,
      email,
      telephone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    persona,
    personaAutreTexte,
    niveau,
    objectif,
    objectifAutreTexte,
    echeance,
    mobiliteRepere,
    cardioRepere,
    forceRepere,
    mouvementRepere,
    equipement,
    lieu,
    duree,
    frequence,
    sport,
    sportAutreTexte,
    sexe,
    cycleMenstruelSuivi,
    dateDernieresRegles,
    dureeCycleJours,
    reglesDouloureuses,
    statutMaternite,
    dateReferenceMaternite,
    age,
    tailleCm,
    poidsKg,
    habitudesAlimentaires,
    qualiteSommeil,
    sante,
    santeAutreTexte,
    antecedentsMedicaux,
    coachPreference,
    email,
    telephone,
  ]);

  function applySavedProgress(saved: Record<string, unknown>) {
    if (Array.isArray(saved.persona)) setPersona(saved.persona as string[]);
    if (typeof saved.personaAutreTexte === "string") setPersonaAutreTexte(saved.personaAutreTexte);
    if (typeof saved.niveau === "string") setNiveau(saved.niveau);
    if (typeof saved.objectif === "string") setObjectif(saved.objectif);
    if (typeof saved.objectifAutreTexte === "string") setObjectifAutreTexte(saved.objectifAutreTexte);
    if (typeof saved.echeance === "string") setEcheance(saved.echeance);
    if (typeof saved.mobiliteRepere === "string") setMobiliteRepere(saved.mobiliteRepere);
    if (typeof saved.cardioRepere === "string") setCardioRepere(saved.cardioRepere);
    if (typeof saved.forceRepere === "string") setForceRepere(saved.forceRepere);
    if (typeof saved.mouvementRepere === "string") setMouvementRepere(saved.mouvementRepere);
    if (Array.isArray(saved.equipement)) setEquipement(saved.equipement as string[]);
    if (typeof saved.lieu === "string") setLieu(saved.lieu);
    if (typeof saved.duree === "string") setDuree(saved.duree);
    if (typeof saved.frequence === "string") setFrequence(saved.frequence);
    if (Array.isArray(saved.sport)) setSport(saved.sport as string[]);
    if (typeof saved.sportAutreTexte === "string") setSportAutreTexte(saved.sportAutreTexte);
    if (typeof saved.sexe === "string") setSexe(saved.sexe);
    if (typeof saved.cycleMenstruelSuivi === "boolean") setCycleMenstruelSuivi(saved.cycleMenstruelSuivi);
    if (typeof saved.dateDernieresRegles === "string") setDateDernieresRegles(saved.dateDernieresRegles);
    if (typeof saved.dureeCycleJours === "string") setDureeCycleJours(saved.dureeCycleJours);
    if (typeof saved.reglesDouloureuses === "boolean") setReglesDouloureuses(saved.reglesDouloureuses);
    if (saved.statutMaternite === "ENCEINTE" || saved.statutMaternite === "POST_PARTUM") {
      setStatutMaternite(saved.statutMaternite);
    }
    if (typeof saved.dateReferenceMaternite === "string") setDateReferenceMaternite(saved.dateReferenceMaternite);
    if (typeof saved.age === "string") setAge(saved.age);
    if (typeof saved.tailleCm === "string") setTailleCm(saved.tailleCm);
    if (typeof saved.poidsKg === "string") setPoidsKg(saved.poidsKg);
    if (typeof saved.habitudesAlimentaires === "string") setHabitudesAlimentaires(saved.habitudesAlimentaires);
    if (typeof saved.qualiteSommeil === "string") setQualiteSommeil(saved.qualiteSommeil);
    if (Array.isArray(saved.sante)) setSante(saved.sante as string[]);
    if (typeof saved.santeAutreTexte === "string") setSanteAutreTexte(saved.santeAutreTexte);
    if (typeof saved.antecedentsMedicaux === "string") setAntecedentsMedicaux(saved.antecedentsMedicaux);
    if (
      saved.coachPreference === "FULL_IA" ||
      saved.coachPreference === "HYBRIDE" ||
      saved.coachPreference === "VIP_PRESENTIEL"
    ) {
      setCoachPreference(saved.coachPreference);
    }
    if (typeof saved.email === "string") setEmail(saved.email);
    if (typeof saved.telephone === "string") setTelephone(saved.telephone);
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
    if (step === "echeance") return Boolean(echeance);
    if (step === "evaluationPhysique") return Boolean(mobiliteRepere && cardioRepere && forceRepere && mouvementRepere);
    if (step === "equipement") return equipement.length > 0;
    if (step === "lieu") return Boolean(lieu);
    if (step === "duree") return Boolean(duree);
    if (step === "frequence") return Boolean(frequence);
    if (step === "sport") return true; // peut n'en pratiquer aucun
    if (step === "sexe") return Boolean(sexe);
    if (step === "santeFeminine") return true; // entièrement facultatif, opt-in
    if (step === "profilPhysique") return true; // âge/taille/poids facultatifs
    if (step === "alimentation") return Boolean(habitudesAlimentaires);
    if (step === "sommeil") return Boolean(qualiteSommeil);
    if (step === "sante") return true; // peut n'avoir rien à signaler
    if (step === "coach") return Boolean(coachPreference);
    if (step === "email") return isValidEmail(email) && isValidTelephone(telephone) && consentEmail;
    return true;
  }, [
    step,
    persona,
    niveau,
    objectif,
    echeance,
    mobiliteRepere,
    cardioRepere,
    forceRepere,
    mouvementRepere,
    equipement,
    lieu,
    duree,
    frequence,
    sexe,
    habitudesAlimentaires,
    qualiteSommeil,
    coachPreference,
    email,
    telephone,
    consentEmail,
  ]);

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
      objectifs: [objectifResolu, echeance ? `échéance : ${echeance}` : null, personaAutreResolue].filter(Boolean).join(" — ") || undefined,
      equipementDisponible: equipement.length ? equipement.join(", ") : undefined,
      lieuEntrainement: lieu ?? undefined,
      dureeSeanceMinutes: duree ? DUREE_EN_MINUTES[duree] : undefined,
      frequenceEntrainement: frequence ?? undefined,
      contraintesSante: santeReelle.length ? santeReelle.join(", ") : undefined,
      antecedentsMedicaux: [
        antecedentsMedicaux.trim() || null,
        mobiliteRepere ? `Mobilité : ${mobiliteRepere}` : null,
        cardioRepere ? `Cardio : ${cardioRepere}` : null,
        forceRepere ? `Force fonctionnelle : ${forceRepere}` : null,
        mouvementRepere ? `Mouvements de base : ${mouvementRepere}` : null,
      ].filter(Boolean).join(" — ") || undefined,
      sexe: sexe ?? undefined,
      sportsPratiques: sportResolu.length ? sportResolu.join(", ") : undefined,
      // Cycle/maternité opt-in : rien envoyé si jamais coché/renseigné, pour
      // ne jamais écraser une valeur existante par une absence de choix.
      cycleMenstruelSuivi: cycleMenstruelSuivi || undefined,
      dateDernieresRegles:
        cycleMenstruelSuivi && dateDernieresRegles ? new Date(dateDernieresRegles).toISOString() : undefined,
      dureeCycleJours: cycleMenstruelSuivi && dureeCycleJours ? Number(dureeCycleJours) : undefined,
      reglesDouloureuses: cycleMenstruelSuivi && reglesDouloureuses !== null ? reglesDouloureuses : undefined,
      statutMaternite: statutMaternite ?? undefined,
      dateReferenceMaternite:
        statutMaternite && dateReferenceMaternite ? new Date(dateReferenceMaternite).toISOString() : undefined,
      habitudesAlimentaires: habitudesAlimentaires ?? undefined,
      qualiteSommeil: qualiteSommeil ?? undefined,
      age: age ? Number(age) : undefined,
      tailleCm: tailleCm ? Number(tailleCm) : undefined,
      poidsKg: poidsKg ? Number(poidsKg) : undefined,
      coachPreference: coachPreference ?? undefined,
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
          telephone: normalizeTelephone(telephone) || undefined,
          ...utm,
          reponses: {
            persona: resolveAutre(persona, personaAutreTexte),
            niveau,
            objectif: resolveObjectif(objectif, objectifAutreTexte),
            echeance,
            mobiliteRepere,
            cardioRepere,
            forceRepere,
            mouvementRepere,
            antecedentsMedicaux: antecedentsMedicaux.trim() || undefined,
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
            coachPreference,
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
  // capturer, ce n'est pas un lead, c'est déjà un client). Anthony veut
  // malgré tout être notifié dans les deux cas (14/08/2026) — best-effort,
  // ne bloque jamais l'affichage du résultat si ça échoue.
  function finishQuestions() {
    if (connecte) {
      trackFunnelEvent("diagnostic_completed");
      fetch("/api/diagnostic/notify-connecte", { method: "POST" }).catch(() => {});
      goNext();
      return;
    }
    submitLeadAndReveal();
  }

  return (
    <div className={`mx-auto w-full transition-[max-width] ${step === "result" ? "max-w-5xl" : "max-w-2xl"}`}>
      <div className={`coai-diagnostic-card overflow-hidden ${step === "result" ? "coai-diagnostic-result" : ""}`}>
        {step !== "intro" && step !== "result" && step !== "analyse" && (
          <div className="coai-diagnostic-progress flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-400">
              Profil {stepIndex + 1} sur {questionSteps.length}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-graphite-800 sm:w-40">
              <div
                className="h-full rounded-full bg-laiton-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-7 sm:px-8">
          {step === "intro" && (
            <div className="flex flex-col items-center gap-5 py-5 text-center sm:py-10">
              <div className="coai-diagnostic-kicker" aria-label="Ton bilan initial et ton Score COAI">
                <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                <span>Bilan initial offert · Score COAI</span>
              </div>
              <h1 className="max-w-xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl">
                {resumable ? "Reprenons où tu t'étais arrêté(e)." : "Ton corps. Ta vie. Ton programme."}
              </h1>
              <p className="max-w-lg text-base leading-7 text-graphite-400">
                {resumable ? (
                  "Tes réponses précédentes sont toujours là — inutile de tout recommencer."
                ) : (
                  <>
                    En 3 minutes, fais le point comme avec un Personal Trainer : besoins, niveau,
                    contraintes, objectif et Score COAI mesurable.
                  </>
                )}
              </p>
              {!resumable && (
                <div className="grid w-full max-w-xl grid-cols-3 gap-2 text-left sm:gap-3">
                  {[{ value: "17 ans", label: "d'expérience terrain" }, { value: "100 %", label: "personnalisé" }, { value: "0 €", label: "pour commencer" }].map((proof) => (
                    <div key={proof.label} className="coai-diagnostic-proof">
                      <strong>{proof.value}</strong>
                      <span>{proof.label}</span>
                    </div>
                  ))}
                </div>
              )}
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
                <Button onClick={startDiagnostic} className="mt-2 px-8 py-3.5">
                  Commencer mon bilan initial — 3 min
                </Button>
              )}
              <span className="text-xs text-graphite-600">
                Gratuit · sans carte bancaire · résultat immédiat
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
                  <OptionCard key={n.value} label={n.value} hint={n.hint} active={niveau === n.value} onClick={() => chooseSingle(setNiveau, n.value)} />
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
                  <OptionCard
                    key={o}
                    label={o}
                    active={objectif === o}
                    onClick={() =>
                      o === OBJECTIF_AUTRE_LABEL ? setObjectif(o) : chooseSingle(setObjectif, o)
                    }
                  />
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

          {step === "echeance" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="coai-consultation-phase">Entretien · Objectif</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">Quand veux-tu constater un résultat concret ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Nous fixons un horizon réaliste — pas une promesse magique.</p>
              </div>
              <div className="flex flex-col gap-2">
                {ECHEANCES.map((item) => <OptionCard key={item} label={item} active={echeance === item} onClick={() => setEcheance(item)} />)}
              </div>
            </div>
          )}

          {step === "evaluationPhysique" && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="coai-consultation-phase">Évaluation physique guidée</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">Observons comment ton corps répond aujourd’hui.</h2>
                <p className="mt-1.5 text-sm leading-6 text-graphite-400">Reste près d’un appui et ne force jamais. Arrête immédiatement en cas de douleur, vertige ou gêne inhabituelle.</p>
              </div>
              <div className="coai-assessment-suite">
                <AssessmentRow number="01" title="Mobilité" instruction="Lève les bras au-dessus de la tête puis réalise un squat confortable." options={MOBILITE_REPERES} value={mobiliteRepere} onChange={setMobiliteRepere} />
                <AssessmentRow number="02" title="Cardio" instruction="Prends comme repère ton ressenti habituel après trois étages à allure normale." options={CARDIO_REPERES} value={cardioRepere} onChange={setCardioRepere} />
                <AssessmentRow number="03" title="Force fonctionnelle" instruction="Depuis une chaise stable, réalise jusqu’à dix levers contrôlés." options={FORCE_REPERES} value={forceRepere} onChange={setForceRepere} />
                <AssessmentRow number="04" title="Mouvements de base" instruction="Tiens-toi quelques secondes sur une jambe près d’un appui, puis change de côté." options={MOUVEMENT_REPERES} value={mouvementRepere} onChange={setMouvementRepere} />
              </div>
              <p className="rounded-xl border border-[#b78943]/20 bg-[#b78943]/[0.07] px-4 py-3 text-xs leading-5 text-[#665336]">Cette auto-évaluation donne des repères de départ. Elle ne remplace ni un examen médical ni l’observation en direct d’un professionnel.</p>
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
                  <OptionCard key={l} label={l} active={lieu === l} onClick={() => chooseSingle(setLieu, l)} />
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
                  <OptionCard key={d} label={d} active={duree === d} onClick={() => chooseSingle(setDuree, d)} />
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
                  <OptionCard key={f} label={f} active={frequence === f} onClick={() => chooseSingle(setFrequence, f)} />
                ))}
              </div>
            </div>
          )}

          {step === "sport" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Tu pratiques déjà un sport ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Coche tout ce qui s&apos;applique.</p>
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

          {step === "santeFeminine" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  Cycle, grossesse ou post-partum ?
                </h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Facultatif — uniquement si tu veux que COAI adapte ton entraînement et ta nutrition en conséquence.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  Grossesse / post-partum
                </span>
                <div className="flex flex-wrap gap-2">
                  <Chip label="Non" active={statutMaternite === null} onClick={() => setStatutMaternite(null)} />
                  <Chip
                    label="Je suis enceinte"
                    active={statutMaternite === "ENCEINTE"}
                    onClick={() => setStatutMaternite("ENCEINTE")}
                  />
                  <Chip
                    label="Je suis en post-partum"
                    active={statutMaternite === "POST_PARTUM"}
                    onClick={() => setStatutMaternite("POST_PARTUM")}
                  />
                </div>
                {statutMaternite === "ENCEINTE" && (
                  <Field label="Date prévue d'accouchement (terme)">
                    <Input
                      type="date"
                      value={dateReferenceMaternite}
                      onChange={(e) => setDateReferenceMaternite(e.target.value)}
                    />
                  </Field>
                )}
                {statutMaternite === "POST_PARTUM" && (
                  <Field label="Date d'accouchement">
                    <Input
                      type="date"
                      value={dateReferenceMaternite}
                      onChange={(e) => setDateReferenceMaternite(e.target.value)}
                    />
                  </Field>
                )}
                {statutMaternite && (
                  <p className="text-xs text-graphite-500">
                    COAI adapte ton programme avec prudence, mais ne remplace jamais l&apos;avis de ta sage-femme ou
                    de ton médecin.
                  </p>
                )}
              </div>

              {!statutMaternite && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                    Cycle menstruel
                  </span>
                  <OptionCard
                    label="Adapter mon programme à mon cycle menstruel"
                    hint="COAI ajuste l'intensité et la nutrition selon la phase de ton cycle."
                    active={cycleMenstruelSuivi}
                    onClick={() => setCycleMenstruelSuivi((v) => !v)}
                  />
                  {cycleMenstruelSuivi && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Date des dernières règles">
                          <Input
                            type="date"
                            value={dateDernieresRegles}
                            onChange={(e) => setDateDernieresRegles(e.target.value)}
                          />
                        </Field>
                        <Field label="Durée du cycle (jours)">
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="28"
                            value={dureeCycleJours}
                            onChange={(e) => setDureeCycleJours(e.target.value)}
                          />
                        </Field>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          label="Règles douloureuses"
                          active={reglesDouloureuses === true}
                          onClick={() => setReglesDouloureuses(reglesDouloureuses === true ? null : true)}
                        />
                        <Chip
                          label="Pas de douleurs particulières"
                          active={reglesDouloureuses === false}
                          onClick={() => setReglesDouloureuses(reglesDouloureuses === false ? null : false)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
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
                <Field label="Âge">
                  <Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
                </Field>
                <Field label="Taille (cm)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={tailleCm}
                    onChange={(e) => setTailleCm(e.target.value)}
                  />
                </Field>
                <Field label="Poids (kg)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={poidsKg}
                    onChange={(e) => setPoidsKg(e.target.value)}
                  />
                </Field>
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
                  <OptionCard key={h} label={h} active={habitudesAlimentaires === h} onClick={() => chooseSingle(setHabitudesAlimentaires, h)} />
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
                  <OptionCard key={s} label={s} active={qualiteSommeil === s} onClick={() => chooseSingle(setQualiteSommeil, s)} />
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
              <Field label="Antécédents médicaux, anciennes blessures ou opérations (facultatif)">
                <textarea value={antecedentsMedicaux} onChange={(event) => setAntecedentsMedicaux(event.target.value)} placeholder="Ex. entorse ancienne, opération, traitement en cours, recommandation médicale…" rows={3} className="w-full resize-none rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60" />
              </Field>
              <p className="text-xs leading-5 text-graphite-500">Ces informations servent uniquement à adapter les précautions. COAI ne pose aucun diagnostic médical.</p>
            </div>
          )}

          {step === "coach" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Quel niveau d&apos;attention veux-tu recevoir ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Comme en personal training, nous adaptons aussi l&apos;encadrement à ton autonomie et à ton objectif.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <OptionCard
                  label="Impulsion — le point de départ recommandé"
                  hint="Commence ici : ton programme évolutif et ton Personal Trainer IA disponible 24h/24. Tu pourras évoluer seulement si tu en as besoin."
                  active={coachPreference === "FULL_IA"}
                  onClick={() => chooseSingle(setCoachPreference, "FULL_IA")}
                />
                <OptionCard
                  label="Transformation — la disponibilité de l'IA, l'œil du coach"
                  hint="L'étape suivante si tu veux ajouter une validation et des ajustements humains à ton suivi quotidien."
                  active={coachPreference === "HYBRIDE"}
                  onClick={() => chooseSingle(setCoachPreference, "HYBRIDE")}
                />
                <OptionCard
                  label="VIP — une attention maximale"
                  hint="La dernière étape pour un objectif précis ou complexe : attention maximale avec Anthony, à Paris centre ou à distance."
                  active={coachPreference === "VIP_PRESENTIEL"}
                  onClick={() => chooseSingle(setCoachPreference, "VIP_PRESENTIEL")}
                />
              </div>
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
              <div>
                <Input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  onBlur={() => setTelephone(normalizeTelephone(telephone))}
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                  inputMode="tel"
                />
                <p className="mt-1.5 text-xs text-graphite-500">
                  Ton numéro (ex. 06 12 34 56 78) — le format français est accepté. Pour recevoir un conseil personnalisé ou être
                  recontacté sur WhatsApp. Jamais partagé.
                </p>
              </div>
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
              <div className="coai-result-hero flex w-full flex-col items-center gap-3 px-5 py-7 sm:px-8 sm:py-9">
                <div className="coai-diagnostic-kicker">
                  <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                  <span>Analyse COAI terminée</span>
                  <span className="coai-diagnostic-kicker-separator" aria-hidden="true" />
                  <span>Profil révélé</span>
                </div>
                <h2 className="coai-gradient-text max-w-2xl font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                  Ton point de départ est clair. Voici la trajectoire.
                </h2>
                <div className="coai-index-reveal mt-2 grid w-full max-w-2xl gap-5 rounded-2xl p-5 text-left sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
                  <div className="coai-index-ring" style={{ "--coai-score": `${diagnostic.indiceCoai.score * 3.6}deg` } as React.CSSProperties}>
                    <div>
                      <strong>{diagnostic.indiceCoai.score}</strong>
                      <span>/100</span>
                    </div>
                  </div>
                  <div>
                    <p className="coai-index-label">Indice COAI · Potentiel d&apos;évolution</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                      Potentiel {diagnostic.indiceCoai.niveau.toLowerCase()}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-graphite-300">
                      Ton score révèle la qualité de ton terrain actuel et les leviers qui peuvent accélérer ta progression.
                    </p>
                  </div>
                </div>
                <DiagnosticShareButton connecte={connecte} objectif={diagnostic.profil.objectif} score={diagnostic.indiceCoai.score} />
                <p className="max-w-xl text-base leading-7 text-graphite-300">{diagnostic.profilParagraphe}</p>
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
                    className="coai-result-signal flex min-h-24 flex-col justify-start gap-1.5 rounded-xl border border-graphite-800 bg-graphite-900/40 px-4 py-3 text-left"
                  >
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-laiton-400">
                      {bloc.label}
                    </span>
                    <span className="text-sm font-medium leading-5 text-white">{bloc.valeur}</span>
                  </div>
                ))}
              </div>

              {diagnostic.pointsATravailler.length > 0 && (
                <div className="coai-result-strategy w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 text-left sm:px-6 sm:py-6">
                  <div>
                    <SectionLabel>Points à améliorer → Solutions COAI</SectionLabel>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                      {diagnostic.pointsATravailler.length} priorité{diagnostic.pointsATravailler.length > 1 ? "s" : ""} identifiée{diagnostic.pointsATravailler.length > 1 ? "s" : ""}, une réponse concrète pour chacune
                    </h3>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-graphite-800 bg-graphite-900/50 px-4 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                        Les points à améliorer
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
                        Ce que COAI met en place
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

                  <div className="mt-5 border-t border-white/[0.07] pt-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                        Tes 3 premiers pas · 7 jours
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {diagnostic.indiceCoai.actions.map((action, index) => (
                        <div key={action.titre} className="coai-index-action-card">
                          <span>{index + 1}</span>
                          <p>{action.titre}</p>
                          <strong>{action.impact}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-5 text-graphite-500">
                    Indicateur de coaching calculé à partir de tes réponses. Il ne constitue pas une mesure médicale.
                  </p>
                </div>
              )}

              <div className="flex w-full flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-6 text-left">
                <div>
                  <SectionLabel>Aperçu de ton programme</SectionLabel>
                  <p className="mt-2 text-sm leading-6 text-graphite-200">{diagnostic.pitchEvolution}</p>
                </div>
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
                <p className="border-t border-white/[0.07] pt-4 text-sm leading-6 text-graphite-200">
                  <span className="font-semibold text-white">Jamais livré à toi-même :</span> avec
                  Transformation ou VIP, un <span className="text-laiton-300">coach diplômé d&apos;État</span>{" "}
                  valide ton programme et te suit dans la durée, pendant que ton{" "}
                  <span className="text-laiton-300">Coach IA répond 24h/24, 7j/7</span> entre deux
                  séances.
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
                <div className="coai-result-entry flex w-full flex-col items-center gap-3 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-7 text-center sm:py-9">
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
                      <Button
                        onClick={appliquerAuProfil}
                        disabled={applyStatus === "loading"}
                        className="coai-rainbow-cta min-w-[17rem] border-0 px-8 py-4 text-base font-extrabold text-[#111216] shadow-[0_20px_55px_-18px_rgba(201,162,98,.8)]"
                      >
                        {applyStatus === "loading"
                          ? "…"
                          : aDejaUnProgramme
                            ? "Appliquer à mon futur programme →"
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
                  <div className="coai-diagnostic-kicker">
                    <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                    <span>Ton espace est prêt</span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">Découvre ton coaching avant de choisir.</h3>
                  <p className="max-w-xl text-sm leading-6 text-graphite-300">
                    Ton tableau de bord personnalisé t&apos;attend. Explore ton profil et ton futur
                    accompagnement gratuitement. Le paiement ne sera proposé que lorsque tu voudras
                    générer ton programme complet ou activer un suivi humain.
                  </p>
                  <Link href={signUpHref()} onClick={handleCreerCompte}>
                    <Button className="px-8 py-3.5">Entrer dans mon espace COAI →</Button>
                  </Link>
                  <span className="text-xs text-graphite-500">Aucune carte bancaire maintenant</span>
                </div>
              )}

              <p className="max-w-lg text-sm leading-6 text-graphite-300">
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
