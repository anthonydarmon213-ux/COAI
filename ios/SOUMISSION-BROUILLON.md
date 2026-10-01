# COAI — dossier de soumission (brouillon, non publié)

Mise à jour : 1er octobre 2026. Préparation sans frais autorisée par Anthony.
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

COAI Essentiel est proposé par abonnement mensuel ou annuel. Tarifs de référence en France : 19,99 € par mois ou 119 € par an. Le prix applicable est affiché par l'App Store avant confirmation. Un essai gratuit de 7 jours est proposé aux personnes éligibles selon Apple. À la fin de l'essai, l'abonnement se renouvelle automatiquement au prix et à la périodicité choisis, sauf résiliation. Gérez votre abonnement dans les réglages de votre compte Apple.

Conditions : https://coai.fr/cgv — Confidentialité : https://coai.fr/confidentialite

Avant publication, comparer ce brouillon aux produits et essais réellement actifs dans App Store Connect. Le catalogue en code ne prouve pas leur activation. Les pages liées ont été corrigées localement le 28 septembre ; leur publication et leur contrôle en production restent à faire. La conformité juridique complète et le choix des conditions de licence restent à valider. Ne pas promettre de coaching humain individuel, de replay, d'Apple Health, de résultats chiffrés ou de conversation IA illimitée.

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

## Vérification physique — mise à jour du 1er octobre

L’iPhone 17 Pro est de nouveau disponible et déverrouillé. Sur le build Debug
signé actuel, deux tests physiques réussissent dans
`/tmp/coai-physical-navigation-rest-1001.xcresult` : navigation en très grande
taille de texte avec rotation portrait/paysage/portrait (contenu web de test),
et minuteur mis en pause, fermé, relancé, repris puis arrêté (persistance réelle).
Captures inspectées. Cela clôt les deux reprises physiques signalées ci-dessous,
sans valider tous les écrans web en accessibilité ni une archive Release.

Le 1er octobre, navigation des destinations wellness et ouverture/fermeture du
partage PDF du programme ont également réussi sur les pages en ligne. Les
programmes nutrition/récupération du compte restent en attente de relecture.
Le catalogue en ligne échoue au contrôle de fermeture du clavier et conserve
un mouvement exclu localement : déploiement puis retest nécessaires.

Expiration du profil embarqué relue dans le binaire installé :
`2026-10-01T16:39:21Z`, soit 18 h 39 à Paris. Aucun renouvellement ni achat
effectué. Les observations d’indisponibilité suivantes sont historiques.

### Historique du 28 septembre

La compilation de développement signée pour l'iPhone 17 Pro a réussi. Son profil expire le 1er octobre 2026 ; ce n'est pas une archive de distribution App Store.

Le blocage de confiance du certificat observé le 27 septembre a été résolu. Trois tests ont ensuite réussi sur l'iPhone 17 Pro : colonnes du minuteur, partage natif de fichier avec conservation de la page, et disposition du minuteur en très gros caractères. Preuves : `/tmp/coai-physical-confirmed-0928.xcresult` et `/tmp/coai-physical-files-accessibility-0928.xcresult`.

Deux tests restent à reprendre sur l'appareil : navigation avec gros texte et rotation ; persistance du minuteur après relance. Les dernières tentatives ont rencontré une vidéo flottante recouvrant la navigation. Ils passent sur simulateur, ce qui ne remplace pas le contrôle physique. Le dernier contrôle du téléphone demandait son code de déverrouillage. Ces résultats concernent le binaire de développement testé, pas une future archive Release.

Les preuves locales et les captures de test ne constituent pas une validation de production, TestFlight ou App Store. Aucun achat, déploiement ni dépôt Apple n'a été effectué pour ces vérifications.

Contrôle suivant du 28 septembre : CoreDevice indique désormais l'iPhone 17 Pro indisponible. Aucun nouveau test physique exécuté ; reconnecter cet appareil pour reprendre les deux tests, sans remplacer silencieusement l'appareil de validation.

## Informations commerciales — contrôles locaux du 28 septembre

- CGV : offres actuelles Essentiel, Premium Remote et VIP Présentiel ; accompagnements individuels sur devis ; distinction Stripe / Apple ; essai Apple conditionné à l'éligibilité ; lien de gestion et distinction suppression du compte / résiliation.
- Confidentialité : distinction numéros de carte non reçus / références de transaction conservées pour les droits d'accès et la restauration.
- `node scripts/test-ios-legal-pages.cjs` : rendu des pages réelles vérifié hors ligne, tarifs comparés au catalogue Apple approuvé.
- TypeScript, compilation Next.js et tests du catalogue d'exercices réussis ; audit des fichiers média sans fichier manquant ; lint sans erreur (six avertissements préexistants).
- Non publié. Ces vérifications ne valident ni le catalogue Apple distant, ni l'ensemble des clauses juridiques, ni les pages actuellement en production.

## Conditions de sortie avant soumission

Point de contrôle du 1er octobre à 14 h 37 : iPhone 17 Pro disponible, tests
physiques ci-dessus réussis, et une seule identité locale Apple Development
détectée, sans Apple Distribution.
L’adhésion distante n’a pas été vérifiée : l’absence de certificat local ne
permet pas de conclure que le compte Apple n’est pas inscrit. Le build Release
arm64 0.1.0 (1) a été compilé sans signature ; il n’est pas distribuable tel quel.
Les huit tests StoreKit Xcode ont réussi avec serveur simulé, pas dans Sandbox
Apple. Les tarifs ont déjà été approuvés ; ne pas redemander cette décision.
L’export connecté a été revalidé le 1er octobre dans l’app simulée jusque dans
Fichiers, avec contrôle du JSON. Ces éléments ne cochent pas les portes de sortie
ci-dessous : la version distribuée, les services distants et l’appareil restent
à valider. Preuves détaillées dans `APP-STORE-READINESS.md`.

- [ ] Adhésion et accès de distribution actifs ; contrats traités par Anthony.
- [ ] Catalogue, essai et droits Apple approuvés ; achat et restauration réellement testés.
- [ ] Version signée, archive de distribution et installation TestFlight vérifiées.
- [ ] Dix parcours validés de bout en bout sur la version livrée, y compris suppression.
- [ ] Confidentialité native + web auditée et formulaire Apple cohérent avec les données réellement traitées.
- [ ] Support joignable, informations commerciales exactes, classification d'âge renseignée.
- [ ] Captures réelles finales et compte de revue opérationnel.
- [ ] Retirer les mentions de pilote/test seulement quand les restrictions correspondantes sont levées.

La sauvegarde du code sur GitHub, la compilation unsigned et les tests unitaires ne cochent pas ces conditions à eux seuls. Aucune garantie d'acceptation ou de rentabilité.
