import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "public/programmes/couvertures");

const programmes = [
  { slug: "bureau-reset", title: ["BUREAU", "RESET"], pitch: ["Bouge sans quitter ta chaise.", "Relâche les tensions. Repars concentré."], meta: "MOBILITÉ  ·  POSTURE  ·  CONCENTRATION", category: "PROGRAMME MOBILITÉ" },
  { slug: "mobilite-totale", title: ["MOBILITÉ", "TOTALE"], pitch: ["Débloque tes articulations. Gagne en amplitude.", "Bouge sans y penser."], meta: "AMPLITUDE  ·  CONTRÔLE  ·  CORPS COMPLET", category: "PROGRAMME MOBILITÉ" },
  { slug: "semi-marathon-8-semaines", title: ["SEMI-MARATHON", "8 SEMAINES"], pitch: ["Construis ton endurance. Tiens la distance.", "Arrive prêt·e au départ."], meta: "ENDURANCE  ·  ALLURE  ·  PROGRESSION", category: "PROGRAMME RUNNING" },
  { slug: "hyrox-6-semaines", title: ["HYROX", "6 SEMAINES"], pitch: ["Cours. Enchaîne les ateliers.", "Encaisse le format le plus exigeant."], meta: "COURSE  ·  FORCE  ·  CONDITIONING", category: "PROGRAMME PERFORMANCE" },
  { slug: "perte-de-gras", title: ["PERTE", "DE GRAS"], pitch: ["Perds le gras. Garde le muscle.", "Reste aussi fort qu'avant."], meta: "FORCE  ·  CONDITIONING  ·  PROGRESSION", category: "PROGRAMME COMPOSITION CORPORELLE" },
  { slug: "poids-du-corps", title: ["100% POIDS", "DU CORPS"], pitch: ["Aucun matériel. Aucune excuse.", "Chez toi, en voyage, partout."], meta: "4 SEMAINES  ·  PARTOUT  ·  SANS MATÉRIEL", category: "PROGRAMME ENTRAÎNEMENT" },
  { slug: "fessiers-4-semaines", title: ["FESSIERS", "4 SEMAINES"], pitch: ["Renforce. Galbe. Progresse vite,", "sans te blesser."], meta: "FORCE  ·  GALBE  ·  PROGRESSION", category: "PROGRAMME ENTRAÎNEMENT" },
  { slug: "challenge-30-jours", title: ["CHALLENGE", "30 JOURS"], pitch: ["30 jours. 30 actions.", "Une habitude qui tient."], meta: "RÉGULARITÉ  ·  ÉNERGIE  ·  DISCIPLINE", category: "CHALLENGE COAI" },
  { slug: "sommeil-reparateur", title: ["SOMMEIL", "RÉPARATEUR"], pitch: ["Endors-toi plus vite. Dors plus profond.", "Réveille-toi réparé."], meta: "14 JOURS  ·  ROUTINE  ·  RÉCUPÉRATION", category: "PROGRAMME RÉCUPÉRATION" },
  { slug: "respiration-anti-stress", title: ["RESPIRATION", "ANTI-STRESS"], pitch: ["Inspire. Ralentis. Calme ton système nerveux", "en quelques minutes."], meta: "RESPIRATION  ·  CALME  ·  RÉGULATION", category: "PROGRAMME RÉCUPÉRATION" },
  { slug: "meditation-guidee", title: ["MÉDITATION", "GUIDÉE"], pitch: ["Assieds-toi. Respire.", "Découvre la méditation sans pression."], meta: "7 JOURS  ·  PRÉSENCE  ·  RESPIRATION", category: "PROGRAMME RÉCUPÉRATION" },
  { slug: "recuperation-passive", title: ["RÉCUPÉRATION", "PASSIVE"], pitch: ["Sauna, hammam, massage.", "Le bon protocole, les bonnes précautions."], meta: "CHALEUR  ·  MASSAGE  ·  PRÉCAUTIONS", category: "PROGRAMME RÉCUPÉRATION" },
];

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&apos;");

function cover(programme, gender) {
  const [line1, line2] = programme.title.map(esc);
  const [pitch1, pitch2] = programme.pitch.map(esc);
  const titleSize = Math.max(line1.length, line2.length) > 15 ? 70 : 88;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" role="img" aria-label="${line1} ${line2}">
  <defs>
    <linearGradient id="veil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050505" stop-opacity=".97"/><stop offset=".5" stop-color="#050505" stop-opacity=".46"/><stop offset=".76" stop-color="#050505" stop-opacity=".04"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e6c4"/><stop offset=".45" stop-color="#c9a262"/><stop offset="1" stop-color="#8a6a3a"/></linearGradient>
    <radialGradient id="eye" cx="35%" cy="32%" r="75%"><stop offset="0" stop-color="#6fb2d9"/><stop offset=".55" stop-color="#3d7a99"/><stop offset="1" stop-color="#1f4a5e"/></radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="9" flood-color="#000" flood-opacity=".7"/></filter>
  </defs>
  <image href="${programme.slug}-${gender}-base.png" width="1672" height="941" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1672" height="941" fill="url(#veil)"/>
  <g transform="translate(100 132)" filter="url(#shadow)">
    <text x="0" y="0" fill="#c9a262" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="700" letter-spacing="6">${esc(programme.category)}</text>
    <text x="0" y="104" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="${titleSize}" font-weight="800" letter-spacing="-2">${line1}</text>
    <text x="0" y="196" fill="url(#gold)" font-family="Arial,Helvetica,sans-serif" font-size="${titleSize}" font-weight="800" letter-spacing="1">${line2}</text>
    <rect x="0" y="236" width="104" height="4" rx="2" fill="#c9a262"/>
    <text x="0" y="304" fill="#f6f2eb" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="600">${pitch1}</text>
    <text x="0" y="346" fill="#f6f2eb" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="600">${pitch2}</text>
    <text x="0" y="424" fill="#d0cbc3" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="600" letter-spacing="2">${esc(programme.meta)}</text>
  </g>
  <g transform="translate(1450 735)">
    <circle cx="75" cy="75" r="69" fill="#080808" fill-opacity=".72" stroke="#c9a262" stroke-opacity=".52" stroke-width="2"/>
    <circle cx="75" cy="75" r="47" stroke="url(#gold)" stroke-width="13" stroke-linecap="round" stroke-dasharray="255 40" transform="rotate(-90 75 75)"/>
    <circle cx="75" cy="75" r="12" fill="url(#eye)"/><circle cx="75" cy="75" r="5.5" fill="#0d1b22"/><circle cx="72" cy="72" r="2" fill="#eaf4f8"/>
  </g>
</svg>`;
}

await mkdir(outDir, { recursive: true });
for (const programme of programmes) {
  for (const gender of ["femme", "homme"]) {
    await writeFile(join(outDir, `${programme.slug}-${gender}.svg`), cover(programme, gender));
  }
}
console.log(`Couvertures générées : ${programmes.length * 2}`);
