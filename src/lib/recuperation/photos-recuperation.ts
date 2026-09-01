// Photos de récupération COAI (24/08/2026) — même cascade que les exercices
// et les repas : une photo choisie pour CE thème passe avant une recherche
// Pexels, qui renvoyait des images de spa sans rapport avec le contenu.
//
// La récupération est générée en texte libre par l'IA ("Rouleau de mousse
// sur les quadriceps, 2 min par jambe"), donc le rapprochement se fait sur
// le geste ou le matériel évoqué, pas sur un nom d'exercice normalisé.
//
// Les fichiers vivent dans /public/recuperation. Un fichier absent n'est pas
// une erreur : l'appelant retombe sur Pexels, comme avant.

type EntreeRecup = {
  motifs: string[];
  fichier: string;
  fichierFemme?: string;
  fichierHomme?: string;
};

// L'ordre compte : "rouleau" seul est trop générique, les zones précises
// passent donc avant. "Sommeil" avant "repos", plus spécifique.
const TABLE: EntreeRecup[] = [
  // Protocoles premium — visuels COAI dédiés, générés une seule fois puis
  // réutilisés sans coût pour tous les membres.
  {
    motifs: ["hammam"],
    fichier: "hammam-femme-blonde-premium",
    fichierFemme: "hammam-femme-blonde-premium",
    fichierHomme: "hammam-homme-blonde-premium",
  },
  {
    motifs: ["sauna"],
    fichier: "sauna-premium",
    fichierFemme: "sauna-femme-blonde-premium",
    fichierHomme: "sauna-homme-blond-premium",
  },
  {
    motifs: ["bain froid", "immersion froide", "eau froide", "cold plunge"],
    fichier: "bain-froid-premium",
    fichierFemme: "bain-froid-femme-blonde-premium",
    fichierHomme: "bain-froid-homme-blond-premium",
  },

  // Deuxième série récupération/mobilité — modèles et cadrages différents
  // pour qu'une rotation de 14 jours ne ressemble pas à sept cartes dupliquées.
  { motifs: ["90/90", "mobilité de hanche", "mobilite de hanche"], fichier: "recup2-10-mobilite-hanche-90-90" },
  { motifs: ["world's greatest", "worlds greatest", "étirement global", "etirement global"], fichier: "recup2-14-worlds-greatest-stretch" },
  { motifs: ["mobilité de cheville", "mobilite de cheville"], fichier: "recup2-09-mobilite-cheville" },
  { motifs: ["rotation thoracique"], fichier: "recup2-11-mobilite-thoracique-rotation" },
  { motifs: ["psoas", "fléchisseur de hanche", "flechisseur de hanche"], fichier: "recup2-12-etirement-psoas-hip-flexor" },
  { motifs: ["chat-vache", "chat vache", "cat-cow", "cat cow"], fichier: "recup2-13-cat-cow-chat-vache" },

  // Nouvelle série COAI — visuels distincts, sans animation de mannequin.
  { motifs: ["dorsiflexion contre mur", "cheville contre mur"], fichier: "recup-v5-homme-metis-mobilite-cheville.png" },
  { motifs: ["adducteur", "adducteurs", "étirement latéral", "etirement lateral"], fichier: "recup-v5-homme-metis-etirement-adducteurs.png" },
  { motifs: ["couch stretch", "quadriceps sur banc", "étirement quadriceps"], fichier: "recup-v5-femme-blonde-couch-stretch.png" },
  { motifs: ["jambes sur chaise", "jambes elevées chaise", "jambes elevees chaise"], fichier: "recup-v5-femme-blonde-jambes-chaise.png" },

  // Récupération active
  // Le précédent visuel quadriceps a été rejeté par Anthony le 27/08 : pas
  // de remplacement approximatif. Tant qu'un nouveau geste exact n'est pas
  // validé, ce thème retombe volontairement sur la recherche de secours.
  { motifs: ["ischio"], fichier: "rouleau-ischios" },
  { motifs: ["haut du dos", "dorsaux", "thoracique au rouleau"], fichier: "recup2-03-foam-roller-haut-du-dos" },
  { motifs: ["balle", "voûte plantaire", "voute plantaire", "sous le pied"], fichier: "balle-massage-pied" },
  // Pas d'image générique de rouleau : elle risquerait d'afficher une zone
  // corporelle différente de celle demandée.

  // Respiration et mental
  { motifs: ["méditation", "meditation", "en tailleur", "pleine conscience", "body scan"], fichier: "meditation-assise" },
  { motifs: ["breathwork", "diaphragm", "respiration ventrale", "cohérence cardiaque", "coherence cardiaque"], fichier: "recup2-06-respiration-diaphragmatique" },
  { motifs: ["respiration", "respirer"], fichier: "respiration-diaphragmatique" },

  // Sommeil et repos
  { motifs: ["sommeil", "coucher", "endormissement", "nuit"], fichier: "chambre-sommeil" },
  { motifs: ["jambes surélevées", "jambes surelevees", "contre un mur", "jambes au mur"], fichier: "recup2-08-jambes-contre-mur" },
  { motifs: ["nuque", "cervicales", "cou"], fichier: "etirement-cou" },

  // Matériel
  { motifs: ["hydratation", "boire", "eau"], fichier: "hydratation-eau" },
  {
    motifs: ["dos au mur", "adossé", "adosse", "assise calme"],
    fichier: "recup3-07-assise-femme",
    fichierFemme: "recup3-07-assise-femme",
    fichierHomme: "recup3-07-assise-homme",
  },
  // Nature morte du matériel — dernier recours pour une journée de
  // récupération dont le contenu ne mentionne aucun geste précis.
  { motifs: ["matériel", "materiel", "récupération active", "recuperation active"], fichier: "materiel-recuperation" },
];

/**
 * Photo COAI pour un contenu de récupération, ou null si aucune ne
 * correspond nettement.
 */
export function photoRecuperationPourTexte(texte: string, sexe?: string | null): string | null {
  const normalise = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const entree = TABLE.find((e) =>
    e.motifs.some((m) => normalise.includes(m.normalize("NFD").replace(/[̀-ͯ]/g, "")))
  );
  if (!entree) return null;
  const genre = (sexe ?? "").toLowerCase();
  const fichier = genre === "femme"
    ? entree.fichierFemme ?? entree.fichier
    : genre === "homme"
      ? entree.fichierHomme ?? entree.fichier
      : entree.fichier;
  const fichierAvecExtension = /\.[a-z0-9]+$/i.test(fichier) ? fichier : `${fichier}.jpg`;
  return `/recuperation/${fichierAvecExtension}`;
}
