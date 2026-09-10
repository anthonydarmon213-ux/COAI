// Transcription de la fiche Full Body homme/femme validée par Anthony le
// 09/09/2026. Deux séances hebdomadaires reprennent les mêmes fondamentaux.
// Pas une substitution universelle : les contraintes de santé continuent
// d'exclure les socles avant cet appel. Aucune génération IA ici.
export function fullBodyValide(frequence: 1 | 2, dureeSeanceMinutes?: number | null) {
  const court = dureeSeanceMinutes != null && dureeSeanceMinutes <= 45;
  const duree = court ? 45 : 60;
  const exercices = [
    { nom: "Presse à cuisses (machine)", phases: ["Bassin stable sur l'assise", "Descends en amplitude contrôlée", "Pousse sans décoller le bassin"] },
    { nom: "Développé couché haltères", phases: ["Pieds ancrés, omoplates serrées", "Descends les haltères sous contrôle", "Pousse sans décoller les épaules"] },
    { nom: "Tirage horizontal (machine)", phases: ["Buste stable, dos neutre", "Tire les coudes sans élan", "Reviens sous contrôle"] },
    { nom: "Superman au sol", phases: ["Allongé, nuque dans l'axe", "Décolle en faible amplitude, sans douleur", "Maintiens en respirant puis repose"] },
    { nom: "Gainage planche", phases: ["Corps aligné des épaules aux talons", "Ventre et fessiers contractés", "Respire sans creuser le dos"] },
    { nom: "Crunch au sol", phases: ["Bas du dos au sol", "Décolle seulement les omoplates", "Expire puis redescends lentement"] },
  ];
  return {
    _source: "SOCLE_COAI",
    titre: `Full Body — ${frequence} séance${frequence > 1 ? "s" : ""}/semaine`,
    frequenceParSemaine: `${frequence} séance${frequence > 1 ? "s" : ""} par semaine`,
    dureeProgramme: "4 semaines, puis progression et réévaluation",
    vueEnsemble: `Les fondamentaux validés COAI, format estimé ${duree} min, préparation, repos et transitions compris. Dernière répétition propre, jamais forcée. Note tes charges et tes sensations.`,
    contreIndications: [],
    seances: ["Lundi", "Jeudi"].slice(0, frequence).map((jour, index) => ({
      jour,
      nom: `Full Body ${index === 0 ? "A" : "B"} — les fondamentaux`,
      photoQuerySeance: "Presse à cuisses (machine)",
      dureeEstimee: `${duree} min : ${court ? 7 : 10} min de préparation + ${court ? 32 : 42} min de séance et transitions + ${court ? 6 : 8} min de retour au calme. Ne pas accélérer les gestes pour tenir le chrono.`,
      echauffement: `${court ? 7 : 10} min : cardio léger ; mobilité des hanches et des épaules en amplitude confortable ; séries d'approche progressives sur les premiers exercices, sans fatigue excessive.`,
      exercices: exercices.map((exercice) => {
        const superman = exercice.nom === "Superman au sol";
        const planche = exercice.nom === "Gainage planche";
        return {
          ...exercice,
          series: court ? "2" : "3",
          repetitions: superman ? "15-20 s" : planche ? "30-45 s" : "8-12 répétitions",
          repos: superman ? "0 min 45 s" : planche ? "0 min 30 s" : "1 min 15 s",
          methode: superman || planche ? "Isométrique" : "Séries classiques",
          charge: /superman|gainage|crunch/i.test(exercice.nom)
            ? "Poids du corps, mouvement contrôlé"
            : "Dernière répétition propre, jamais forcée. Charge et réglages adaptés au niveau et au mouvement.",
          photoQuery: exercice.nom,
        };
      }),
      retourAuCalme: `${court ? 6 : 8} min : marche lente puis respiration calme ; relâche les épaules sans forcer ; mobilité douce si agréable, aucun étirement forcé.`,
      conseilsDuCoach: "Hydrate-toi par petites gorgées selon ta soif. Respire pendant l'effort. Pendant le repos, récupère ; marche douce uniquement si tu restes frais. Étirements doux et facultatifs. Douleur inhabituelle ou malaise : arrête la séance et demande conseil.",
    })),
  };
}
