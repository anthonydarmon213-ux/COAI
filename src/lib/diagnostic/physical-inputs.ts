/** Input bounds mirror /api/profil storage validation, not a medical assessment. */
export function physicalInputErrors(age: string, height: string, weight: string) {
  function invalid(value: string, max: number, integer = false) {
    if (!value.trim()) return false;
    const number = Number(value);
    return !Number.isFinite(number) || number <= 0 || number > max || (integer && !Number.isInteger(number));
  }
  return {
    age: invalid(age, 120, true) ? "Indique un âge entier entre 1 et 120 ans." : null,
    height: invalid(height, 300) ? "Indique une taille supérieure à 0 et au maximum 300 cm." : null,
    weight: invalid(weight, 400) ? "Indique un poids supérieur à 0 et au maximum 400 kg." : null,
  };
}
