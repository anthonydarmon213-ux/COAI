# COAI — dossier de soumission (brouillon, non publié)

Mise à jour : 27 septembre 2026. Préparation sans frais autorisée par Anthony.
Ce document ne constitue ni une validation fonctionnelle ni une soumission Apple.

## Métadonnées proposées

- Nom : COAI
- Sous-titre : Fitness, nutrition et récup
- Langue principale : français
- Catégorie proposée : Forme et santé
- Mots-clés : fitness,musculation,nutrition,récupération,entraînement,progression,bien-être
- URL de confidentialité candidate : https://coai.fr/confidentialite
- URL et contact de support : à confirmer, ne pas inventer d'adresse.

### Description proposée — à publier seulement après validation des parcours

COAI rassemble ton entraînement, ta nutrition et ta récupération dans un même espace.

Découvre ton programme, consulte les démonstrations des exercices, note tes séances et retrouve tes progrès. Explore les recettes et les contenus de récupération pour organiser ta routine au quotidien.

COAI accompagne une pratique de bien-être et de fitness. L'application ne fournit pas de diagnostic médical et ne remplace pas un professionnel de santé.

Les fonctions incluses, les tarifs et les conditions des abonnements seront précisés avant toute souscription.

Ne pas publier cette dernière phrase comme substitut aux conditions réelles : remplacer ce paragraphe par les offres Apple approuvées, leur durée, le renouvellement, l'essai éventuel et les liens nécessaires avant soumission. Ne pas promettre de coaching humain individuel, de replay, d'Apple Health, de résultats chiffrés ou de conversation IA illimitée.

## Captures à produire sur la version finale

Utiliser exclusivement un compte de démonstration autorisé et des médias COAI validés. Aucun nom, photo ou résultat personnel réel. Aucune maquette présentée comme une capture de l'application.

1. Accueil : prochaine action et navigation principale.
2. Entraînement : exercice avec image et vidéo du même mouvement.
3. Séance : saisie des séries et charges avec minuteur.
4. Nutrition : recette complète et informations réellement disponibles.
5. Récupération : contenu complet accessible.
6. Progrès : historique alimenté par des séances de démonstration.

Capturer les tailles demandées par App Store Connect lorsque la fiche sera accessible. Ne pas utiliser les captures du simulateur montrant des écrans de test ou des données fictives non signalées comme visuels marketing définitifs.

## Notes de revue — trame à compléter, jamais de mot de passe dans Git

- L'application combine une interface SwiftUI et des écrans web WKWebView.
- Expliquer concrètement les fonctions natives : navigation, minuteur et partage de fichiers, après vérification sur le binaire soumis.
- Fournir un compte de revue durable dans les champs privés App Store Connect, avec accès aux fonctions soumises. Ne pas utiliser le compte QA local ni un compte personnel.
- Chemin présent dans le code : Explorer → Abonnement → Restaurer mes achats Apple. La présence de ce bouton ne prouve pas la disponibilité du catalogue Apple de production ni la restauration d'un achat réel.
- Suppression : Explorer → Réglages et déconnexion → Supprimer mon compte → confirmation. L'écran avertit que la suppression du compte ne résilie pas l'abonnement Apple. Annulation, suppression et persistance après relance ont été testées avec un compte jetable sur le backend local et le simulateur ; refaire ces contrôles sur la version distribuée avant soumission.
- Export : Explorer → Réglages et déconnexion → Exporter mes données. Le partage natif et l'enregistrement du JSON dans Fichiers ont été vérifiés sur simulateur avec des données locales de test.
- Maintenir le backend disponible pendant la revue. Ne pas promettre que toutes les fonctionnalités sont natives ou hors ligne.

## Vérification physique du 27 septembre — non validée

La compilation de développement signée pour l'iPhone 17 Pro a réussi. Son profil expire le 1er octobre 2026 ; ce n'est pas une archive de distribution App Store.

Les tentatives de lancement des trois tests physiques (partage de fichiers, colonnes de repos et très gros caractères), dont la relance à 21 h 17, ont été refusées par iOS : certificat développeur non approuvé sur l'appareil. Aucun de ces trois tests n'a donc été exécuté sur l'iPhone. L'approbation dans Réglages → Général → VPN et gestion de l'appareil doit être effectuée par le propriétaire avant une nouvelle tentative. Ne pas contourner cette protection.

Les preuves locales et les captures de test ne constituent pas une validation de production, TestFlight ou App Store. Aucun achat, déploiement ni dépôt Apple n'a été effectué pour ces vérifications.

## Conditions de sortie avant soumission

- [ ] Adhésion et accès de distribution actifs ; contrats traités par Anthony.
- [ ] Catalogue, essai et droits Apple approuvés ; achat et restauration réellement testés.
- [ ] Version signée, archive de distribution et installation TestFlight vérifiées.
- [ ] Dix parcours validés de bout en bout sur la version livrée, y compris suppression.
- [ ] Confidentialité native + web auditée et formulaire Apple cohérent avec les données réellement traitées.
- [ ] Support joignable, informations commerciales exactes, classification d'âge renseignée.
- [ ] Captures réelles finales et compte de revue opérationnel.
- [ ] Retirer les mentions de pilote/test seulement quand les restrictions correspondantes sont levées.

La sauvegarde du code sur GitHub, la compilation unsigned et les tests unitaires ne cochent pas ces conditions à eux seuls. Aucune garantie d'acceptation ou de rentabilité.
