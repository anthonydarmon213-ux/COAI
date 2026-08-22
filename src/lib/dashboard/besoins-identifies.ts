import type { Profile, Subscription } from "@prisma/client";
import { hasProgrammeAccess, hasSuiviAccess } from "@/lib/subscription/plan";

// Moteur déterministe (14/08/2026) : traduit les signaux réellement captés
// au diagnostic (persona, objectifs, contraintes santé, niveau, fréquence —
// tous déjà stockés sur Profile) en besoins compréhensibles, chacun associé
// au service COAI qui y répond concrètement. Aucun besoin inventé : chaque
// règle est ancrée sur un champ réel du profil, jamais une supposition.
export type ServiceRecommande = "IMPULSION" | "TRANSFORMATION" | "VIP";

export type BesoinIdentifie = {
  besoin: string;
  explication: string;
  service: ServiceRecommande;
};

export const SERVICE_INFO: Record<ServiceRecommande, { label: string; href: string }> = {
  IMPULSION: { label: "Pass IA — 49€/an (soit 4,08€/mois)", href: "/pricing#impulsion" },
  TRANSFORMATION: { label: "Coaching Hybride — 89€/mois", href: "/pricing#transformation" },
  VIP: { label: "VIP — dès 199€/mois", href: "/pricing#vip" },
};

function contient(valeur: string | null | undefined, motif: string): boolean {
  return Boolean(valeur && valeur.toLowerCase().includes(motif.toLowerCase()));
}

type ProfilSignaux = Pick<
  Profile,
  "persona" | "objectifs" | "contraintesSante" | "niveau" | "frequenceEntrainement" | "coachPreference"
>;

export function detecterBesoins(profile: ProfilSignaux | null | undefined): BesoinIdentifie[] {
  if (!profile) return [];
  const besoins: BesoinIdentifie[] = [];

  if (contient(profile.persona, "Je ne sais pas quoi faire") || contient(profile.persona, "sans structure")) {
    besoins.push({
      besoin: "Tu n'as pas de plan structuré",
      explication: "Un programme complet généré tout de suite, adapté à ton profil.",
      service: "IMPULSION",
    });
  }

  if (contient(profile.persona, "Même programme depuis des années")) {
    besoins.push({
      besoin: "Ton programme actuel ne bouge plus",
      explication: "Un suivi qui adapte réellement ton programme dans le temps, pas un plan figé.",
      service: "TRANSFORMATION",
    });
  }

  if (contient(profile.persona, "sans me blesser") || Boolean(profile.contraintesSante?.trim())) {
    besoins.push({
      besoin: profile.contraintesSante?.trim()
        ? `Tu as signalé une gêne physique (${profile.contraintesSante})`
        : "Tu veux progresser sans te blesser",
      explication: "Un coach diplômé d'État relit et valide ton programme avant qu'il soit définitif.",
      service: "TRANSFORMATION",
    });
  }

  if (
    profile.niveau === "Avancé" &&
    (contient(profile.objectifs, "force") || contient(profile.objectifs, "performances"))
  ) {
    besoins.push({
      besoin: "Tu cherches à optimiser en profondeur, pas à découvrir",
      explication: "Un accompagnement 1-to-1 pour aller chercher les derniers pourcents.",
      service: "VIP",
    });
  }

  if (profile.frequenceEntrainement === "6 fois ou plus par semaine") {
    besoins.push({
      besoin: "Un rythme d'entraînement élevé",
      explication: "À ce volume, un suivi humain de la charge et de la récupération fait une vraie différence.",
      service: "TRANSFORMATION",
    });
  }

  if (contient(profile.objectifs, "Me sentir mieux au quotidien") || contient(profile.objectifs, "Reprendre le sport")) {
    besoins.push({
      besoin: "Une reprise en douceur, sans pression de performance",
      explication: "Un programme simple généré immédiatement suffit pour démarrer.",
      service: "IMPULSION",
    });
  }

  // Choix du style d'accompagnement au diagnostic (16/08/2026, modèle
  // Future demandé par Anthony) — n'assigne aucun coach réel, oriente juste
  // le service mis en avant dans la vitrine du dashboard.
  if (profile.coachPreference === "VIP_PRESENTIEL") {
    besoins.push({
      besoin: "Tu recherches un coaching privé en présentiel",
      explication: "L'offre VIP te permet d'être accompagné directement par Anthony avec un suivi très personnalisé.",
      service: "VIP",
    });
  } else if (profile.coachPreference === "HYBRIDE") {
    besoins.push({
      besoin: "Tu veux combiner IA et expertise humaine",
      explication: "Coaching Hybride associe un programme évolutif à la validation et aux ajustements d'un coach diplômé.",
      service: "TRANSFORMATION",
    });
  } else if (profile.coachPreference === "FULL_IA") {
    besoins.push({
      besoin: "Tu as choisi un accompagnement 100% IA",
      explication: "Un programme complet généré immédiatement par les algorithmes COAI, sans attendre de validation humaine.",
      service: "IMPULSION",
    });
  }

  return besoins;
}

// Retire les besoins pointant vers un service déjà actif — inutile de
// pousser Pass IA si le programme est déjà débloqué, ou Coaching Hybride si
// le suivi humain est déjà en place. VIP n'a pas d'état persistant (séances
// à l'unité) : toujours affiché s'il est détecté.
export function filtrerBesoinsPertinents(
  besoins: BesoinIdentifie[],
  user: { programmeUnlockedAt: Date | null },
  subscription?: Subscription | null
): BesoinIdentifie[] {
  const dejaImpulsion = hasProgrammeAccess(user, subscription);
  const dejaTransformation = hasSuiviAccess(subscription);
  return besoins.filter((b) => {
    if (b.service === "IMPULSION" && dejaImpulsion) return false;
    if (b.service === "TRANSFORMATION" && dejaTransformation) return false;
    return true;
  });
}
