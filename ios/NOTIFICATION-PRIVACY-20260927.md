# Notifications coach — protection locale

Le client email transmettait à ntfy le sujet et le corps des notifications
administrateur. Les appelants comprennent diagnostic, candidature VIP,
contact entreprise et récapitulatif de prospects : leurs textes peuvent contenir
des coordonnées et des réponses libres. Un sujet de notification n'est donc pas
un contenu public sûr.

Correction : push générique uniquement, sans sujet ni corps d'email. Les emails
gardent leurs destinataires et contenus existants. Les erreurs des deux
prestataires ne recopient plus la réponse distante ni l'objet d'erreur dans les
logs, afin d'éviter une fuite de contenu ou de secret.

Vérification : `node scripts/test-notification-privacy.cjs` exécute le vrai client
transpilé avec fetch simulé. Vérifie les deux canaux, les contenus distincts,
les réponses d'échec, exceptions contenant des secrets et canaux non configurés.
Aucun envoi réel ni appel payant. Typage, lint et build local réussis.

Cela ne constitue pas une validation de la confidentialité complète : contenu
des emails, consentement, destinataires configurés, rétention et contrats des
prestataires restent à auditer. Aucun déploiement effectué.
