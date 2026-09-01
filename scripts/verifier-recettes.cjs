const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const racine = path.resolve(__dirname, "..");
const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), "coai-recettes-"));
const erreurs = [];

function exiger(condition, message) {
  if (!condition) erreurs.push(message);
}

try {
  const tsc = path.join(racine, "node_modules", ".bin", "tsc");
  const compilation = spawnSync(
    tsc,
    [
      "src/lib/nutrition/recettes.ts",
      "src/lib/nutrition/recettes-extension.ts",
      "src/lib/nutrition/photos-repas.ts",
      "--module", "commonjs",
      "--target", "es2020",
      "--esModuleInterop",
      "--skipLibCheck",
      "--outDir", dossierTemporaire,
      "--declaration", "false",
      "--noEmit", "false",
    ],
    { cwd: racine, encoding: "utf8" }
  );
  if (compilation.status !== 0) {
    throw new Error(`Compilation impossible.\n${compilation.stdout}${compilation.stderr}`);
  }

  const { RECETTES } = require(path.join(dossierTemporaire, "recettes.js"));
  const { photoRepasPourNom } = require(path.join(dossierTemporaire, "photos-repas.js"));
  const slugs = new Set();
  const noms = new Set();
  const photos = new Set();
  const empreintes = new Set();
  const variantesAttendues = ["LEAN", "RESET_TRX", "HYBRID", "MASS"];

  // Le catalogue COAI comprend 65 recettes cœur, 48 recettes extension et
  // 50 recettes V6 illustrées : ce total est volontairement contrôlé pour
  // éviter qu'un lot soit oublié lors d'une prochaine livraison.
  const nombreRecettesAttendu = 163;
  exiger(RECETTES.length === nombreRecettesAttendu, `${nombreRecettesAttendu} recettes attendues, ${RECETTES.length} trouvées.`);

  for (const recette of RECETTES) {
    const identifiant = recette.slug || recette.nom || "recette sans identifiant";
    exiger(Boolean(recette.slug), `${identifiant}: slug manquant.`);
    exiger(Boolean(recette.nom), `${identifiant}: nom manquant.`);
    exiger(Boolean(recette.description), `${identifiant}: description manquante.`);
    exiger(Boolean(recette.photoQuery), `${identifiant}: requête photo manquante.`);
    exiger(Boolean(recette.photoLocale), `${identifiant}: photo locale manquante.`);
    exiger(!slugs.has(recette.slug), `${identifiant}: slug dupliqué.`);
    exiger(!noms.has(recette.nom), `${identifiant}: nom dupliqué.`);
    exiger(!photos.has(recette.photoLocale), `${identifiant}: chemin photo dupliqué.`);
    slugs.add(recette.slug);
    noms.add(recette.nom);
    photos.add(recette.photoLocale);

    exiger(Array.isArray(recette.objectifs) && recette.objectifs.length > 0, `${identifiant}: objectif manquant.`);
    exiger(Array.isArray(recette.regimes), `${identifiant}: régimes invalides.`);
    exiger(Number.isFinite(recette.tempsMinutes) && recette.tempsMinutes > 0, `${identifiant}: durée invalide.`);
    exiger(Array.isArray(recette.ingredients) && recette.ingredients.length >= 3, `${identifiant}: moins de 3 ingrédients.`);
    exiger(Array.isArray(recette.etapes) && recette.etapes.length >= 2, `${identifiant}: moins de 2 étapes.`);
    exiger(Boolean(recette.portion), `${identifiant}: portion manquante.`);
    exiger(Array.isArray(recette.allergenes), `${identifiant}: allergènes non renseignés.`);
    exiger(Boolean(recette.conservation), `${identifiant}: conservation manquante.`);
    for (const variante of variantesAttendues) {
      exiger(Boolean(recette.variantes?.[variante]), `${identifiant}: variante ${variante} manquante.`);
    }

    const { calories, proteines, glucides, lipides } = recette.macros || {};
    exiger([calories, proteines, glucides, lipides].every((valeur) => Number.isFinite(valeur) && valeur > 0), `${identifiant}: macros invalides.`);
    const caloriesCalculees = proteines * 4 + glucides * 4 + lipides * 9;
    exiger(Math.abs(calories - caloriesCalculees) / calories <= 0.2, `${identifiant}: calories incohérentes avec les macros.`);

    if (recette.photoLocale) {
      const cheminPhoto = path.join(racine, "public", recette.photoLocale.replace(/^\//, ""));
      exiger(fs.existsSync(cheminPhoto), `${identifiant}: fichier photo absent (${recette.photoLocale}).`);
      if (fs.existsSync(cheminPhoto)) {
        const empreinte = crypto.createHash("sha256").update(fs.readFileSync(cheminPhoto)).digest("hex");
        exiger(!empreintes.has(empreinte), `${identifiant}: contenu photo dupliqué.`);
        empreintes.add(empreinte);
      }
      exiger(photoRepasPourNom(recette.nom) === recette.photoLocale, `${identifiant}: rattachement automatique incorrect.`);
    }
  }

  if (erreurs.length > 0) {
    console.error(`ÉCHEC — ${erreurs.length} anomalie(s) :`);
    for (const erreur of erreurs) console.error(`- ${erreur}`);
    process.exitCode = 1;
  } else {
    console.log(`OK — ${RECETTES.length} recettes complètes, ${photos.size} visuels uniques et ${empreintes.size} rattachements contrôlés.`);
  }
} finally {
  fs.rmSync(dossierTemporaire, { recursive: true, force: true });
}
