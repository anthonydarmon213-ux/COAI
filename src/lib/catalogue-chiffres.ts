// Chiffres du catalogue affichés dans les arguments de vente.
//
// Ils étaient écrits en dur à deux endroits et ont dérivé en une journée :
// la page annonçait encore 13 programmes et 58 exercices filmés alors que le
// catalogue en comptait 23 et 67. Annoncer moins que la réalité coûte des
// ventes ; annoncer plus serait mensonger. Un seul endroit à corriger.
//
// Ils ne sont pas calculés à l'exécution à dessein : importer les 189
// recettes dans un composant client alourdirait le bundle de tous les
// visiteurs pour afficher trois nombres.
//
// Pour les rafraîchir, exécuter à la racine du dépôt :
//   npx tsx -e 'import("./src/lib/programmes-prets/catalogue").then(async(p)=>{
//     const r=await import("./src/lib/nutrition/recettes");
//     const e=await import("./src/lib/exercices/catalogue");
//     const v=await import("./src/lib/exercices/videos-coai");
//     console.log(p.PROGRAMMES_PRETS.length, r.RECETTES.length,
//       e.EXERCICES.filter((x)=>v.videoCoaiPourNom(x.nom)).length);})'
//
// Dernière vérification : 2 septembre 2026.
export const NB_RECETTES = 189;
export const NB_PROGRAMMES_PRETS = 23;
export const NB_EXERCICES_FILMES = 67;
