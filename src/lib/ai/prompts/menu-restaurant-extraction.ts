// Analyse d'une photo de menu de restaurant (22/08/2026, demande Anthony —
// "Restaurant Decoder"). Même famille que meal-photo-extraction : garde-fous
// stricts, refus explicite si la photo n'est pas exploitable, jamais un plat
// inventé qui ne figure pas sur la carte.
//
// Réponse volontairement compacte (2 plats maximum, phrases courtes) : la
// personne est au restaurant, elle a besoin d'une décision en quelques
// secondes, pas d'une analyse nutritionnelle complète. Ça limite aussi le
// coût en tokens de sortie.
export function buildMenuRestaurantPrompt(objectif?: string | null): string {
  const contexteObjectif = objectif
    ? `L'objectif de la personne est : ${objectif}. Choisis en fonction.`
    : "Aucun objectif renseigné : privilégie l'équilibre général (protéines correctes, légumes présents).";

  return `Tu regardes la photo d'un menu de restaurant prise par une personne qui doit commander maintenant.

${contexteObjectif}

Renvoie un objet JSON avec ces champs :
{
  "analysable": true ou false,
  "restaurant": "type de cuisine identifié (ex: italien, brasserie), sinon null",
  "choix": [
    {
      "plat": "nom du plat EXACTEMENT tel qu'écrit sur la carte",
      "pourquoi": "une phrase courte : ce qui rend ce plat pertinent ici",
      "ajustement": "une demande simple à formuler au serveur (ex: sauce à part, légumes à la place des frites), ou null si rien à ajuster"
    }
  ],
  "resume": "une phrase, ou l'explication si la photo n'est pas analysable"
}

Mets "analysable": false, "choix": [] et "restaurant": null dans CHACUN de ces cas :
- La photo ne montre pas un menu lisible (flou, cadrage, autre sujet).
- Tu ne parviens pas à lire les noms des plats avec certitude.
Dans ces cas, "resume" explique brièvement pourquoi.

Règles impératives si "analysable": true :
- EXACTEMENT 2 choix maximum, classés du plus pertinent au moins pertinent.
- Ne propose QUE des plats réellement visibles sur la carte. N'invente jamais un plat
  "typique" du restaurant qui ne figure pas sur la photo, même s'il semblerait probable.
- Si un seul plat de la carte est réellement adapté, n'en renvoie qu'un. Un deuxième choix
  médiocre proposé pour "remplir" dessert la personne.
- Reste factuel et sans jugement : décris ce qui rend le plat pertinent, ne dénigre jamais
  les autres plats de la carte et n'emploie pas de vocabulaire culpabilisant.
- "ajustement" doit être une demande simple, réaliste et polie à formuler au serveur —
  jamais une transformation du plat qui reviendrait à commander autre chose.
- Aucun conseil médical, aucune recommandation valable pour une pathologie.`;
}
