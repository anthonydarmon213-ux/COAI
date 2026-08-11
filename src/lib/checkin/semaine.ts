// Lundi de la semaine contenant `date` (heure mise à 00:00) — sert de clé
// unique par semaine pour le check-in hebdomadaire (un seul par
// utilisateur/semaine, cf. WeeklyCheckin.semaineDebut).
export function lundiDeSemaine(date: Date): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jour = d.getUTCDay(); // 0 = dimanche
  const decalage = jour === 0 ? -6 : 1 - jour;
  d.setUTCDate(d.getUTCDate() + decalage);
  return d;
}
