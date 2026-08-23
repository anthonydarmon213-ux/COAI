/**
 * Génère la bibliothèque de programmes socles — À EXÉCUTER À LA MAIN,
 * jamais depuis l'application (24/08/2026).
 *
 *   npx tsx scripts/generer-socles.ts                  # tout
 *   npx tsx scripts/generer-socles.ts nutrition        # un seul pilier
 *   npx tsx scripts/generer-socles.ts --force          # regénère l'existant
 *
 * 54 fichiers, ~370 appels IA : 45 entraînements (~5 appels chacun),
 * 4 nutritions et 5 récupérations (~8 appels chacune).
 *
 * Les trois piliers sont générés séparément parce qu'ils ne dépendent pas
 * des mêmes axes (cf. cle.ts). Les générer ensemble pour chaque combinaison
 * revenait à produire quinze fois la même nutrition sous des étiquettes
 * différentes — 1 260 appels au lieu de 370.
 *
 * C'est un coût unique, en remplacement d'un coût répété à chaque abonné
 * Pass IA.
 *
 * Le résultat est écrit dans src/lib/programmes-socles/data/. Ces fichiers
 * sont versionnés et servis tels quels — Anthony les relit et les corrige
 * comme n'importe quel autre contenu. C'est justement l'intérêt : ce qui
 * est servi aux abonnés Pass IA devient relisable, ce qu'une génération à
 * la volée ne permet pas.
 *
 * Reprise possible : un socle déjà présent est ignoré, sauf avec --force.
 * Une interruption ne fait donc pas repayer les appels déjà effectués.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { genererPilier } from "../src/lib/programmes/generer";
import {
  toutesLesClesEntrainement,
  toutesLesClesNutrition,
  toutesLesClesRecuperation,
} from "../src/lib/programmes-socles/cle";

const DOSSIER = join(process.cwd(), "src/lib/programmes-socles/data");

const OBJECTIF_TEXTE: Record<string, string> = {
  PERTE: "Perdre du gras tout en préservant la masse musculaire",
  MUSCLE: "Prendre du muscle et gagner en volume",
  FORME: "Me sentir mieux au quotidien, reprendre une activité régulière",
  PERFORMANCE: "Progresser en force et en performance",
  // Socle commun aux débutants : à ce niveau l'objectif ne change pas la
  // séance (full body sur les mouvements de base), la différence se joue
  // dans l'assiette — arbitrage validé par Anthony, coach.
  BASE: "Construire des bases solides et une technique propre",
};

const NIVEAU_TEXTE: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

/** Profil commun à tous les socles : salle équipée, 60 min, aucune
 *  contrainte de santé. variantes.ts substitue les exercices à l'affichage
 *  selon le matériel réel, et un profil avec contrainte déclarée ne reçoit
 *  jamais de socle (cf. socleAcceptable). */
const PROFIL_BASE = {
  equipementDisponible: "Salle de sport complète",
  lieuEntrainement: "Salle de sport",
  dureeSeanceMinutes: 60,
  contraintesSante: null,
};

type Pilier = "ENTRAINEMENT" | "NUTRITION" | "RECUPERATION";
type Tache = {
  pilier: Pilier;
  sousDossier: string;
  cle: string;
  profil: Record<string, unknown>;
};

function taches(): Tache[] {
  const out: Tache[] = [];

  for (const cle of toutesLesClesEntrainement()) {
    const [objectif = "BASE", niveau = "DEBUTANT", frequence = "3"] = cle.split("_");
    out.push({
      pilier: "ENTRAINEMENT",
      sousDossier: "entrainement",
      cle,
      profil: {
        ...PROFIL_BASE,
        objectifs: OBJECTIF_TEXTE[objectif],
        niveau: NIVEAU_TEXTE[niveau],
        frequenceEntrainement: `${frequence} fois par semaine`,
      },
    });
  }

  for (const cle of toutesLesClesNutrition()) {
    out.push({
      pilier: "NUTRITION",
      sousDossier: "nutrition",
      cle,
      profil: {
        ...PROFIL_BASE,
        objectifs: OBJECTIF_TEXTE[cle],
        // Niveau et fréquence n'entrent pas dans la clé nutrition, mais le
        // prompt les attend : valeurs médianes, les cibles chiffrées étant
        // de toute façon recalculées sur le profil réel à l'affichage.
        niveau: "Intermédiaire",
        frequenceEntrainement: "3 fois par semaine",
      },
    });
  }

  for (const cle of toutesLesClesRecuperation()) {
    const frequence = cle.replace("FREQ_", "");
    out.push({
      pilier: "RECUPERATION",
      sousDossier: "recuperation",
      cle,
      profil: {
        ...PROFIL_BASE,
        objectifs: OBJECTIF_TEXTE.FORME,
        niveau: "Intermédiaire",
        frequenceEntrainement: `${frequence} fois par semaine`,
      },
    });
  }

  return out;
}

async function main() {
  const filtre = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const force = process.argv.includes("--force");

  const aFaire = taches().filter((t) => !filtre || t.sousDossier === filtre);
  console.log(`${aFaire.length} socle(s) à traiter\n`);

  let faits = 0;
  let ignores = 0;
  const echecs: string[] = [];

  for (const t of aFaire) {
    const dossier = join(DOSSIER, t.sousDossier);
    mkdirSync(dossier, { recursive: true });
    const chemin = join(dossier, `${t.cle}.json`);

    if (existsSync(chemin) && !force) {
      ignores++;
      continue;
    }

    process.stdout.write(`${t.sousDossier}/${t.cle} … `);
    try {
      // Séquentiel volontairement : lancer les 54 en parallèle dépasserait
      // les limites de débit du fournisseur et ferait échouer des appels
      // déjà facturés.
      const contenu = await genererPilier(t.pilier, t.profil, "socle");
      writeFileSync(
        chemin,
        JSON.stringify({ cle: t.cle, genereLe: new Date().toISOString(), contenu }, null, 2)
      );
      faits++;
      console.log("✓");
    } catch (err) {
      echecs.push(`${t.sousDossier}/${t.cle}`);
      console.log(`✗ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n${faits} généré(s), ${ignores} déjà présent(s), ${echecs.length} échec(s)`);
  if (echecs.length) console.log("À relancer :", echecs.join(" "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
