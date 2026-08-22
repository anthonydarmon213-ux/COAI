// Voice Coach (22/08/2026, demande Anthony) — annonces vocales pendant la
// séance via l'API native du navigateur (window.speechSynthesis). Aucun
// coût, aucun audio envoyé sur un serveur, aucune dépendance.
//
// Le son est OPT-IN, jamais activé d'office : quelqu'un qui s'entraîne en
// salle avec sa musique ne doit pas se faire couper par une voix qu'il n'a
// pas demandée. La préférence est mémorisée dans localStorage.

const CLE_PREFERENCE = "coai_voice_coach";

export function voixDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function lirePreferenceVoix(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLE_PREFERENCE) === "1";
}

export function ecrirePreferenceVoix(active: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_PREFERENCE, active ? "1" : "0");
  if (!active) window.speechSynthesis?.cancel();
}

/**
 * Prononce un texte en français. `interrompre` coupe l'annonce en cours —
 * utile quand la personne enchaîne vite : entendre le nom de l'exercice
 * précédent pendant qu'elle attaque le suivant serait pire que le silence.
 */
export function parler(texte: string, options?: { interrompre?: boolean }) {
  if (!voixDisponible() || !lirePreferenceVoix() || !texte.trim()) return;
  const synth = window.speechSynthesis;
  if (options?.interrompre) synth.cancel();
  const message = new SpeechSynthesisUtterance(texte);
  message.lang = "fr-FR";
  // Légèrement plus lent que le défaut : en salle, avec du bruit ambiant et
  // de l'essoufflement, une diction rapide devient inintelligible.
  message.rate = 0.95;
  message.pitch = 1;
  synth.speak(message);
}

export function stopperVoix() {
  if (voixDisponible()) window.speechSynthesis.cancel();
}
