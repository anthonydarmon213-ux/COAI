import type { ProgrammePret } from "./catalogue";

// Couche éditoriale commune appliquée aux anciens packs avant leur mise en vente.
// Elle évite de dupliquer tout le catalogue tout en imposant le même niveau de
// détail : progression, nutrition, récupération, visuels HD et limites claires.
export const ENRICHISSEMENTS_PROGRAMMES: Record<string, Partial<ProgrammePret>> = {
  "coai-reset-rentree": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Goblet squat", photoHomme: "/exercices/kettlebell-goblet-squat.jpg" },
      { nom: "Squat au poids du corps", photoFemme: "/exercices/squat-poids-du-corps-femme-metisse-v2.jpg" },
      { nom: "Pompes", photoFemme: "/exercices/pompes-femme-eurasienne.jpg" },
      { nom: "Rowing unilatéral", photoHomme: "/exercices/rowing-haltere-unilateral-homme-arabe.jpg" },
      { nom: "Gainage planche", photoHomme: "/exercices/gainage-planche.jpg" },
    ],
    note: "La reprise doit rester progressive : en cas de douleur vive, malaise, blessure récente ou reprise après un problème médical, interromps la séance et demande un avis professionnel.",
  },
  "coai-lean-rentree": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Back squat", photoHomme: "/exercices/back-squat-barre.jpg" },
      { nom: "Deadlift conventionnel", photoFemme: "/exercices/deadlift-conventionnel-femme-blonde-v2.jpg" },
      { nom: "Développé couché", photoFemme: "/exercices/developpe-couche-barre-femme-blonde-v2.jpg" },
      { nom: "Rowing penché", photoHomme: "/exercices/kettlebell-rowing-penche.jpg" },
      { nom: "Gainage latéral", photoHomme: "/exercices/gainage-lateral.jpg" },
    ],
    note: "La perte de poids varie selon le profil et aucune vitesse n'est garantie. Évite les déficits agressifs ; demande un suivi adapté en cas de grossesse, trouble alimentaire, traitement ou pathologie métabolique.",
  },
  "coai-hybrid-engine-rentree": {
    badge: "Enrichi · À valider",
    photoHomme: "/exercices/hyrox-kettlebell-swing.jpg",
    visuels: [
      { nom: "Wall ball", photoFemme: "/exercices/hyrox-wall-ball.jpg" },
      { nom: "Kettlebell swing", photoHomme: "/exercices/hyrox-kettlebell-swing.jpg" },
      { nom: "Burpee contrôlé", photoHomme: "/exercices/hyrox-burpee-position-basse.jpg" },
      { nom: "Mountain climber", photoFemme: "/exercices/hyrox-mountain-climber.jpg" },
      { nom: "Front squat", photoHomme: "/exercices/front-squat-barre.jpg" },
    ],
  },
  "coai-trx-sculpt-rentree": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Rowing suspension", photoFemme: "/exercices/suspension-rowing.jpg" },
      { nom: "Squat suspension", photoHomme: "/exercices/suspension-squat.jpg" },
      { nom: "Pompes suspension", photoHomme: "/exercices/suspension-pompes.jpg" },
      { nom: "Fente arrière suspension", photoFemme: "/exercices/suspension-fente-arriere.jpg" },
      { nom: "Gainage suspension", photoHomme: "/exercices/suspension-gainage-planche.jpg" },
      { nom: "Curl ischio suspension", photoFemme: "/exercices/suspension-curl-ischio.jpg" },
    ],
    note: "Fixe les sangles sur un ancrage conçu pour supporter la charge et teste-le avant chaque séance. Éloigne les pieds progressivement et arrête si l'ancrage bouge ou si une douleur articulaire apparaît.",
  },
  "coai-mass-rentree": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Développé couché", photoHomme: "/exercices/developpe-couche-barre-homme-arabe-v2.jpg" },
      { nom: "Front squat", photoHomme: "/exercices/front-squat-barre.jpg" },
      { nom: "Fentes bulgares", photoFemme: "/exercices/fentes-bulgares.jpg" },
      { nom: "Développé épaules", photoHomme: "/exercices/developpe-militaire-halteres.jpg" },
      { nom: "Deadlift sumo", photoHomme: "/exercices/deadlift-sumo.jpg" },
    ],
    note: "La prise de masse dépend du niveau, du surplus énergétique, du sommeil et de la régularité. Progresse sans échec systématique et fais encadrer les mouvements lourds si tu débutes.",
  },
  "special-bureau-chaise": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Semaines 1-2", titre: "Déverrouillage", contenu: "Deux pauses de 5 minutes par jour, amplitude confortable et respiration lente." },
      { periode: "Semaines 3-4", titre: "Régularité", contenu: "Passe à trois pauses actives et ajoute 2 répétitions sur les mouvements dynamiques." },
      { periode: "Semaines 5-6", titre: "Autonomie", contenu: "Alterne les cinq routines selon ta zone la plus raide et conserve une pause toutes les 60 à 90 minutes." },
    ],
    nutrition: [
      { titre: "Déjeuner de travail", contenu: "Compose une assiette avec protéines, légumes et féculent adapté pour limiter le coup de fatigue de l'après-midi." },
      { titre: "Hydratation visible", contenu: "Garde une gourde sur le bureau et bois régulièrement plutôt que de rattraper toute l'eau en fin de journée." },
      { titre: "Collation utile", contenu: "Si besoin : fruit et skyr, houmous et crudités ou poignée d'oléagineux, plutôt qu'un grignotage automatique." },
    ],
    recuperation: [
      { titre: "Règle 60-90", contenu: "Toutes les 60 à 90 minutes, lève-toi 2 à 5 minutes, marche et change de position." },
      { titre: "Yeux", contenu: "Regarde régulièrement au loin pendant 20 secondes et adapte luminosité, distance et hauteur de l'écran." },
      { titre: "Fin de journée", contenu: "5 minutes : étirement de nuque, rotation thoracique, chaîne postérieure sur chaise et expiration longue." },
    ],
    note: "Ces pauses ne traitent pas une douleur persistante. Engourdissement, perte de force, douleur irradiée ou céphalées inhabituelles justifient un avis médical.",
  },
  "prepa-semi-marathon": {
    badge: "Enrichi · À valider",
    photoHomme: "/exercices/sauts-corde.jpg",
    visuels: [
      { nom: "Montées de mollets à l’élastique", photoHomme: "/exercices/mollets-debout-elastique-homme-metis-v2.jpg" },
      { nom: "Fente d'ouverture de hanche", photoFemme: "/exercices/mobilite-fente-basse-ouverture-hanche.jpg" },
      { nom: "Renforcement unilatéral", photoFemme: "/exercices/fentes-bulgares.jpg" },
      { nom: "Gainage latéral", photoHomme: "/exercices/gainage-lateral.jpg" },
      { nom: "Éducatif corde à sauter", photoHomme: "/exercices/sauts-corde.jpg" },
    ],
    progression: [
      { periode: "Semaines 1-2", titre: "Base", contenu: "Trois sorties faciles, sortie longue de 60 à 75 minutes et renforcement technique court." },
      { periode: "Semaines 3-4", titre: "Seuil", contenu: "Ajoute des blocs de 6 à 10 minutes soutenus et augmente la sortie longue de 5 à 10 minutes maximum." },
      { periode: "Semaines 5-6", titre: "Spécifique", contenu: "Travaille l'allure visée par fractions, teste ravitaillement et équipement, sans finir épuisé." },
      { periode: "Semaine 7", titre: "Pic contrôlé", contenu: "Dernière sortie longue significative puis diminution progressive du volume." },
      { periode: "Semaine 8", titre: "Affûtage", contenu: "Réduis le volume de 40 à 50 %, garde quelques accélérations et arrive reposé au test." },
    ],
    nutrition: [
      { titre: "Carburant", contenu: "Conserve des glucides autour des séances longues et qualitatives ; ne teste aucun aliment nouveau le jour du semi." },
      { titre: "Sorties longues", contenu: "Au-delà d'environ 75 minutes, teste progressivement boisson et apport glucidique selon ta tolérance." },
      { titre: "Après course", contenu: "Dans les heures suivantes, associe eau, protéines et glucides avec une recette HYBRID de la bibliothèque." },
    ],
    recuperation: [
      { titre: "Espacement", contenu: "Place au moins une journée facile entre fractionné, sortie longue et renforcement jambes." },
      { titre: "Pieds et mollets", contenu: "Inspecte les zones de frottement, mobilise les chevilles et adapte immédiatement chaussures ou volume si la douleur augmente." },
      { titre: "Sommeil", contenu: "Priorise 7 à 9 heures et remplace une séance dure par 30 minutes faciles après une mauvaise nuit." },
    ],
    note: "Le plan suppose que tu peux déjà courir 45 minutes sans douleur. Toute douleur qui modifie la foulée, douleur thoracique, malaise ou essoufflement inhabituel impose l'arrêt et un avis professionnel.",
  },
  "prepa-hyrox": {
    badge: "Enrichi · À valider",
    photoHomme: "/exercices/hyrox-kettlebell-swing.jpg",
    visuels: [
      { nom: "Wall ball", photoFemme: "/exercices/hyrox-wall-ball.jpg" },
      { nom: "Kettlebell swing", photoHomme: "/exercices/hyrox-kettlebell-swing.jpg" },
      { nom: "Burpee", photoHomme: "/exercices/hyrox-burpee-position-basse.jpg" },
      { nom: "Mountain climber", photoFemme: "/exercices/hyrox-mountain-climber.jpg" },
      { nom: "Fente en rack", photoHomme: "/exercices/kettlebell-fente-rack.jpg" },
    ],
    progression: [
      { periode: "Semaines 1-2", titre: "Technique", contenu: "Apprends chaque atelier à effort 6/10, développe la course facile et garde 2 à 3 répétitions en réserve." },
      { periode: "Semaines 3-4", titre: "Enchaînements", contenu: "Ajoute deux à quatre blocs course-atelier et progresse sur la charge sans sacrifier les transitions." },
      { periode: "Semaine 5", titre: "Simulation partielle", contenu: "Réalise 60 à 75 % du volume cible à allure contrôlée et valide hydratation, chaussures et stratégie." },
      { periode: "Semaine 6", titre: "Affûtage", contenu: "Divise le volume par deux, garde quelques efforts brefs et évite toute séance maximale tardive." },
    ],
    nutrition: [
      { titre: "Jours spécifiques", contenu: "Place une portion de glucides avant et après les séances course-atelier, avec une source de protéines au repas." },
      { titre: "Hydratation testée", contenu: "Teste eau et sodium à l'entraînement selon durée, chaleur et transpiration ; rien de nouveau le jour du test." },
      { titre: "Recettes liées", contenu: "Utilise les recettes HYBRID les jours intenses et RESET les jours faciles, avec portions adaptées au diagnostic." },
    ],
    recuperation: [
      { titre: "48 heures", contenu: "Sépare la force jambes lourde et la simulation par au moins 48 heures." },
      { titre: "Décharge", contenu: "Réduis de 25 à 35 % le volume si les performances baissent deux séances de suite ou si le sommeil se dégrade." },
      { titre: "Retour au calme", contenu: "Marche 5 minutes puis mobilité douce des chevilles, hanches et haut du dos." },
    ],
    note: "Programme indépendant sans affiliation à HYROX. Adapte charges et ateliers à ton niveau ; demande un encadrement pour le traîneau et arrête en cas de douleur, vertige ou gêne thoracique.",
  },
  "perte-de-gras-maintien-musculaire": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Back squat", photoHomme: "/exercices/back-squat-barre.jpg" },
      { nom: "Développé couché", photoFemme: "/exercices/developpe-couche-barre-femme-blonde-v2.jpg" },
      { nom: "Rowing unilatéral", photoHomme: "/exercices/rowing-haltere-unilateral-homme-arabe.jpg" },
      { nom: "Deadlift conventionnel", photoFemme: "/exercices/deadlift-conventionnel-femme-blonde-v2.jpg" },
      { nom: "Gainage planche", photoHomme: "/exercices/gainage-planche.jpg" },
    ],
    progression: [
      { periode: "Semaines 1-2", titre: "Référence", contenu: "Fixe des charges reproductibles, 3 séries et 2 à 3 répétitions en réserve ; stabilise les pas quotidiens." },
      { periode: "Semaines 3-4", titre: "Maintien de force", contenu: "Ajoute des répétitions ou 2 à 5 % de charge quand toutes les séries sont propres, sans ajouter de cardio punitif." },
      { periode: "Semaine 5", titre: "Allègement", contenu: "Réduis le volume de musculation de 30 % et observe énergie, faim, sommeil et tendance du poids." },
      { periode: "Semaines 6-8", titre: "Consolidation", contenu: "Reprends les meilleures charges, ajuste seulement le déficit si la tendance reste stable deux semaines." },
    ],
    nutrition: [
      { titre: "Déficit mesuré", contenu: "Commence autour de 10 à 15 % sous l'entretien et base les ajustements sur une moyenne de plusieurs pesées." },
      { titre: "Protéines et fibres", contenu: "Vise une source protéinée à chaque repas, des légumes, des fruits et des féculents complets adaptés à l'activité." },
      { titre: "Recettes liées", contenu: "Choisis les recettes LEAN de la bibliothèque et ajuste les portions, pas la qualité ni la variété des aliments." },
    ],
    recuperation: [
      { titre: "Sommeil", contenu: "Vise 7 à 9 heures ; une fatigue persistante est un signal pour alléger avant de réduire davantage les calories." },
      { titre: "Cardio facile", contenu: "Garde la majorité du cardio à allure conversationnelle afin de préserver la qualité des séances de force." },
      { titre: "Suivi", contenu: "Observe aussi tour de taille, vêtements, énergie et performances, pas seulement le chiffre quotidien de la balance." },
    ],
    note: "Aucune perte de poids précise n'est garantie. En cas de grossesse, trouble alimentaire, traitement ou pathologie, fais adapter l'alimentation et l'entraînement par un professionnel qualifié.",
  },
  "poids-du-corps": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Squat au poids du corps", photoFemme: "/exercices/squat-poids-du-corps-femme-metisse-v2.jpg" },
      { nom: "Pompes", photoFemme: "/exercices/pompes-femme-eurasienne.jpg" },
      { nom: "Fente arrière", photoHomme: "/exercices/suspension-fente-arriere.jpg" },
      { nom: "Gainage planche", photoHomme: "/exercices/gainage-planche.jpg" },
      { nom: "Gainage latéral", photoHomme: "/exercices/gainage-lateral.jpg" },
    ],
    progression: [
      { periode: "Semaine 1", titre: "Technique", contenu: "2 à 3 séries, amplitude confortable et 3 répétitions propres en réserve." },
      { periode: "Semaine 2", titre: "Répétitions", contenu: "Ajoute 1 à 3 répétitions par série sans accélérer le tempo." },
      { periode: "Semaine 3", titre: "Densité", contenu: "Ajoute une série sur deux exercices ou réduis les repos de 15 secondes." },
      { periode: "Semaine 4", titre: "Maîtrise", contenu: "Choisis une seule variante plus difficile et compare la qualité à la semaine 1." },
    ],
    nutrition: [
      { titre: "Repères simples", contenu: "À chaque repas : protéines, légumes ou fruit, féculent selon l'activité et une source de bonnes graisses." },
      { titre: "Avant séance", contenu: "Si le dernier repas date de plusieurs heures, prends une collation digeste comme fruit et yaourt." },
      { titre: "Recettes liées", contenu: "RESET accompagne la remise en forme ; LEAN ou MASS s'utilisent uniquement selon ton objectif et tes portions." },
    ],
    recuperation: [
      { titre: "Articulations", contenu: "Alterne les variantes et laisse 24 à 48 heures avant de solliciter intensément la même zone." },
      { titre: "Mobilité", contenu: "Après séance : 5 minutes de cheville, hanches, haut du dos et respiration calme." },
      { titre: "Régulation", contenu: "Réduis de moitié les séries si les courbatures changent ta technique ou tes gestes quotidiens." },
    ],
    note: "Le poids du corps n'est pas sans risque : stabilise les appuis, utilise une surface non glissante et remplace les sauts si douleur, reprise ou voisinage incompatible.",
  },
  "challenge-30-jours": {
    badge: "Enrichi · À valider",
    visuels: [
      { nom: "Squat", photoFemme: "/exercices/squat-poids-du-corps-femme-metisse-v2.jpg" },
      { nom: "Pompes", photoFemme: "/exercices/pompes-femme-eurasienne.jpg" },
      { nom: "Gainage", photoHomme: "/exercices/gainage-planche.jpg" },
      { nom: "Fente", photoFemme: "/exercices/fentes-bulgares.jpg" },
      { nom: "Mobilité", photoHomme: "/exercices/mobilite-etirement-psoas-fente.jpg" },
    ],
    progression: [
      { periode: "Jours 1-7", titre: "Installer", contenu: "Séances courtes à effort 5/10 ; l'objectif est de terminer frais et de tenir le rendez-vous quotidien." },
      { periode: "Jours 8-14", titre: "Construire", contenu: "Ajoute quelques répétitions et une marche active, sans augmenter simultanément tous les exercices." },
      { periode: "Jours 15-21", titre: "Consolider", contenu: "Alterner renforcement, cardio doux et mobilité pour éviter sept jours d'impact identique." },
      { periode: "Jours 22-28", titre: "Progresser", contenu: "Choisis une variante plus exigeante sur un seul mouvement et garde deux jours très légers." },
      { periode: "Jours 29-30", titre: "Bilan", contenu: "Refais le circuit de départ à technique égale puis choisis le programme suivant adapté à ton objectif." },
    ],
    nutrition: [
      { titre: "Un changement à la fois", contenu: "Commence par structurer trois repas et l'hydratation avant de modifier portions ou calories." },
      { titre: "Assiette quotidienne", contenu: "Protéines, légumes, féculent adapté et bonnes graisses ; aucun aliment n'est interdit par le challenge." },
      { titre: "Recettes liées", contenu: "Sélectionne sept recettes simples de la bibliothèque et répète-les pour réduire la charge mentale." },
    ],
    recuperation: [
      { titre: "Jours légers", contenu: "Les journées marche, mobilité et respiration sont obligatoires : elles permettent de tenir les 30 jours." },
      { titre: "Sommeil", contenu: "Choisis une heure de lever régulière et prépare la séance courte la veille." },
      { titre: "Rattrapage", contenu: "Une journée manquée ne se double pas : reprends simplement le calendrier le lendemain." },
    ],
    note: "Le défi valorise la régularité, pas l'épuisement. Stoppe les impacts ou la séance en cas de douleur inhabituelle, vertige ou fatigue excessive.",
  },
  "sommeil-reparateur": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Jours 1-3", titre: "Observer", contenu: "Note heure de lever, coucher, éveils, caféine et énergie sans chercher à tout corriger." },
      { periode: "Jours 4-7", titre: "Ancrer", contenu: "Stabilise l'heure de lever, expose-toi à la lumière le matin et crée une routine de 20 minutes le soir." },
      { periode: "Jours 8-11", titre: "Ajuster", contenu: "Réduis les écrans stimulants, avance la dernière caféine et réserve le lit au sommeil." },
      { periode: "Jours 12-14", titre: "Personnaliser", contenu: "Conserve les deux actions les plus efficaces et prépare un plan réaliste pour les semaines suivantes." },
    ],
    nutrition: [
      { titre: "Caféine", contenu: "Observe ta sensibilité et évite-la généralement dans les 6 à 8 heures avant le coucher." },
      { titre: "Dîner", contenu: "Privilégie un repas digeste 2 à 3 heures avant le coucher ; évite de te coucher très affamé ou après un repas massif." },
      { titre: "Alcool", contenu: "Ne l'utilise pas comme aide au sommeil : il peut fragmenter la nuit même s'il facilite l'endormissement." },
    ],
    recuperation: [
      { titre: "Lumière", contenu: "Recherche la lumière naturelle le matin et baisse progressivement l'intensité lumineuse le soir." },
      { titre: "Descente", contenu: "Choisis lecture calme, douche tiède, étirement doux ou respiration lente, toujours dans le même ordre." },
      { titre: "Nuit difficile", contenu: "Évite la séance maximale le lendemain et reviens à l'heure de lever habituelle plutôt que de bouleverser tout le rythme." },
    ],
    note: "Ce programme améliore l'hygiène de sommeil mais ne traite pas une insomnie chronique, une apnée ou un trouble médical. Ronflements avec pauses, somnolence dangereuse ou symptômes persistants nécessitent une consultation.",
  },
  "respiration-anti-stress": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Semaine 1", titre: "Respirer sans forcer", contenu: "5 minutes par jour, expiration légèrement plus longue et aucune rétention inconfortable." },
      { periode: "Semaine 2", titre: "Réguler", contenu: "Passe à 6 à 8 minutes et teste la routine avant une situation modérément stressante." },
      { periode: "Semaines 3-4", titre: "Automatiser", contenu: "Choisis deux protocoles : un pour redescendre et un bref pour retrouver de la concentration." },
    ],
    nutrition: [
      { titre: "Stimulants", contenu: "Observe le lien entre caféine, boissons énergisantes, palpitations et agitation ; réduis si nécessaire." },
      { titre: "Hydratation", contenu: "Bois régulièrement : soif, chaleur et effort peuvent accélérer la respiration et être confondus avec le stress." },
      { titre: "Rythme des repas", contenu: "Évite les longues périodes sans manger si elles favorisent tremblements, irritabilité ou perte de concentration." },
    ],
    recuperation: [
      { titre: "Position", contenu: "Pratique assis ou allongé dans un lieu sûr, épaules relâchées, sans conduite ni immersion." },
      { titre: "Après effort", contenu: "Commence par marcher jusqu'à retrouver une respiration confortable avant d'utiliser un rythme guidé." },
      { titre: "Journal", contenu: "Note tension avant et après sur 10 pour identifier le protocole qui t'aide réellement." },
    ],
    note: "Arrête les rétentions si tu ressens vertige, fourmillements, oppression ou panique et reprends une respiration naturelle. Ne pratique jamais en conduisant, dans l'eau ou debout si tu es sujet aux malaises.",
  },
  "meditation-guidee": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Jours 1-2", titre: "Deux minutes", contenu: "Observe le souffle et reviens sans jugement dès que l'attention part." },
      { periode: "Jours 3-4", titre: "Balayage", contenu: "Passe à 4 ou 5 minutes et explore successivement visage, épaules, ventre et appuis." },
      { periode: "Jours 5-6", titre: "Pensées", contenu: "Nomme simplement pensée, son ou sensation, puis reviens au point d'ancrage." },
      { periode: "Jour 7", titre: "Routine", contenu: "Choisis durée, lieu et moment réalistes pour répéter la pratique trois fois la semaine suivante." },
    ],
    nutrition: [
      { titre: "Confort", contenu: "Évite une pratique juste après un repas très copieux ou lorsque la faim devient distrayante." },
      { titre: "Stimulants", contenu: "Si l'agitation est forte, observe caféine et boissons énergisantes avant de conclure que la méditation ne fonctionne pas." },
      { titre: "Hydratation", contenu: "Prends quelques gorgées avant de t'installer, sans transformer la séance en nouvelle contrainte." },
    ],
    recuperation: [
      { titre: "Cadre", contenu: "Téléphone en silencieux, posture soutenue et minuterie douce ; le confort prime sur une posture parfaite." },
      { titre: "Après séance", contenu: "Prends 30 secondes pour bouger doigts, épaules et regard avant de reprendre une activité." },
      { titre: "Régularité", contenu: "Trois minutes répétées valent mieux qu'une longue séance rare et inconfortable." },
    ],
    note: "La méditation ne remplace pas un accompagnement psychologique ou médical. Si elle intensifie durablement anxiété, dissociation ou souvenirs traumatiques, arrête et demande un accompagnement adapté.",
  },
  "recuperation-passive-sauna-hammam-massage": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Semaine 1", titre: "Tolérance", contenu: "Choisis une seule méthode, une durée courte et observe hydratation, vertiges et sommeil." },
      { periode: "Semaine 2", titre: "Régularité", contenu: "Répète au maximum deux expositions espacées, sans augmenter durée et température en même temps." },
      { periode: "Semaines 3-4", titre: "Routine", contenu: "Conserve uniquement les méthodes bien tolérées et place-les loin des séances où la déshydratation est déjà importante." },
    ],
    nutrition: [
      { titre: "Avant chaleur", contenu: "Arrive hydraté, sans alcool et sans repas très lourd juste avant la séance." },
      { titre: "Après chaleur", contenu: "Bois progressivement ; après forte transpiration, associe eau, repas salé équilibré et aliments riches en potassium." },
      { titre: "Après massage", contenu: "Un repas normal avec protéines, légumes et glucides adaptés suffit ; aucune boisson détox n'est nécessaire." },
    ],
    recuperation: [
      { titre: "Sauna", contenu: "Débutant : 5 à 10 minutes, sortie et refroidissement progressif, puis éventuellement un second passage court. Ne dépasse pas ta tolérance." },
      { titre: "Hammam", contenu: "Commence par 5 à 10 minutes malgré la température plus basse : l'humidité limite l'évaporation de la transpiration. Sors au moindre malaise." },
      { titre: "Massage", contenu: "Pression légère à modérée, 30 à 60 secondes par zone ; jamais sur inflammation aiguë, plaie, varice douloureuse ou articulation." },
    ],
    note: "La chaleur est contre-indiquée ou nécessite un avis médical dans certaines situations : grossesse, maladie cardiovasculaire, tension non contrôlée, malaise récent ou médicaments affectant hydratation et thermorégulation. Jamais d'alcool ; sors immédiatement si vertige, nausée, palpitations ou confusion.",
  },
  "routine-recuperation-complete": {
    badge: "Enrichi · À valider",
    progression: [
      { periode: "Semaine 1", titre: "Sélection", contenu: "Teste trois protocoles courts et note raideur, fatigue et qualité de sommeil avant et après." },
      { periode: "Semaine 2", titre: "Association", contenu: "Associe un protocole local de 5 minutes à une respiration de 3 à 5 minutes." },
      { periode: "Semaines 3-4", titre: "Personnalisation", contenu: "Construis une routine de 10 à 15 minutes avec les deux outils les mieux tolérés, sans tout cumuler." },
    ],
    nutrition: [
      { titre: "Après entraînement", contenu: "Dans les heures suivantes, associe une source de protéines, des glucides adaptés et de l'eau." },
      { titre: "Hydratation", contenu: "La couleur des urines et la soif donnent des repères simples ; compense progressivement les pertes liées à la chaleur et à l'effort." },
      { titre: "Recettes liées", contenu: "RESET convient aux jours faciles, HYBRID aux séances longues et MASS aux cycles de prise de masse, avec portions personnalisées." },
    ],
    recuperation: [
      { titre: "Dose minimale utile", contenu: "5 à 15 minutes régulières suffisent souvent ; plus de pression ou de durée n'apporte pas automatiquement plus de bénéfice." },
      { titre: "Choix du protocole", contenu: "Raideur : mobilité douce ; tension locale : auto-massage léger ; agitation : respiration ou méditation ; fatigue globale : sommeil et journée facile." },
      { titre: "Suivi", contenu: "Si une méthode aggrave douleur, gonflement, engourdissement ou fatigue, retire-la et fais évaluer le symptôme." },
    ],
    note: "La récupération accompagne l'entraînement mais ne soigne pas une blessure. Douleur aiguë, gonflement important, déficit neurologique, fièvre ou fatigue inexpliquée nécessitent un avis professionnel.",
  },
};
