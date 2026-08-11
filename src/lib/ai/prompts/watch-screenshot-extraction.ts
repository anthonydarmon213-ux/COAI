// Extraction de données depuis un screenshot de montre connectée ou d'app
// santé (Apple Watch/Health, Garmin, Fitbit, Samsung Health, Withings,
// Whoop, Coros, Polar...). Toutes les marques n'affichent pas les mêmes
// métriques — la consigne centrale est de ne jamais inventer une valeur
// non lisible sur l'image plutôt que de fausser silencieusement le profil.
export function buildWatchScreenshotExtractionPrompt(): string {
  return `Tu analyses un screenshot d'une montre connectée ou d'une app de santé (Apple Watch/
Health, Garmin, Fitbit, Samsung Health, Withings, Whoop, Coros, Polar, ou autre). Extrais
uniquement les métriques qui sont clairement lisibles sur l'image.

Renvoie un objet JSON avec ces champs (nombre entier ou décimal selon le cas, uniquement les
unités metriques) :
{
  "pasMoyenParJour": nombre de pas moyen/quotidien si visible, sinon null,
  "frequenceCardiaqueRepos": fréquence cardiaque de repos en bpm si visible, sinon null,
  "sommeilMoyenHeures": durée moyenne de sommeil en heures (ex: 6.5), sinon null,
  "vo2Max": VO2 max si affiché, sinon null,
  "caloriesMoyennesParJour": calories actives/totales moyennes par jour si visible, sinon null,
  "hrv": variabilité de fréquence cardiaque (HRV) en millisecondes si affichée (Whoop, Oura, Garmin...), sinon null,
  "resume": une phrase courte résumant ce que montre l'image (marque/app détectée si identifiable,
    période couverte par les données, toute autre métrique intéressante non couverte par les
    champs ci-dessus — poids, distance parcourue, tendance activité...)
}

Règles impératives :
- Ne devine JAMAIS une valeur qui n'est pas clairement affichée sur l'image — mets null plutôt
  que d'approximer. Une valeur inventée dans le profil d'un utilisateur peut fausser tout le
  programme d'entraînement généré ensuite.
- Si l'image n'est pas un screenshot de montre/app santé (ou si aucune métrique n'est lisible),
  renvoie tous les champs à null et explique-le brièvement dans "resume".
- "resume" doit rester factuel, pas de commentaire sur la forme physique de la personne.`;
}
