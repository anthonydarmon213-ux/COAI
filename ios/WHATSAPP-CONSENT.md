# Coach WhatsApp — accord avant transfert IA

Préparation locale du 28 septembre 2026. NON VALIDÉ sur ManyChat réel.

## Contrat serveur

Le secret `x-webhook-secret` reste obligatoire. L'API demande également
`x-coai-ai-coach-consent: anthropic-coach-v1`. Ce second en-tête n'est ni un
secret ni une preuve juridique durable ; il représente le choix explicite du
membre transmis par le flow authentifié. Il ne doit JAMAIS être ajouté comme
valeur statique pour tous les membres.

Sans accord, avec une ancienne version ou un accord image, la réponse reste
HTTP 200 avec `code: AI_COACH_CONSENT_REQUIRED` et `reply` orientant vers
`https://coai.fr/coach`. Aucun profil lu, message enregistré dans WhatsAppEvent,
quota réservé ni appel Anthropic. WhatsApp/ManyChat ont déjà reçu le message :
ce contrôle ne prétend pas supprimer leur copie.

## Conditions avant publication ou activation

1. Inspecter le flow réel et ses champs, sans inventer leur configuration.
2. Présenter le destinataire Anthropic et les données : question, objectifs,
   niveau, âge, contraintes et antécédents renseignés. Expliquer séparément le
   traitement par WhatsApp/ManyChat et renvoyer à la confidentialité.
3. Recueillir un choix positif, non précoché, lié au membre et à la version.
   Refuser ou retirer l'accord doit rester possible sans perdre son compte.
4. N'envoyer l'en-tête que si ce choix est encore valable. Un retrait doit
   empêcher les requêtes suivantes ; ne pas réutiliser un accord image.
5. Tester acceptation, refus, retrait, reprise et ancien accord avec comptes de
   test. Vérifier la preuve conservée et la politique de rétention effective.
6. Obtenir l'autorisation de publier ; aucun changement distant dans ce lot.

Déployer uniquement le serveur avec l'ancien flow bloquerait les réponses IA
WhatsApp et proposerait le coach web. Cette transition doit être validée avant
déploiement ; le présent correctif n'est pas une intégration complète du flow.

## Preuves locales

- `test-whatsapp-paid-access.cjs` : défaut reproduit avant correction, puis
  refus avant lecture/écriture/IA pour accord absent, obsolète ou image.
- `test-whatsapp-quota.cjs` : concurrence et restitution après panne simulées.
- `test-coach-quota-postgres.cjs --local` : vraie base locale, absence de message
  et de consommation sans accord, dernière question partagée web/WhatsApp,
  changement de période et remboursement après échec. Prestataire simulé.

Aucun appel IA, message WhatsApp réel, abonnement ni coût ajouté.
