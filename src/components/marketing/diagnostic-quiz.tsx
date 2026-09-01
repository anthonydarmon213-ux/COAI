"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ageCoaiDeclaratif, AGE_COAI_DECLARATIF_DISCLAIMER } from "@/lib/diagnostic/age-coai-declaratif";
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
import { FormuleRecommandeeCard } from "@/components/marketing/formule-recommandee-card";
import { FondateurTicker } from "@/components/marketing/fondateur-ticker";
import { ProjectionEmotionnelleCard } from "@/components/marketing/projection-emotionnelle-card";
import { construireProjection, EVENEMENTS_DECLENCHEURS } from "@/lib/diagnostic/projection-emotionnelle";
import { Gauge } from "@/components/ui/gauge";

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
const OBJECTIF_AUTRE_LABEL = "Autre, à préciser";
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
  AUTRE_LABEL,
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
  "Analyse de tes réponses...",
  "Calcul de ton format d'entraînement...",
  "Calibrage de ta nutrition...",
  "Construction de ton profil COAI...",
];

// Contenu des écrans respirants "respire1"/"respire2" (19/08/2026) — texte
// jamais inventé, seulement ce que COAI fait réellement (cf. commentaire
// sur le type Step). Deux écrans, positionnés après "echeance" (~1/3 du
// quiz) et après "profilPhysique" (~2/3 du quiz) pour rester dans la
// fourchette "tous les 5-7 questions" de l'audit MyFitCoach.
const BREATHERS: Record<"respire1" | "respire2", { kicker: string; titre: string; texte: string }> = {
  respire1: {
    kicker: "Pourquoi ce diagnostic",
    titre: "Un programme générique se règle en 30 secondes. Le tien, non.",
    texte: "Chaque réponse ici nourrit un vrai champ de ton profil, pas une case cochée pour la forme. C'est ce qui permet à COAI de proposer un programme cohérent dès le départ.",
  },
  respire2: {
    kicker: "Ce qui fait tenir un programme",
    titre: "La régularité compte plus que l'intensité du premier jour.",
    texte: "Un programme qui s'adapte à ta récupération et à ton rythme réel est un programme que tu continues. C'est le principe du moteur d'adaptation COAI : garder, progresser ou ajuster, séance après séance.",
  },
};

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

const SEXES = ["Homme", "Femme"];

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

const ECHEANCES = ["Dans 1 mois — accompagnement VIP", "Dans 3 mois", "Dans 6 mois", "Dans 12 mois", "Pas de date précise"];
const MOBILITE_REPERES = ["Fluide, sans gêne", "Quelques raideurs", "Mouvement limité", "Douleur — je ne teste pas"];
const CARDIO_REPERES = ["Je monte 3 étages facilement", "Je suis légèrement essoufflé", "Je dois faire une pause", "Je ne peux pas l’évaluer"];
const FORCE_REPERES = ["10 levers de chaise faciles", "10 levers avec effort", "Moins de 10 répétitions", "Je ne peux pas l’évaluer"];
const MOUVEMENT_REPERES = ["Stable et contrôlé", "Manque d’équilibre", "Compensation ou raideur", "Douleur — je ne teste pas"];
const NIVEAUX_CONNAISSANCE = ["Je découvre", "Quelques bases", "Bonnes connaissances", "Très à l’aise"];
const PRATIQUES_BIEN_ETRE = ["Méditation", "Respiration / breathwork", "Yoga", "Aucune actuellement"];
const QUOTIDIENS = [
  "Assis presque toute la journée",
  "Journée mixte : assis et debout",
  "Souvent debout ou en déplacement",
  "Métier physique / très actif",
];

const MOTIVATIONS = [
  "Me sentir mieux dans mon corps",
  "Retrouver de l'énergie au quotidien",
  "Améliorer ma santé et mon bien-être",
  "Atteindre un défi personnel",
  "Reprendre confiance en moi",
  AUTRE_LABEL,
];

const ATTENTES_COAI = [
  "Savoir exactement quoi faire",
  "Rester régulier et motivé",
  "Adapter mes séances à mon quotidien",
  "Progresser sans me blesser",
  "Pouvoir compter sur un coach",
  AUTRE_LABEL,
];

const PRIORITES_OPTIMISATION = ["L’entraînement", "La nutrition", "La récupération", "Les trois", AUTRE_LABEL];

const FREINS = [
  "Le manque de temps",
  "Le manque de régularité",
  "Un programme mal adapté",
  "Des douleurs ou une blessure",
  "Le manque de motivation",
  "Je ne savais pas par où commencer",
  AUTRE_LABEL,
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
  | "quotidien"
  | "niveau"
  | "objectif"
  | "intentions"
  | "accompagnement"
  | "histoire"
  | "expertise"
  | "echeance"
  | "declencheur"
  | "evaluationPhysique"
  | "equipement"
  | "lieu"
  | "duree"
  | "frequence"
  | "sport"
  | "santeFeminine"
  | "profilPhysique"
  | "alimentation"
  | "sommeil"
  | "sante"
  | "coach"
  | "email"
  | "respire1"
  | "respire2"
  | "analyse"
  | "reveal"
  | "result";
// Ordonné pour couvrir explicitement les 3 piliers COAI (entraînement,
// nutrition, récupération) plutôt que de s'arrêter à l'entraînement —
// chaque question nourrit un vrai champ de Profile, jamais du remplissage.
// "email" est la dernière étape, juste avant la révélation : c'est le
// moment où la personne a le plus investi, donc le plus disposée à le
// laisser (cf. effet IKEA / coût irrécupérable).
// "lieu"/"duree" (Phase 5, 11/08/2026) : lieu distinct de l'équipement,
// durée de séance visée — deux infos jusque-là jamais demandées.
// "profilPhysique" (19/08/2026, retour Anthony : trop de slides séparés
// pour des infos aussi basiques) regroupe sexe/âge/taille/poids en une
// seule étape, en tête du quiz — tous requis pour continuer. Note : avant
// cette date, "sexe" était une étape séparée plus loin dans le quiz.
// "santeFeminine" (14/08/2026, retour utilisatrice) : cycle menstruel /
// grossesse / post-partum — n'apparaît que si sexe === "Femme" (filtré dans
// questionSteps ci-dessous), jamais présumé, toujours opt-in. Placée juste
// après "profilPhysique" (bug corrigé le 19/08/2026 : cette étape n'était
// jamais atteignable, absente par erreur de QUESTION_STEPS malgré son
// rendu/état déjà entièrement câblés).
// "respire1"/"respire2" (19/08/2026, principe transférable #2 de l'audit
// MyFitCoach demandé par Anthony : "écrans pédagogiques non comptés dans
// la progression, insérés tous les 5-7 questions — casse le rythme sans
// allonger le quiz perçu"). Contrairement à MyFitCoach, aucun chiffre
// inventé dedans ("31% plus fort...") : uniquement ce que COAI fait
// réellement (profil réellement utilisé, moteur d'adaptation), déjà
// documenté dans PITCH_EVOLUTION. Insérées via STEP_ORDER (pas dans
// questionSteps), donc exclues de la barre de progression et du
// dénominateur "X sur Y", comme "analyse"/"result".
// "analyse" (Phase 5) : moment de transition avant la révélation, pas une
// vraie question — exclu de la barre de progression comme "result".
// "reveal" (19/08/2026, inspiré de l'audit UX MyFitCoach demandé par
// Anthony) : entre "analyse" et "result", quelques écrans courts qui
// dévoilent un par un des éléments déjà calculés par `diagnostic`/
// `signauxDiagnostic` (score, jauges, points à travailler, 3 premiers pas)
// — jamais de nouvelle donnée inventée, juste le même résultat déjà
// construit, montré en rythme plutôt que d'un bloc. La page "result"
// complète n'est ni coupée ni dupliquée, elle arrive telle quelle ensuite.
// Parcours resserré le 01/09/2026 (Anthony : « il faut moins d'étapes, il y
// a trop de frictions », « il faut faire goûter d'abord »).
//
// Ne restent avant l'entrée dans l'app que les questions alimentant un champ
// STRUCTURÉ du profil, c'est-à-dire réellement exploité par le générateur de
// programme (cf. ProfilUtilisateur dans src/lib/ai/client.ts) : morphologie,
// niveau, objectif, équipement, lieu, durée, fréquence, alimentation,
// sommeil et contraintes de santé.
//
// Retirées d'ici : "quotidien", "accompagnement", "echeance", "declencheur".
// Elles n'étaient concaténées que dans la chaîne de texte libre `objectifs`
// — utiles au ton du coaching, jamais déterminantes pour construire une
// séance. Elles sont désormais proposées après l'inscription, à quelqu'un
// qui a déjà goûté au produit. Leur état et leur rendu restent en place :
// remettre une étape dans ce tableau suffit à la réactiver.
//
// "santeFeminine" reste ici : c'est une donnée de SÉCURITÉ (grossesse,
// post-partum) qui conditionne de vraies adaptations, pas un enrichissement.
const QUESTION_STEPS: Step[] = [
  "profilPhysique",
  "santeFeminine",
  // Rétablie le 01/09/2026 : je l'avais classée à tort en "texte libre".
  // Elle alimente calculerIndiceCoai (assis toute la journée = -4 points) et
  // la sédentarité est LE marqueur central d'un positionnement longévité.
  "quotidien",
  "niveau",
  "objectif",
  "equipement",
  "lieu",
  "duree",
  "frequence",
  "alimentation",
  "sommeil",
  "sante",
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

// Icônes des cartes de choix (21/08/2026, demande Anthony : "remplace les
// boutons texte par des cartes interactives avec icônes"). Emoji plutôt
// qu'une bibliothèque d'icônes : rendu identique sur tous les appareils
// sans dépendance ni requête réseau, et lisible à petite taille sur mobile.
// Une entrée absente de la table retombe sur une puce neutre — jamais
// d'icône approximative qui suggérerait autre chose que le libellé.
const ICONE_CHOIX: Record<string, string> = {
  // Objectifs
  "Perdre du gras": "🔥",
  "Prendre du muscle": "💪",
  "Me sentir mieux au quotidien": "🌿",
  "Progresser en force": "🏋️",
  "Améliorer mes performances": "⚡",
  "Gagner en mobilité": "🤸",
  "Reprendre le sport": "🔄",
  // Niveaux
  "Débutant": "🌱",
  "Intermédiaire": "📈",
  "Avancé": "🎯",
  // Équipement
  "Salle de sport complète": "🏟️",
  "Matériel à la maison (haltères, bancs...)": "🏠",
  "Élastiques / bandes de résistance": "🎗️",
  "Kettlebell": "🔔",
  "TRX / sangles de suspension": "🪢",
  "Aucun matériel": "🧍",
  // Lieux
  "Salle de sport": "🏟️",
  "À la maison": "🏠",
  "En extérieur": "🌳",
  "Ça dépend des jours": "🔀",
};

// Zones du corps pour la sélection des douleurs (21/08/2026, demande
// Anthony : "grille de boutons visuels pour sélectionner les zones").
// Ordre haut → bas du corps, pour que la grille se lise comme une
// silhouette. Les libellés doivent rester EXACTEMENT ceux de CONTRAINTES
// pour "Dos", "Genoux" et "Épaules" : ce sont ces chaînes qui partent en
// base, une variante casserait le pré-remplissage du profil.
const ZONES_CORPS: { label: string; icone: string }[] = [
  { label: "Épaules", icone: "🫱" },
  { label: "Dos", icone: "🔙" },
  { label: "Coudes", icone: "💪" },
  { label: "Poignets", icone: "✋" },
  { label: "Hanches", icone: "🦴" },
  { label: "Genoux", icone: "🦵" },
  { label: "Chevilles", icone: "🦶" },
  { label: "Nuque / cervicales", icone: "🧣" },
];

// Grande carte de choix avec icône — remplace OptionCard sur les questions
// où un repère visuel aide vraiment (objectif, niveau, équipement, lieu).
// Les questions à réponse purement numérique ou textuelle gardent
// OptionCard : y coller une icône décorative n'aiderait personne.
function ChoixVisuel({
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
  const icone = ICONE_CHOIX[label];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex items-center gap-3.5 rounded-2xl border px-4 py-4 text-left transition duration-200 ${
        active
          ? "border-laiton-400/60 bg-laiton-400/[0.1] shadow-[0_0_0_1px_rgba(201,162,98,0.25),0_18px_40px_-28px_rgba(201,162,98,0.9)]"
          : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-laiton-400/30 hover:bg-white/[0.06]"
      }`}
    >
      {/* Émojis retirés le 01/09/2026 (Anthony : « ça fait bas de gamme »).
          Remplacés par l'initiale du libellé dans une pastille sobre : on
          garde le repère visuel qui aide à balayer la liste, sans le registre
          enfantin. */}
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl font-display text-sm font-bold tracking-wide transition ${
          active ? "bg-laiton-400/20 text-laiton-200" : "bg-white/[0.05] text-graphite-500 group-hover:bg-white/[0.08]"
        }`}
      >
        {(label ?? "").trim().charAt(0).toUpperCase() || "·"}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${active ? "text-laiton-100" : "text-graphite-100"}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-graphite-500">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border text-[11px] transition ${
          active ? "border-laiton-400 bg-laiton-400 text-[#111216]" : "border-white/20 text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
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
        <div><p className="font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-graphite-400">{instruction}</p></div>
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

function VoletCard({
  label,
  photoUrl,
  accentColor,
  children,
}: {
  label: string;
  photoUrl?: string | null;
  accentColor?: string;
  children: ReactNode;
}) {
  return (
    <article className="group relative flex min-h-[280px] w-full flex-col justify-end overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-graphite-950 text-left shadow-[0_20px_55px_rgba(0,0,0,.28)]">
      <div
        className="absolute inset-0 overflow-hidden bg-graphite-900"
        style={accentColor ? { boxShadow: `inset 0 3px 0 ${accentColor}` } : undefined}
      >
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- chemin local fourni par le serveur, dimensions gérées par la carte responsive
          <img src={photoUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/5" />
      <div className="relative z-10 flex flex-col justify-end px-5 py-5">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: accentColor ?? "#767c86" }}
        >
          {label}
        </span>
        <div className="mt-2 text-sm leading-6 text-white/90">{children}</div>
      </div>
    </article>
  );
}

export type PilierPhotos = {
  entrainement: string | null;
  nutrition: string | null;
  recuperation: string | null;
  hydratation: string | null;
};

const PILIER_PHOTOS_VIDE: PilierPhotos = {
  entrainement: null,
  nutrition: null,
  recuperation: null,
  hydratation: null,
};

export function DiagnosticQuiz({
  connecte = false,
  aDejaUnProgramme = false,
  pilierPhotos = PILIER_PHOTOS_VIDE,
}: { connecte?: boolean; aDejaUnProgramme?: boolean; pilierPhotos?: PilierPhotos } = {}) {
  const [step, setStep] = useState<Step>("intro");

  // Remonte en haut à chaque changement d'étape (01/09/2026, Anthony : « on
  // reste en bas, il faut scroller pour remonter, on perd en fluidité »).
  // Sur mobile, une liste d'options longue laissait l'écran au niveau du
  // bouton « Continuer » : la question suivante s'affichait hors champ et
  // donnait l'impression que rien ne s'était passé.
  //
  // "auto" et non "smooth" : un défilement animé sur plusieurs centaines de
  // pixels rend le passage d'une question à l'autre plus lent, pas plus fluide.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);
  const [persona, setPersona] = useState<string[]>([]);
  const [activiteQuotidienne, setActiviteQuotidienne] = useState<string | null>(null);
  const [niveau, setNiveau] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string | null>(null);
  const [objectifsPrincipaux, setObjectifsPrincipaux] = useState<string[]>([]);
  const [objectifPrincipalLibre, setObjectifPrincipalLibre] = useState("");
  const [objectifSecondaire, setObjectifSecondaire] = useState("");
  const [importanceObjectif, setImportanceObjectif] = useState("");
  // Multi-choix (20/08/2026, retour Anthony : "il n'y a pas forcément une
  // seule réponse") — même convention que equipement/sport/sante : un
  // tableau + un champ "AutreTexte" séparé, mergés via resolveAutre().
  const [freinsPrincipaux, setFreinsPrincipaux] = useState<string[]>([]);
  const [freinsAutreTexte, setFreinsAutreTexte] = useState("");
  const [attentesCoai, setAttentesCoai] = useState<string[]>([]);
  const [attentesCoaiAutreTexte, setAttentesCoaiAutreTexte] = useState("");
  const [prioriteOptimisation, setPrioriteOptimisation] = useState("");
  const [passeSportif, setPasseSportif] = useState("");
  const [sourceDecouverteLibre, setSourceDecouverteLibre] = useState("");
  const [connaissanceMusculation, setConnaissanceMusculation] = useState<string | null>(null);
  const [connaissanceNutrition, setConnaissanceNutrition] = useState<string | null>(null);
  const [connaissanceRecuperation, setConnaissanceRecuperation] = useState<string | null>(null);
  const [pratiquesBienEtre, setPratiquesBienEtre] = useState<string[]>([]);
  const [anneesMusculation, setAnneesMusculation] = useState("");
  const [maxDeveloppeCouche, setMaxDeveloppeCouche] = useState("");
  const [maxDeadlift, setMaxDeadlift] = useState("");
  const [prioriteTravail, setPrioriteTravail] = useState("");
  const [echeance, setEcheance] = useState<string | null>(null);
  const [mobiliteRepere, setMobiliteRepere] = useState<string | null>(null);
  const [cardioRepere, setCardioRepere] = useState<string | null>(null);
  const [forceRepere, setForceRepere] = useState<string | null>(null);
  const [mouvementRepere, setMouvementRepere] = useState<string | null>(null);
  const [equipement, setEquipement] = useState<string[]>([]);
  const [equipementAutreTexte, setEquipementAutreTexte] = useState("");
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
  // Événement émotionnel déclencheur (19/08/2026, demande Anthony — façon
  // MyFitCoach) : utilisé uniquement pour la projection affichée sur
  // l'écran de résultat, jamais persisté sur Profile.
  const [declencheur, setDeclencheur] = useState<string[]>([]);
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
  // Vraie raison de l'échec de génération, quand l'API en donne une
  // (21/08/2026, cf. appliquerAuProfil) — null si la cause est inconnue,
  // auquel cas le message générique reste affiché.
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null);
  const [applyNeedsFormule, setApplyNeedsFormule] = useState(false);
  const [resumable, setResumable] = useState(false);

  const stepIndex = questionSteps.indexOf(step);
  const progressPct = stepIndex >= 0 ? Math.round((stepIndex / questionSteps.length) * 100) : 0;
  const lastQuestionStep = questionSteps[questionSteps.length - 1];

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function toggleDeclencheur(value: string) {
    const sansEvenement = "Pas d'événement précis, juste pour moi";
    if (value === sansEvenement) {
      setDeclencheur(declencheur.includes(value) ? [] : [value]);
      return;
    }
    const choixActuels = declencheur.filter((item) => item !== sansEvenement);
    setDeclencheur(
      choixActuels.includes(value)
        ? choixActuels.filter((item) => item !== value)
        : [...choixActuels, value]
    );
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

  function togglePratiqueBienEtre(value: string) {
    const aucune = "Aucune actuellement";
    if (value === aucune) {
      setPratiquesBienEtre((prev) => (prev.includes(aucune) ? [] : [aucune]));
      return;
    }
    setPratiquesBienEtre((prev) => {
      const sansAucune = prev.filter((item) => item !== aucune);
      return sansAucune.includes(value) ? sansAucune.filter((item) => item !== value) : [...sansAucune, value];
    });
  }

  // "respire1"/"respire2" insérés juste après leur étape ancre (jamais
  // avant "intro"/en tête de liste, jamais collés l'un à l'autre) — si
  // l'étape ancre disparaît un jour de questionSteps, l'écran respirant
  // correspondant disparaît aussi avec elle plutôt que de se retrouver
  // orphelin en tête ou en fin de parcours.
  // "profilPhysique" est passé en tête de quiz (19/08/2026) : l'ancre de
  // respire2 est déplacée sur "frequence" pour rester à ~2/3 du parcours,
  // comme avant ce changement.
  // Une seule respiration depuis le resserrage : deux pauses sur un parcours
  // réduit d'un tiers cassaient le rythme au lieu de le soutenir. Placée
  // après "frequence", à mi-chemin. ("echeance" ne fait plus partie du
  // parcours, son entrée n'aurait plus jamais été atteinte.)
  const BREATHER_APRES: Partial<Record<Step, Step>> = { frequence: "respire2" };
  const STEP_ORDER: Step[] = ["intro"];
  for (const s of questionSteps) {
    STEP_ORDER.push(s);
    const breather = BREATHER_APRES[s];
    if (breather) STEP_ORDER.push(breather);
  }
  STEP_ORDER.push("analyse", "reveal", "result");

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
    // "analyse"/"reveal" ne sont pas de vraies étapes (rien à corriger) :
    // "Retour" depuis "result" n'existe pas (pas de bouton nav sur ce step),
    // et "analyse"/"reveal" enchaînent automatiquement l'un vers l'autre
    // puis vers "result" sans jamais s'arrêter dessus.
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

  // Écrans respirants "respire1"/"respire2" (19/08/2026, corrigé le
  // 19/08/2026 suite au retour d'Anthony : l'auto-avance à 4,2s ne
  // laissait pas le temps de lire le texte, alors que l'écran affiche
  // "Touche l'écran pour continuer" — contradiction gênante entre le
  // texte et le comportement réel). N'avance plus que sur un vrai tap/clic
  // (handleBreatherTap), jamais automatiquement.
  function handleBreatherTap() {
    if (step !== "respire1" && step !== "respire2") return;
    goNext();
  }

  // Sauvegarde la progression à chaque étape de question (jamais pendant
  // "intro"/"analyse"/"reveal"/"result"/"respire1"/"respire2" — rien à
  // reprendre une fois le résultat atteint, ce n'est plus un abandon).
  useEffect(() => {
    if (step === "intro" || step === "analyse" || step === "reveal" || step === "result" || step === "respire1" || step === "respire2") return;
    saveDiagnosticProgress({
      step,
      persona,
      personaAutreTexte,
      activiteQuotidienne,
      niveau,
      objectif,
      objectifsPrincipaux,
      objectifAutreTexte,
      objectifPrincipalLibre,
      objectifSecondaire,
      importanceObjectif,
      freinsPrincipaux,
      freinsAutreTexte,
      attentesCoai,
      attentesCoaiAutreTexte,
      prioriteOptimisation,
      passeSportif,
      sourceDecouverteLibre,
      connaissanceMusculation,
      connaissanceNutrition,
      connaissanceRecuperation,
      pratiquesBienEtre,
      anneesMusculation,
      maxDeveloppeCouche,
      maxDeadlift,
      prioriteTravail,
      echeance,
      declencheur,
      mobiliteRepere,
      cardioRepere,
      forceRepere,
      mouvementRepere,
      equipement,
      equipementAutreTexte,
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
    activiteQuotidienne,
    niveau,
    objectif,
    objectifsPrincipaux,
    objectifAutreTexte,
    objectifPrincipalLibre,
    objectifSecondaire,
    importanceObjectif,
    freinsPrincipaux,
    freinsAutreTexte,
    attentesCoai,
    attentesCoaiAutreTexte,
    passeSportif,
    sourceDecouverteLibre,
    connaissanceMusculation,
    connaissanceNutrition,
    connaissanceRecuperation,
    pratiquesBienEtre,
    anneesMusculation,
    maxDeveloppeCouche,
    maxDeadlift,
    prioriteTravail,
    echeance,
    declencheur,
    mobiliteRepere,
    cardioRepere,
    forceRepere,
    mouvementRepere,
    equipement,
    equipementAutreTexte,
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
    if (typeof saved.activiteQuotidienne === "string") setActiviteQuotidienne(saved.activiteQuotidienne);
    if (typeof saved.niveau === "string") setNiveau(saved.niveau);
    if (typeof saved.objectif === "string") setObjectif(saved.objectif);
    if (Array.isArray(saved.objectifsPrincipaux)) setObjectifsPrincipaux(saved.objectifsPrincipaux as string[]);
    if (typeof saved.objectifAutreTexte === "string") setObjectifAutreTexte(saved.objectifAutreTexte);
    if (typeof saved.objectifPrincipalLibre === "string") setObjectifPrincipalLibre(saved.objectifPrincipalLibre);
    if (typeof saved.objectifSecondaire === "string") setObjectifSecondaire(saved.objectifSecondaire);
    if (typeof saved.importanceObjectif === "string") setImportanceObjectif(saved.importanceObjectif);
    if (Array.isArray(saved.freinsPrincipaux)) setFreinsPrincipaux(saved.freinsPrincipaux as string[]);
    if (typeof saved.freinsAutreTexte === "string") setFreinsAutreTexte(saved.freinsAutreTexte);
    if (Array.isArray(saved.attentesCoai)) setAttentesCoai(saved.attentesCoai as string[]);
    if (typeof saved.attentesCoaiAutreTexte === "string") setAttentesCoaiAutreTexte(saved.attentesCoaiAutreTexte);
    if (typeof saved.prioriteOptimisation === "string") setPrioriteOptimisation(saved.prioriteOptimisation);
    if (typeof saved.passeSportif === "string") setPasseSportif(saved.passeSportif);
    if (typeof saved.sourceDecouverteLibre === "string") setSourceDecouverteLibre(saved.sourceDecouverteLibre);
    if (typeof saved.connaissanceMusculation === "string") setConnaissanceMusculation(saved.connaissanceMusculation);
    if (typeof saved.connaissanceNutrition === "string") setConnaissanceNutrition(saved.connaissanceNutrition);
    if (typeof saved.connaissanceRecuperation === "string") setConnaissanceRecuperation(saved.connaissanceRecuperation);
    if (Array.isArray(saved.pratiquesBienEtre)) setPratiquesBienEtre(saved.pratiquesBienEtre as string[]);
    if (typeof saved.anneesMusculation === "string") setAnneesMusculation(saved.anneesMusculation);
    if (typeof saved.maxDeveloppeCouche === "string") setMaxDeveloppeCouche(saved.maxDeveloppeCouche);
    if (typeof saved.maxDeadlift === "string") setMaxDeadlift(saved.maxDeadlift);
    if (typeof saved.prioriteTravail === "string") setPrioriteTravail(saved.prioriteTravail);
    if (typeof saved.echeance === "string") setEcheance(saved.echeance);
    if (Array.isArray(saved.declencheur)) setDeclencheur(saved.declencheur as string[]);
    else if (typeof saved.declencheur === "string") setDeclencheur([saved.declencheur]);
    if (typeof saved.mobiliteRepere === "string") setMobiliteRepere(saved.mobiliteRepere);
    if (typeof saved.cardioRepere === "string") setCardioRepere(saved.cardioRepere);
    if (typeof saved.forceRepere === "string") setForceRepere(saved.forceRepere);
    if (typeof saved.mouvementRepere === "string") setMouvementRepere(saved.mouvementRepere);
    if (Array.isArray(saved.equipement)) setEquipement(saved.equipement as string[]);
    if (typeof saved.equipementAutreTexte === "string") setEquipementAutreTexte(saved.equipementAutreTexte);
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
  const [analyseProgress, setAnalyseProgress] = useState(0);
  useEffect(() => {
    if (step !== "analyse") return;
    setAnalyseIndex(0);
    setAnalyseProgress(0);
    // 3 secondes au total (21/08/2026, demande Anthony) réparties sur les
    // messages, avec une jauge qui avance en continu — la personne voit un
    // vrai décompte plutôt qu'un simple arc qui tourne.
    const dureeTotale = 3000;
    const stepDuration = Math.round(dureeTotale / ANALYSE_MESSAGES.length);
    const messageInterval = setInterval(() => {
      setAnalyseIndex((i) => (i + 1 < ANALYSE_MESSAGES.length ? i + 1 : i));
    }, stepDuration);
    const debut = Date.now();
    const progressInterval = setInterval(() => {
      setAnalyseProgress(Math.min(100, Math.round(((Date.now() - debut) / dureeTotale) * 100)));
    }, 60);
    const advance = setTimeout(goNext, dureeTotale + 250);
    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
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
    if (step === "quotidien") return Boolean(activiteQuotidienne);
    if (step === "niveau") return Boolean(niveau);
    if (step === "objectif") return objectifsPrincipaux.length > 0 || Boolean(objectif);
    if (step === "accompagnement") return true;
    if (step === "echeance") return Boolean(echeance);
    if (step === "declencheur") return declencheur.length > 0;
    if (step === "equipement") return equipement.length > 0;
    if (step === "lieu") return Boolean(lieu);
    if (step === "duree") return Boolean(duree);
    if (step === "frequence") return Boolean(frequence);
    if (step === "santeFeminine") return true; // entièrement facultatif, opt-in
    if (step === "profilPhysique") return Boolean(sexe && age && tailleCm && poidsKg);
    if (step === "alimentation") return Boolean(habitudesAlimentaires);
    if (step === "sommeil") return Boolean(qualiteSommeil);
    if (step === "sante") return true; // peut n'avoir rien à signaler
    if (step === "email") return isValidEmail(email) && isValidTelephone(telephone) && consentEmail;
    return true;
    // persona / mobiliteRepere / cardioRepere / forceRepere /
    // mouvementRepere / coachPreference retirés (22/08/2026) : les étapes
    // qui les utilisaient ont été supprimées avec le code mort du
    // diagnostic, ces dépendances n'étaient plus lues ici et faisaient
    // remonter un warning react-hooks/exhaustive-deps à chaque build.
  }, [
    step,
    activiteQuotidienne,
    niveau,
    objectif,
    objectifsPrincipaux,
    echeance,
    declencheur,
    equipement,
    lieu,
    duree,
    frequence,
    sexe,
    age,
    tailleCm,
    poidsKg,
    habitudesAlimentaires,
    qualiteSommeil,
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
        activiteQuotidienne,
        niveau,
        objectif: resolveObjectif(objectif, objectifAutreTexte),
        equipement: resolveAutre(equipement, equipementAutreTexte),
        lieu,
        duree,
        frequence,
        habitudesAlimentaires,
        qualiteSommeil,
        sante: resolveAutre(sante, santeAutreTexte),
        coachPreference,
      }),
    [
      persona,
      personaAutreTexte,
      activiteQuotidienne,
      niveau,
      objectif,
      objectifAutreTexte,
      equipement,
      equipementAutreTexte,
      lieu,
      duree,
      frequence,
      habitudesAlimentaires,
      qualiteSommeil,
      sante,
      santeAutreTexte,
      coachPreference,
    ]
  );

  // Projection émotionnelle (19/08/2026) : dépend de `diagnostic` (Score
  // COAI déjà calculé) donc déclarée après lui.
  const projection = useMemo(
    () =>
      diagnostic
        ? construireProjection({
            objectif: resolveObjectif(objectif, objectifAutreTexte),
            poidsKg,
            echeance,
            evenement: declencheur.join(" · ") || null,
            indiceCoaiScore: diagnostic.indiceCoai.score,
          })
        : null,
    [diagnostic, objectif, objectifAutreTexte, poidsKg, echeance, declencheur]
  );

  const signauxDiagnostic = useMemo(() => {
    const entrainement = niveau === "Avancé" ? 82 : niveau === "Intermédiaire" ? 68 : 52;
    const alimentationScores: Record<string, number> = {
      "Repas structurés et équilibrés": 82,
      "Grignotage fréquent / repas irréguliers": 44,
      "Jeûne intermittent": 65,
      "Beaucoup de plats préparés ou fast-food": 36,
      "Déjà suivi par un nutritionniste": 86,
    };
    const sommeilScores: Record<string, number> = {
      "Mauvaise (moins de 5h, sommeil agité)": 28,
      "Moyenne (5-6h, réveils fréquents)": 52,
      "Bonne (7-8h, plutôt réparateur)": 78,
      "Excellente (8h ou plus, réparateur)": 92,
    };
    const alimentation = habitudesAlimentaires ? alimentationScores[habitudesAlimentaires] ?? 50 : 0;
    const sommeil = qualiteSommeil ? sommeilScores[qualiteSommeil] ?? 50 : 0;
    const contraintesSignalees = resolveAutre(sante, santeAutreTexte).filter((item) => item !== AUCUNE_DOULEUR_LABEL).length;
    const recuperation = Math.max(25, Math.round(sommeil * 0.8 - Math.min(20, contraintesSignalees * 5) + 12));
    return { entrainement, alimentation, recuperation, sommeil };
  }, [niveau, habitudesAlimentaires, qualiteSommeil, sante, santeAutreTexte]);

  // "reveal" (19/08/2026, direction MyFitCoach demandée par Anthony) :
  // au lieu d'atterrir d'un coup sur la longue page "result", on dévoile
  // 3 ou 4 écrans courts en séquence — score, jauges, points à travailler
  // (si présents), 3 premiers pas — chacun tiré de `diagnostic`/
  // `signauxDiagnostic` déjà calculés juste au-dessus, jamais une donnée
  // nouvelle. Écran "Ce qu'on va travailler" sauté si pointsATravailler est
  // vide (même garde que celle déjà utilisée plus bas dans "result"). Doit
  // rester déclaré après `diagnostic`/`signauxDiagnostic` (sinon "used
  // before declaration").
  // Correction (20/08/2026, retour Anthony : "ça va beaucoup trop vite, on
  // n'a pas le temps de lire") : plus d'auto-avance par timer — exactement
  // le même correctif déjà appliqué à respire1/respire2 le 19/08/2026 pour
  // le même symptôme. N'avance plus que sur un vrai tap/clic.
  const revealScreenCount = (diagnostic?.pointsATravailler.length ?? 0) > 0 ? 4 : 3;
  const [revealIndex, setRevealIndex] = useState(0);
  useEffect(() => {
    if (step !== "reveal") return;
    setRevealIndex(0);
    trackFunnelEvent("diagnostic_reveal_started");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleRevealTap() {
    if (step !== "reveal") return;
    if (revealIndex + 1 < revealScreenCount) {
      setRevealIndex((i) => i + 1);
    } else {
      goNext();
    }
  }

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
    const objectifsResolus = objectifsPrincipaux.map((item) =>
      item === OBJECTIF_AUTRE_LABEL ? (objectifAutreTexte.trim() || item) : item
    );
    const santeReelle = resolveAutre(sante, santeAutreTexte).filter((s) => s !== AUCUNE_DOULEUR_LABEL);
    const sportResolu = resolveAutre(sport, sportAutreTexte);
    return {
      niveau: niveau ?? undefined,
      persona: personaResolue.length ? personaResolue.join(", ") : undefined,
      objectifs: [
        ...(objectifsResolus.length ? objectifsResolus : [objectifResolu]),
        activiteQuotidienne ? `activité quotidienne : ${activiteQuotidienne}` : null,
        objectifPrincipalLibre.trim() ? `objectif précisé : ${objectifPrincipalLibre.trim()}` : null,
        objectifSecondaire.trim() ? `objectif secondaire : ${objectifSecondaire.trim()}` : null,
        importanceObjectif.trim() ? `motivation : ${importanceObjectif.trim()}` : null,
        resolveAutre(freinsPrincipaux, freinsAutreTexte).length
          ? `freins : ${resolveAutre(freinsPrincipaux, freinsAutreTexte).join(", ")}`
          : null,
        resolveAutre(attentesCoai, attentesCoaiAutreTexte).length
          ? `attentes envers COAI : ${resolveAutre(attentesCoai, attentesCoaiAutreTexte).join(", ")}`
          : null,
        prioriteOptimisation.trim() ? `souhaite optimiser : ${prioriteOptimisation.trim()}` : null,
        passeSportif.trim() ? `passé sportif : ${passeSportif.trim()}` : null,
        sourceDecouverteLibre.trim() ? `a connu COAI via : ${sourceDecouverteLibre.trim()}` : null,
        prioriteTravail.trim() ? `priorité actuelle : ${prioriteTravail.trim()}` : null,
        echeance ? `échéance : ${echeance}` : null,
        declencheur.length ? `déclencheurs : ${declencheur.join(", ")}` : null,
        personaAutreResolue,
      ].filter(Boolean).join(" — ") || undefined,
      equipementDisponible: equipement.length ? resolveAutre(equipement, equipementAutreTexte).join(", ") : undefined,
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
        connaissanceMusculation ? `Connaissances musculation : ${connaissanceMusculation}` : null,
        connaissanceNutrition ? `Connaissances nutrition : ${connaissanceNutrition}` : null,
        connaissanceRecuperation ? `Connaissances récupération : ${connaissanceRecuperation}` : null,
        anneesMusculation.trim() ? `Ancienneté musculation : ${anneesMusculation.trim()}` : null,
        maxDeveloppeCouche.trim() ? `Développé couché : ${maxDeveloppeCouche.trim()} kg` : null,
        maxDeadlift.trim() ? `Deadlift : ${maxDeadlift.trim()} kg` : null,
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
    storeDiagnosticAnswers(reponsesEnProfil());
    window.localStorage.setItem("coai_dashboard_intro_pending", "1");
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
    setApplyErrorMessage(null);
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
      if (!genRes.ok) {
        // Bug corrigé (21/08/2026, signalé par Anthony : "un souci" affiché
        // alors que la vraie raison — pas de formule active — était déjà
        // renvoyée par l'API et jetée ici). /api/programmes/generate répond
        // 403 avec un message actionnable quand aucun abonnement n'est
        // actif (cf. hasProgrammeAccess) ou 422 si le profil est incomplet
        // — on l'affiche tel quel plutôt qu'un message générique.
        const data = await genRes.json().catch(() => null);
        setApplyErrorMessage(typeof data?.error === "string" ? data.error : null);
        setApplyNeedsFormule(genRes.status === 403);
        throw new Error();
      }
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
            activiteQuotidienne,
            niveau,
            objectif: resolveObjectif(objectif, objectifAutreTexte),
            objectifsPrincipaux: objectifsPrincipaux.map((item) =>
              item === OBJECTIF_AUTRE_LABEL ? (objectifAutreTexte.trim() || item) : item
            ),
            objectifPrincipalLibre: objectifPrincipalLibre.trim(),
            objectifSecondaire: objectifSecondaire.trim() || undefined,
            importanceObjectif: importanceObjectif.trim(),
            freinsPrincipaux: resolveAutre(freinsPrincipaux, freinsAutreTexte),
            attentesCoai: resolveAutre(attentesCoai, attentesCoaiAutreTexte),
            prioriteOptimisation: prioriteOptimisation.trim(),
            echeance,
            declencheur: declencheur.join(", "),
            mobiliteRepere,
            cardioRepere,
            forceRepere,
            mouvementRepere,
            antecedentsMedicaux: antecedentsMedicaux.trim() || undefined,
            equipement: resolveAutre(equipement, equipementAutreTexte),
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
    <div className={`coai-diagnostic-shell mx-auto w-full transition-[max-width] ${step === "result" ? "max-w-5xl" : "max-w-2xl"}`}>
      <div className="coai-diagnostic-orbit coai-diagnostic-orbit-a" aria-hidden="true" />
      <div className="coai-diagnostic-orbit coai-diagnostic-orbit-b" aria-hidden="true" />
      <div className={`coai-diagnostic-card overflow-hidden ${step === "result" ? "coai-diagnostic-result" : ""}`}>
        {step !== "intro" && step !== "result" && step !== "analyse" && step !== "reveal" && step !== "respire1" && step !== "respire2" && (
          <div className="coai-diagnostic-progress flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
            <span key={stepIndex} className="animate-reveal font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-400">
              Étape {stepIndex + 1} sur {questionSteps.length}
            </span>
            <div className="coai-progress-track h-1.5 w-32 overflow-hidden rounded-full bg-graphite-800 sm:w-40">
              <div
                className="coai-progress-value h-full rounded-full bg-laiton-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div key={step} className="coai-diagnostic-stage px-6 py-7 sm:px-8">
          {step === "intro" && (
            <div className="flex flex-col items-center gap-5 py-5 text-center sm:py-10">
              <div className="coai-diagnostic-kicker" aria-label="Ton bilan initial et ton Score COAI">
                <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                <span>Bilan offert · Âge COAI &amp; Score COAI</span>
              </div>
              <h1 className="max-w-xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl">
                {resumable ? "Reprenons où tu t'étais arrêté(e)." : "Quel âge a vraiment ton corps ?"}
              </h1>
              <p className="max-w-lg text-base leading-7 text-graphite-400">
                {resumable ? (
                  "Tes réponses précédentes sont toujours là — inutile de tout recommencer."
                ) : (
                  <>
                    En 5 minutes, découvre ton <strong className="text-graphite-100">Âge COAI</strong> — le
                    reflet de ton hygiène de vie réelle : sommeil, alimentation, activité, régularité.
                    Il peut être plus jeune que ton âge. Ou plus vieux.
                  </>
                )}
              </p>
              {!resumable && (
                <p className="max-w-lg rounded-xl border border-laiton-400/20 bg-laiton-400/[0.07] px-4 py-3 text-sm leading-6 text-laiton-100">
                  Ce ne sont pas les kilos qui décident de ta longévité, mais ce que tu fais chaque jour.
                  Le bilan mesure ces habitudes-là, puis te dit lesquelles changer en premier.
                </p>
              )}
              {!resumable && (
                <div className="grid w-full max-w-xl grid-cols-3 gap-2 text-left sm:gap-3">
                  {[{ value: "17 ans", label: "d'expérience terrain" }, { value: "5 min", label: "et tu as ton âge" }, { value: "0 €", label: "sans carte bancaire" }].map((proof) => (
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
                <Button onClick={startDiagnostic} className="mt-2 whitespace-nowrap px-5 py-3.5 text-[0.78rem] min-[390px]:px-8 min-[390px]:text-sm">
                  Découvrir mon Âge COAI
                </Button>
              )}
              <span className="text-xs text-graphite-600">
                Gratuit · résultat immédiat · estimation de forme, pas une mesure médicale
              </span>
            </div>
          )}

          {step === "quotidien" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="coai-consultation-phase">Ton quotidien</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">En dehors du sport, comment se passent tes journées ?</h2>
                <p className="mt-1.5 text-sm leading-6 text-graphite-400">Une personne assise huit heures n&apos;a pas les mêmes besoins qu&apos;une personne qui travaille debout ou exerce un métier physique.</p>
              </div>
              <div className="flex flex-col gap-2">
                {QUOTIDIENS.map((item) => <OptionCard key={item} label={item} active={activiteQuotidienne === item} onClick={() => setActiviteQuotidienne(item)} />)}
              </div>
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
                  <ChoixVisuel key={n.value} label={n.value} hint={n.hint} active={niveau === n.value} onClick={() => chooseSingle(setNiveau, n.value)} />
                ))}
              </div>
            </div>
          )}

          {step === "objectif" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Tes objectifs principaux ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Coche ce que tu veux améliorer. Aucune phrase à écrire.</p>
              </div>
              <div className="flex flex-col gap-2">
                {OBJECTIFS.map((o) => (
                  <ChoixVisuel
                    key={o}
                    label={o}
                    active={objectifsPrincipaux.includes(o)}
                    onClick={() => {
                      const next = objectifsPrincipaux.includes(o)
                        ? objectifsPrincipaux.filter((item) => item !== o)
                        : [...objectifsPrincipaux, o];
                      setObjectifsPrincipaux(next);
                      setObjectif(next.find((item) => item !== OBJECTIF_AUTRE_LABEL) ?? next[0] ?? null);
                    }}
                  />
                ))}
              </div>
              {objectifsPrincipaux.includes(OBJECTIF_AUTRE_LABEL) && (
                <input
                  type="text"
                  value={objectifAutreTexte}
                  onChange={(e) => setObjectifAutreTexte(e.target.value)}
                  placeholder="Précise seulement si tu le souhaites…"
                  className="w-full rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60"
                />
              )}
            </div>
          )}

          {step === "accompagnement" && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="coai-consultation-phase">Entretien · Ton accompagnement</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">Qu&apos;est-ce qui ferait vraiment la différence cette fois ?</h2>
                <p className="mt-1.5 text-sm leading-6 text-graphite-400">Tes réponses nous évitent de te proposer une solution générique.</p>
              </div>
              <label className="flex flex-col gap-2 text-left">
                <span className="text-sm font-semibold text-graphite-200">Qu’aimerais-tu optimiser en priorité ?</span>
                <div className="flex flex-col gap-2">
                  {PRIORITES_OPTIMISATION.map((item) => <OptionCard key={item} label={item} active={item === AUTRE_LABEL ? prioriteOptimisation.startsWith(`${AUTRE_LABEL} :`) : prioriteOptimisation === item} onClick={() => setPrioriteOptimisation(item === AUTRE_LABEL ? `${AUTRE_LABEL} : ` : prioriteOptimisation === item ? "" : item)} />)}
                </div>
                {prioriteOptimisation.startsWith(`${AUTRE_LABEL} :`) && (
                  <textarea value={prioriteOptimisation.slice(`${AUTRE_LABEL} : `.length)} onChange={(event) => setPrioriteOptimisation(`${AUTRE_LABEL} : ${event.target.value.slice(0, 300)}`)} rows={2} placeholder="Précise en quelques mots…" className="w-full resize-none rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60" />
                )}
              </label>
              <label className="flex flex-col gap-2 text-left">
                <span className="text-sm font-semibold text-graphite-200">Qu&apos;attends-tu concrètement de COAI ?</span>
                <span className="text-xs text-graphite-500">Plusieurs réponses possibles.</span>
                <div className="flex flex-col gap-2">
                  {ATTENTES_COAI.map((item) => <OptionCard key={item} label={item} active={attentesCoai.includes(item)} onClick={() => toggle(attentesCoai, item, setAttentesCoai)} />)}
                </div>
                {attentesCoai.includes(AUTRE_LABEL) && (
                  <textarea value={attentesCoaiAutreTexte} onChange={(event) => setAttentesCoaiAutreTexte(event.target.value.slice(0, 680))} rows={2} placeholder="Précise en quelques mots…" className="w-full resize-none rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60" />
                )}
              </label>
              <label className="flex flex-col gap-2 text-left">
                <span className="text-sm font-semibold text-graphite-200">Qu&apos;est-ce qui t&apos;a empêché d&apos;atteindre cet objectif jusqu&apos;ici ?</span>
                <span className="text-xs text-graphite-500">Plusieurs réponses possibles.</span>
                <div className="flex flex-col gap-2">
                  {FREINS.map((item) => <OptionCard key={item} label={item} active={freinsPrincipaux.includes(item)} onClick={() => toggle(freinsPrincipaux, item, setFreinsPrincipaux)} />)}
                </div>
                {freinsPrincipaux.includes(AUTRE_LABEL) && (
                  <textarea value={freinsAutreTexte} onChange={(event) => setFreinsAutreTexte(event.target.value.slice(0, 680))} rows={2} placeholder="Précise en quelques mots…" className="w-full resize-none rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60" />
                )}
              </label>
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

          {step === "declencheur" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="coai-consultation-phase">Entretien · Motivation</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">Qu&apos;est-ce qui rend ce moment important pour toi ?</h2>
                <p className="mt-1.5 text-sm text-graphite-400">Plusieurs réponses sont possibles. On s&apos;en sert pour te montrer une vraie trajectoire, pas juste des chiffres abstraits.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {EVENEMENTS_DECLENCHEURS.map((item) => (
                  <OptionCard
                    key={item}
                    label={item}
                    active={declencheur.includes(item)}
                    onClick={() => toggleDeclencheur(item)}
                  />
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
              <div className="grid gap-2 sm:grid-cols-2">
                {EQUIPEMENTS.map((e) => (
                  <ChoixVisuel key={e} label={e} active={equipement.includes(e)} onClick={() => toggle(equipement, e, setEquipement)} />
                ))}
              </div>
              {equipement.includes(AUTRE_LABEL) && (
                <input
                  type="text"
                  value={equipementAutreTexte}
                  onChange={(event) => setEquipementAutreTexte(event.target.value.slice(0, 200))}
                  placeholder="Ex. vélo, tapis de course, elliptique… (facultatif)"
                  className="w-full rounded-xl border border-graphite-700 bg-graphite-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-graphite-500 focus:border-laiton-400/60"
                />
              )}
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
                  <ChoixVisuel key={l} label={l} active={lieu === l} onClick={() => chooseSingle(setLieu, l)} />
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
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Tes repères physiques</h2>
                <p className="mt-1.5 text-sm text-graphite-400">
                  Sert à ajuster les repères caloriques, protéiques et la charge d&apos;entraînement — jamais un
                  jugement sur ton apparence.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {SEXES.map((s) => (
                  <OptionCard key={s} label={s} active={sexe === s} onClick={() => setSexe(s)} />
                ))}
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
              {/* Grille de zones (21/08/2026, demande Anthony) — remplace la
                  liste de chips par des boutons visuels ordonnés du haut
                  vers le bas du corps. "Aucune douleur" et "Autre" restent
                  hors grille : ce ne sont pas des zones, et "Aucune" est
                  exclusif (cf. toggleSante). */}
              <button
                type="button"
                onClick={() => toggleSante(AUCUNE_DOULEUR_LABEL)}
                aria-pressed={sante.includes(AUCUNE_DOULEUR_LABEL)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  sante.includes(AUCUNE_DOULEUR_LABEL)
                    ? "border-emerald-400/50 bg-emerald-400/[0.1]"
                    : "border-white/10 bg-white/[0.03] hover:border-emerald-400/30 hover:bg-white/[0.06]"
                }`}
              >
                <span aria-hidden="true" className="text-xl">✅</span>
                <span className={`text-sm font-semibold ${sante.includes(AUCUNE_DOULEUR_LABEL) ? "text-emerald-200" : "text-graphite-100"}`}>
                  {AUCUNE_DOULEUR_LABEL}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ZONES_CORPS.map((zone) => {
                  const actif = sante.includes(zone.label);
                  return (
                    <button
                      key={zone.label}
                      type="button"
                      onClick={() => toggleSante(zone.label)}
                      aria-pressed={actif}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition ${
                        actif
                          ? "border-laiton-400/60 bg-laiton-400/[0.12] shadow-[0_0_0_1px_rgba(201,162,98,0.2)]"
                          : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-laiton-400/30 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span aria-hidden="true" className={`font-display text-sm font-bold ${actif ? "text-laiton-200" : "text-graphite-500"}`}>{zone.label.charAt(0).toUpperCase()}</span>
                      <span className={`text-center text-[11px] font-semibold leading-tight ${actif ? "text-laiton-100" : "text-graphite-300"}`}>
                        {zone.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {CONTRAINTES.filter((c) => c !== AUCUNE_DOULEUR_LABEL && !ZONES_CORPS.some((z) => z.label === c)).map((c) => (
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

          {(step === "respire1" || step === "respire2") && (
            <div
              onClick={handleBreatherTap}
              className="flex min-h-[20rem] cursor-pointer flex-col items-center justify-center gap-5 py-10 text-center"
            >
              <div className="animate-reveal flex flex-col items-center gap-5">
                <p className="coai-diagnostic-kicker">
                  <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                  <span>{BREATHERS[step].kicker}</span>
                </p>
                <h2 className="max-w-md font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
                  {BREATHERS[step].titre}
                </h2>
                <p className="max-w-md text-sm leading-6 text-graphite-400">{BREATHERS[step].texte}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-600">Touche l&apos;écran pour continuer</p>
              </div>
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
                L&apos;algorithme COAI analyse ton profil
              </p>
              <p className="text-sm text-graphite-300">{ANALYSE_MESSAGES[analyseIndex]}</p>
              <div className="w-full max-w-xs">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-laiton-500 to-laiton-300 transition-[width] duration-100 ease-linear"
                    style={{ width: `${analyseProgress}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] tabular-nums text-graphite-500">{analyseProgress}%</p>
              </div>
            </div>
          )}

          {step === "reveal" && diagnostic && (
            <div
              onClick={handleRevealTap}
              className="flex min-h-[22rem] cursor-pointer flex-col items-center justify-center gap-6 py-10 text-center"
            >
              <div key={revealIndex} className="animate-reveal flex w-full flex-col items-center gap-6">
                {revealIndex === 0 && (
                  <>
                    <p className="coai-diagnostic-kicker">
                      <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                      <span>Analyse COAI terminée</span>
                    </p>
                    <div
                      className="coai-index-ring"
                      style={{ "--coai-score": `${diagnostic.indiceCoai.score * 3.6}deg` } as React.CSSProperties}
                    >
                      <div>
                        <strong>{diagnostic.indiceCoai.score}</strong>
                        <span>/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="coai-index-label">Indice COAI · Potentiel d&apos;évolution</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                        Potentiel {diagnostic.indiceCoai.niveau.toLowerCase()}
                      </h2>
                    </div>
                  </>
                )}

                {revealIndex === 1 && (
                  <>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-400">
                      Tes signaux, déjà mesurés
                    </p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                      <Gauge label="Entraînement" percent={signauxDiagnostic.entrainement} size={92} color="#ff8a3d" />
                      <Gauge label="Alimentation" percent={signauxDiagnostic.alimentation} size={92} color="#ffd84d" />
                      <Gauge label="Récupération" percent={signauxDiagnostic.recuperation} size={92} color="#39e67b" />
                      <Gauge label="Sommeil" percent={signauxDiagnostic.sommeil} size={92} color="#4cc9f0" />
                      <Gauge label="Score COAI" percent={diagnostic.indiceCoai.score} size={92} color="#c56cff" />
                    </div>
                  </>
                )}

                {diagnostic.pointsATravailler.length > 0 && revealIndex === 2 && (
                  <>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-400">
                      Ce qu&apos;on va travailler
                    </p>
                    <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
                      <ul className="flex flex-col gap-1.5 text-sm leading-6 text-graphite-300">
                        {diagnostic.pointsATravailler.slice(0, 4).map((p) => (
                          <li key={p} className="flex items-start gap-2">
                            <span className="mt-0.5 text-acier">✕</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                      <ul className="flex flex-col gap-1.5 text-sm leading-6 text-graphite-100">
                        {diagnostic.pointsResolus.slice(0, 4).map((p) => (
                          <li key={p} className="flex items-start gap-2">
                            <span className="mt-0.5 text-laiton-300">✓</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {revealIndex === revealScreenCount - 1 && (
                  <>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-400">
                      Tes 3 premiers pas
                    </p>
                    <div className="grid w-full gap-3 sm:grid-cols-3">
                      {diagnostic.indiceCoai.actions.map((action, index) => (
                        <div key={action.titre} className="coai-index-action-card">
                          <span>{index + 1}</span>
                          <p>{action.titre}</p>
                          <strong>{action.impact}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-600">
                Touche l&apos;écran pour continuer
              </p>
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
                <div className="coai-analysis-proof" aria-label="Analyse personnalisée terminée">
                  <span><i />16 dimensions explorées</span>
                  <span><i />4 capacités physiques évaluées</span>
                  <span><i />1 trajectoire personnelle</span>
                </div>
                {(() => {
                  // L'âge est l'accroche (partageable), le score la preuve.
                  // Rien n'est affiché sans âge déclaré : inventer une
                  // référence produirait un écart qui ne veut rien dire.
                  const a = ageCoaiDeclaratif(age ? Number(age) : null, diagnostic.indiceCoai.score);
                  if (!a) return null;
                  const plusJeune = a.sens === "plus_jeune";
                  return (
                    <div className="mt-2 w-full max-w-2xl rounded-2xl border border-laiton-300/25 bg-[linear-gradient(140deg,rgba(201,162,98,.12),rgba(76,201,240,.05),rgba(255,255,255,.02))] p-6 text-center">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-laiton-300">
                        Ton Âge COAI
                      </p>
                      <p className="mt-2 font-display text-6xl font-extrabold tabular-nums text-[#fffdf8] sm:text-7xl">
                        {a.ageCoai}<span className="ml-2 text-2xl text-graphite-400">ans</span>
                      </p>
                      <p className="mt-2 text-sm leading-6 text-graphite-200">
                        {a.sens === "egal"
                          ? `Ton hygiène de vie est au niveau de tes ${a.ageChronologique} ans.`
                          : plusJeune
                            ? `Soit ${a.ecartAnnees} an${a.ecartAnnees > 1 ? "s" : ""} de moins que tes ${a.ageChronologique} ans. Ce que tu fais au quotidien te protège.`
                            : `Soit ${a.ecartAnnees} an${a.ecartAnnees > 1 ? "s" : ""} de plus que tes ${a.ageChronologique} ans. C'est réversible — et c'est précisément ce que COAI travaille.`}
                      </p>
                      <p className="mt-3 text-[11px] leading-4 text-graphite-500">
                        {AGE_COAI_DECLARATIF_DISCLAIMER}
                      </p>
                    </div>
                  );
                })()}
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
                      Ce n&apos;est pas une note. C&apos;est ton point zéro personnel : celui auquel COAI comparera chacune de tes prochaines évolutions.
                    </p>
                  </div>
                </div>
                {(() => {
                  const a = ageCoaiDeclaratif(age ? Number(age) : null, diagnostic.indiceCoai.score);
                  return (
                    <DiagnosticShareButton
                      connecte={connecte}
                      objectif={diagnostic.profil.objectif}
                      score={diagnostic.indiceCoai.score}
                      ageCoai={a?.ageCoai}
                      ageReel={a?.ageChronologique}
                    />
                  );
                })()}
                <p className="max-w-xl text-base leading-7 text-graphite-300">{diagnostic.profilParagraphe}</p>
                {diagnostic.alerte && (
                  <p className="max-w-md rounded-lg border border-acier/40 bg-acier/10 px-3 py-2 text-xs leading-5 text-acier">
                    {diagnostic.alerte}
                  </p>
                )}
              </div>

              {projection && <ProjectionEmotionnelleCard projection={projection} />}

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
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
                    <SectionLabel>Tes points à améliorer → La solution COAI</SectionLabel>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                      Chaque point faible devient une action concrète pour atteindre tes objectifs.
                    </h3>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-graphite-800 bg-graphite-900/50 px-4 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                        Tes points à améliorer
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
                        La solution COAI pour progresser
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

              {/* Recommandation de formule remontée juste après le bloc problème/solution
                  (19/08/2026, audit conversion demandé par Anthony) : elle vivait jusqu'ici
                  tout en bas de l'écran, après ~6 sections éducatives supplémentaires — le
                  point de conversion le plus important de la page était le plus enterré. */}
              {connecte ? (
                <FormuleRecommandeeCard recommandation={diagnostic.recommandation} />
              ) : (
                <div className="w-full rounded-[1.6rem] border border-laiton-400/35 bg-laiton-400/[0.07] px-6 py-7 text-center">
                  <SectionLabel>Étape 3 · conserve ton résultat</SectionLabel>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                    Crée gratuitement ton espace COAI.
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-graphite-300">
                    Ton diagnostic et cet aperçu seront enregistrés. Tu choisiras ta formule
                    seulement à l&apos;étape suivante, sans paiement automatique.
                  </p>
                  <Link href={signUpHref()} onClick={handleCreerCompte} className="mt-5 inline-flex">
                    <Button className="px-8 py-4">Créer mon compte gratuit →</Button>
                  </Link>
                </div>
              )}

              <div className="flex w-full flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-6 text-left">
                <div>
                  <SectionLabel>Aperçu de ton programme</SectionLabel>
                  <p className="mt-2 text-sm leading-6 text-graphite-200">{diagnostic.pitchEvolution}</p>
                </div>
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                  <VoletCard label="Entraînement" photoUrl={pilierPhotos.entrainement} accentColor="#ff8a3d">
                    {diagnostic.split && <p>{diagnostic.split}</p>}
                    <ul className="mt-2 flex flex-col gap-1 text-graphite-400">
                      {diagnostic.exercices.map((ex) => (
                        <li key={ex}>• {ex}</li>
                      ))}
                    </ul>
                  </VoletCard>

                  {diagnostic.nutrition && (
                    <VoletCard label="Nutrition" photoUrl={pilierPhotos.nutrition} accentColor="#ffd84d">
                      {diagnostic.nutrition}
                    </VoletCard>
                  )}

                  {diagnostic.recuperation && (
                    <VoletCard label="Récupération" photoUrl={pilierPhotos.recuperation} accentColor="#39e67b">
                      {diagnostic.recuperation}
                    </VoletCard>
                  )}

                  {diagnostic.hydratation && (
                    <VoletCard label="Hydratation" photoUrl={pilierPhotos.hydratation} accentColor="#3ea8dc">
                      {diagnostic.hydratation}
                    </VoletCard>
                  )}
                </div>
                <p className="border-t border-white/[0.07] pt-4 text-sm leading-6 text-graphite-200">
                  <span className="font-semibold text-white">Jamais livré à toi-même :</span> avec
                  Coaching Hybride ou VIP, un <span className="text-laiton-300">coach diplômé d&apos;État</span>{" "}
                  valide ton programme et te suit dans la durée, pendant que ton{" "}
                  <span className="text-laiton-300">Coach IA répond 24h/24, 7j/7</span> entre deux
                  séances.
                </p>
              </div>

              {/* Fusionné avec l'ancien bloc "Pourquoi COAI n'est pas une IA
                  classique" (20/08/2026, simplification demandée par Anthony
                  — les deux blocs disaient la même chose : COAI croise
                  expertise terrain et données réelles, en continu). La boucle
                  en 5 étapes ci-dessous est gardée telle quelle : c'est le
                  contenu le plus concret des deux blocs d'origine. */}
              <div className="coai-value-loop w-full rounded-[1.75rem] p-6 text-left sm:p-8">
                <div className="max-w-2xl">
                  <SectionLabel>Pourquoi COAI n&apos;est pas une IA classique</SectionLabel>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
                    Un programme générique te donne un plan. COAI prend une décision avec toi, chaque jour.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-graphite-300">
                    Une IA généraliste répond à partir d&apos;un prompt. COAI applique des règles de coaching issues de plus de 17 ans d&apos;expérience réelle, croisées avec ton niveau, tes contraintes et tes progrès — jour après jour, pas une fois pour toutes.
                  </p>
                </div>
                <ol className="mt-6 grid gap-3 sm:grid-cols-5">
                  {[
                    ["01", "COAI t’observe", "Bilan, niveau, mobilité et contraintes"],
                    ["02", "Tu fais ton check-in", "Forme, sommeil, temps et douleurs"],
                    ["03", "La séance se recalcule", "Volume, intensité et exercices utiles"],
                    ["04", "Tu donnes ton retour", "Performances et sensations enregistrées"],
                    ["05", "Le plan évolue", "Progression ajustée, humain si nécessaire"],
                  ].map(([numero, titre, texte]) => (
                    <li key={numero}>
                      <span>{numero}</span>
                      <strong>{titre}</strong>
                      <p>{texte}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm font-semibold text-laiton-200">
                  Ton programme n&apos;est jamais terminé : il apprend de toi.
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
                        {applyErrorMessage ?? "Ton profil est enregistré, mais la génération de ton programme a rencontré un souci."}
                      </p>
                      {applyNeedsFormule ? (
                        <Link href="/pricing" className="text-sm text-laiton-300 underline">
                          Choisir ma formule →
                        </Link>
                      ) : (
                        <Link href="/programme/entrainement" className="text-sm text-laiton-300 underline">
                          Réessayer depuis ton programme →
                        </Link>
                      )}
                    </>
                  ) : applyStatus === "done" ? (
                    <>
                      <SectionLabel>C&apos;est fait</SectionLabel>
                      <p className="max-w-md text-sm leading-6 text-graphite-300">
                        Profil mis à jour ✓ COAI en sait un peu plus sur toi — ton prochain
                        programme en tiendra compte.
                      </p>
                      <Link
                        href="/dashboard"
                        onClick={() => window.localStorage.setItem("coai_dashboard_intro_pending", "1")}
                      >
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
                <div className="relative mt-4 flex w-full flex-col items-center gap-4 overflow-hidden rounded-[1.6rem] border-2 border-laiton-400/45 bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,98,.16),transparent_20rem),#111518] px-5 py-8 text-center shadow-[0_24px_70px_-24px_rgba(0,0,0,.9)] sm:px-8 sm:py-10">
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-laiton-300 via-laiton-500 to-acier-400" aria-hidden="true" />
                  <div className="coai-diagnostic-kicker">
                    <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                    <span>Étape suivante · ton espace personnel</span>
                  </div>
                  <h3 className="max-w-xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl">Garde ton résultat et poursuis gratuitement.</h3>
                  <p className="max-w-xl text-sm leading-6 text-graphite-300">
                    Crée ton compte sans carte bancaire. Tu choisiras ensuite ta formule, puis tu
                    pourras démarrer les 7 jours d&apos;essai si tu le souhaites.
                  </p>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-laiton-300">Clique ci-dessous pour continuer</span>
                  <Link href={signUpHref()} onClick={handleCreerCompte} className="w-full max-w-md">
                    <Button className="coai-rainbow-cta w-full border-0 px-6 py-4 text-base font-extrabold text-[#111216] shadow-[0_20px_55px_-16px_rgba(201,162,98,.9)] sm:text-lg">
                      Créer mon compte gratuit →
                    </Button>
                  </Link>
                  <span className="text-xs font-medium text-graphite-500">Gratuit · sans carte bancaire · moins d&apos;une minute</span>
                  <div className="-mx-5 w-[calc(100%+2.5rem)] sm:-mx-8 sm:w-[calc(100%+4rem)]">
                    <FondateurTicker />
                  </div>
                </div>
              )}

              {/* Anthony : une amie arrivée jusqu'en bas du résultat n'avait
                  aucun accès direct aux tarifs à cet endroit — le seul lien
                  "Comparer les 3 formules" vit dans FormuleRecommandeeCard,
                  plus haut sur l'écran. Ajouté ici aussi, à la vraie sortie. */}
              {connecte ? (
                <Link href="/pricing" className="text-sm font-semibold text-laiton-300 underline decoration-laiton-300/40 underline-offset-4 hover:text-laiton-200">
                  Voir les formules →
                </Link>
              ) : null}

              <p className="max-w-lg text-sm leading-6 text-graphite-300">
                Cette expérience t&apos;a plu ? Parles-en à quelqu&apos;un qui a besoin de s&apos;y
                mettre — une fois abonné(e), tu auras aussi ton propre lien de parrainage.
              </p>
            </div>
          )}
        </div>

        {step !== "intro" && step !== "result" && step !== "analyse" && step !== "reveal" && step !== "respire1" && step !== "respire2" && (
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
