import type { StorySeance } from "./story-seance";
import { photoCoaiGenreStrict, type GenreVisuel } from "@/lib/exercices/photos-coai";

const normalise = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
// Exact movement aliases. These pairs are the sources of Anthony's supplied PDF.
const references = [
  { noms: ["Presse à cuisses", "Presse à cuisses machine"], homme: "/fiche-seance/presse-a-cuisses-machine-homme.png", femme: "/exercices/presse-a-cuisses-machine.jpg" },
  { noms: ["Développé couché haltères"], homme: "/exercices/developpe-couche-halteres.jpg", femme: "/fiche-seance/developpe-couche-halteres-femme.png" },
  { noms: ["Tirage horizontal machine"], homme: "/fiche-seance/tirage-horizontal-machine-homme.png", femme: "/exercices/tirage-horizontal-machine.jpg" },
  { noms: ["Superman", "Superman au sol"], homme: "/exercices/superman-au-sol.jpg", femme: "/fiche-seance/superman-au-sol-femme.png" },
  { noms: ["Gainage planche", "Planche", "Gainage ventral"], homme: "/fiche-seance/gainage-planche-homme.png", femme: "/exercices/gainage-planche.jpg" },
  { noms: ["Crunch", "Crunch au sol"], homme: "/fiche-seance/crunch-au-sol-homme.png", femme: "/exercices/crunch-au-sol.jpg" },
];

export function illustrerStory(story: StorySeance, genre: GenreVisuel): StorySeance {
  return { ...story, exercices: story.exercices.map(ex => ({ ...ex,
    photo: references.find(ref => ref.noms.some(n => normalise(n) === normalise(ex.nom)))?.[genre] ?? photoCoaiGenreStrict(ex.nom, genre),
  })),
    // Illustrate only the action actually present in the instructions.
    echauffementPhoto: /mobilit[eé].*(hanche)|ouverture.*hanche/i.test(story.echauffement)
      ? genre === "homme" ? "/fiche-seance/mobilite-etirement-psoas-fente-homme.png" : "/exercices/mobilite-etirement-psoas-fente.jpg" : null,
    retourAuCalmePhoto: /respiration/i.test(story.retourAuCalme)
      ? genre === "homme" ? "/programmes/recuperation/respiration-diaphragmatique-homme-v1.png" : "/programmes/recuperation/respiration-diaphragmatique-femme-v1.png" : null,
  };
}
