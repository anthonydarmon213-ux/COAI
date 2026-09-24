# Rappel hebdomadaire — 24 septembre 2026

Explorer > Mon rappel hebdomadaire ouvre un réglage natif facultatif.
Jour et heure modifiables ; un identifiant de notification unique remplace
l'horaire précédent. Pas de demande de permission à l'ouverture : uniquement
sur activation explicite. Désactivation disponible sans permission.

Notification locale UNCalendarNotificationTrigger récurrente, heure locale de
l'iPhone (pas de fuseau figé). Aucun serveur, APNs, fournisseur payant ou donnée
de santé. Le texte reste générique. Le refus de permission est expliqué avec
un accès aux réglages ; aucun faux succès en cas d'échec de programmation.
L'état affiché à l'ouverture provient des demandes réellement en attente chez
iOS, pas d'un simple drapeau enregistré dans l'app.

## Vérifications

- Réinitialisation locale : efface les notifications hebdomadaire/repos,
  les notifications déjà livrées et les préférences du minuteur. La file du
  minuteur est invalidée pour éviter une alerte ajoutée tardivement.
- Test UI étendu : activation, désactivation, réactivation, réinitialisation
  confirmée, relancement puis lecture de la liste réelle des demandes iOS.
  Résultat du 24/09 à 02:20 : réussi sur le simulateur dédié iPhone 17.
- Un état « Vérification du rappel… » précède la lecture iOS ; l'absence
  de rappel n'est plus annoncée avant cette lecture.
- 46 tests Swift avec effacement ciblé des préférences et conservation des
  paramètres non concernés ; compilation Release iPhone non signée.

- 45 tests Swift réussis, dont validation des sept jours et bornes horaires.
- 65 contrôles de base ; règles WebKit, plist/manifeste, Release iPhone non signée.
- Test UI sur simulateur iPhone 17 iOS 26.5 neuf : ouverture sans permission
  automatique, activation acceptée, état affiché puis désactivation. Capture
  examinée, sans débordement visible sur cette taille.
- Premier essai sur ancien simulateur : autorisation déjà refusée ; message
  de refus constaté dans la hiérarchie réelle. Ce premier test a échoué car
  il attendait une activation, il n'est pas compté comme un test réussi.
- TypeScript, lint et build web passent, 356 références médias présentes.

## Restant

- Réception effective à l'heure choisie, changements d'heure/fuseau et mode
  Concentration sur appareil physique ; persistance après redémarrage iPhone.
- Test UI dédié du refus et modification d'horaire, petits écrans et texte XXL.
- Effacement automatique des rappels lors de suppression de compte web ou
  déconnexion web : encore à intégrer. Le reset natif explicite est couvert.
- Navigation ciblée après toucher l'alerte : ouverture de l'app uniquement,
  pas encore de lien direct vers un check-in.
- Ce rappel ne remplace pas le suivi personnalisé, les check-ins ou une
  stratégie de réengagement complète. Pas de validation en production.

Documentation : https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger
