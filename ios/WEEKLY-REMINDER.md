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

- iPhone SE 3 simulé, iOS 26.5, accessibilité XXXL : ouverture, défilement,
  bouton d'activation touchable d'au moins 44 points et dans la largeur écran.
  Captures introduction/réglages examinées : jour, heure et bouton lisibles.
  Test 02:29 réussi, aucun test ignoré. Premier essai corrigé car le test
  attendait un élément de liste non encore matérialisé avant défilement.
- Test de refus sur le simulateur QA avec autorisation déjà refusée : message
  explicite, lien Réglages, bouton utilisable, aucun faux succès ni nouvelle
  alerte de permission. Ce scénario nécessite cet état de permission ; un
  test ignoré sur un autre appareil ne constitue pas une preuve.

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

### Déconnexion web — contrôle du 24 septembre

Le bouton de déconnexion et la suppression de compte confirmée émettent
désormais `session-ended-v1` vers `coaiSessionEnded`. Aucun jeton, identifiant
ou contenu personnel n'est transmis. Le récepteur natif ne permet que la
réinitialisation locale existante : rappels, préférences du minuteur,
données WebKit et historique de navigation. La fenêtre d'abonnement se ferme.
Les messages provenant d'une autre WebView, d'une iframe, d'une origine autre
que HTTPS coai.fr/www.coai.fr ou d'un port autre que 443 sont refusés.
Les échecs/annulations web ne déclenchent pas le signal. Un navigateur sans
ce récepteur conserve son fonctionnement précédent.

Tests des boutons et du signal réussis (services simulés), compilation Release
iPhone non signée réussie. Test UI réel du récepteur WebKit sur simulateur QA :
activation d'un rappel, signal invalide, signal valide, remplacement de la
WebView, relancement, absence du rappel confirmée. Un test réussi, zéro ignoré :
`/tmp/coai-session-end-20260924/Logs/Test/Test-COAI-2026.09.24_09-25-40-+0200.xcresult`.
La page du test est une fixture locale ; aucun compte supprimé/déconnecté sur
le serveur. Ne prouve pas la révocation des sessions distantes ni la production.
Le site et le binaire devront tous deux intégrer le changement pour ce parcours.

- Réception effective à l'heure choisie, changements d'heure/fuseau et mode
  Concentration sur appareil physique ; persistance après redémarrage iPhone.
- Test de modification d'horaire et autres orientations/tailles ; VoiceOver.
- Effacement après déconnexion/suppression avec un vrai compte : raccordé
  localement et testé par composants, validation intégrale en production restante.
- Navigation ciblée après toucher l'alerte : ouverture de l'app uniquement,
  pas encore de lien direct vers un check-in.
- Ce rappel ne remplace pas le suivi personnalisé, les check-ins ou une
  stratégie de réengagement complète. Pas de validation en production.

Documentation : https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger
