/**
 * Génère la bibliothèque de programmes socles — À EXÉCUTER À LA MAIN,
 * jamais depuis l'application (24/08/2026).
 *
 *   npx tsx scripts/generer-socles.ts            # les 60 combinaisons
 *   npx tsx scripts/generer-socles.ts MUSCLE     # un seul objectif
 *
 * Chaque programme coûte ~21 appels IA. Les 60 combinaisons représentent
 * donc ~1 260 appels : c'est un coût unique, assumé, à la place d'un coût
 * répété à chaque abonné Pass IA.
 *
 * Le résultat est écrit dans src/lib/programmes-socles/data/. Ces fichiers
 * sont versionnés et servis tels quels — Anthony les relit et les corrige
 * comme n'importe quel autre contenu de l'application. C'est justement
 * l'intérêt : le contenu servi aux abonnés Pass IA devient relisable, ce
 * qu'une génération à la volée ne permet pas.
 *
 * Reprise possible : un socle déjà présent sur le disque est ignoré, sauf
 * avec --force. Une interruption ne fait donc pas repayer les appels déjà
 * effectués.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { genererPilier } from "../src/lib/programmes/generer";
import { toutesLesCles, type CleSocle } from "../src/lib/programmes-socles/cle";

const DOSSIER = join(process.cwd(), "src/lib/programmes-socles/data");

const OBJECTIF_TEXTE: Record<string, string> = {
  PERTE: "Perdre du gras tout en préservant la masse musculaire",
  MUSCLE: "Prendre du muscle et gagner en volume",
  FORME: "Me sentir mieux au quotidien, reprendre une activité régulière",
  PERFORMANCE: "Progresser en force et en performance",
};

const NIVEAU_TEXTE: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

function profilPourCle(cle: CleSocle) {
  // Le split d'un template literal type reste `string[]` pour TypeScript :
  // il ne sait pas que la clé a exactement trois segments. Valeurs par
  // défaut plutôt qu'un cast — si la clé était malformée, mieux vaut un
  // profil cohérent qu'un `undefined` propagé jusqu'au prompt.
  const [objectif = "FORME", niveau = "DEBUTANT", frequence = "3"] = cle.split("_");
  return {
    objectifs: OBJECTIF_TEXTE[objectif],
    niveau: NIVEAU_TEXTE[niveau],
    frequenceEntrainement: `${frequence} fois par semaine`,
    // Salle complète : variantes.ts substitue à l'affichage selon le
    // matériel réel de la personne. Générer une version par lieu aurait
    // triplé la bibliothèque pour rien.
    equipementDisponible: "Salle de sport complète",
    lieuEntrainement: "Salle de sport",
    dureeSeanceMinutes: 60,
    // Aucune contrainte de santé : le socle est le cas général. Une
    // personne avec des douleurs déclarées passe par la génération sur
    // mesure, jamais par un socle qui ne les connaît pas.
    contraintesSante: null,
  };
}

async function main() {
  const filtre = process.argv.find((a) => !a.startsWith("--") && /^[A-Z_]+$/.test(a));
  const force = process.argv.includes("--force");
  mkdirSync(DOSSIER, { recursive: true });

  const cles = toutesLesCles().filter((c) => !filtre || c.startsWith(filtre));
  console.log(`${cles.length} socle(s) à traiter\n`);

  let faits = 0;
  let ignores = 0;
  const echecs: string[] = [];

  for (const cle of cles) {
    const chemin = join(DOSSIER, `${cle}.json`);
    if (existsSync(chemin) && !force) {
      ignores++;
      continue;
    }

    const profil = profilPourCle(cle);
    process.stdout.write(`${cle} … `);
    try {
      // Séquentiel volontairement : 60 générations en parallèle
      // dépasseraient les limites de débit du fournisseur et feraient
      // échouer des appels déjà facturés.
      const [entrainement, nutrition, recuperation] = await Promise.all([
        genererPilier("ENTRAINEMENT", profil, "socle"),
        genererPilier("NUTRITION", profil, "socle"),
        genererPilier("RECUPERATION", profil, "socle"),
      ]);
      writeFileSync(
        chemin,
        JSON.stringify({ cle, genereLe: new Date().toISOString(), entrainement, nutrition, recuperation }, null, 2)
      );
      faits++;
      console.log("✓");
    } catch (err) {
      echecs.push(cle);
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
