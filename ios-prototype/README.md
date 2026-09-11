# COAI — prototype SwiftUI

Un projet Xcode de pilote connecté est maintenant préparé dans `../ios/`.
Voir `../ios/README.md` pour son état réel et ses limites. Ce fichier conserve
les instructions du prototype isolé historique, non inclus dans la cible iOS.

Source de prototype, pas une application compilée ou distribuable. iOS 16 minimum.

## Ouvrir

1. Installer Xcode depuis le Mac App Store (non installé sur la machine lors de la préparation).
2. Créer un projet iOS App, SwiftUI / Swift, nommé COAIPrototype.
3. Remplacer les fichiers App et ContentView générés par `COAIPrototype.swift` (un seul point d’entrée `@main`).
4. Choisir un simulateur iPhone et lancer Run. Pour un appareil physique, configurer la signature avec son propre compte Apple.

## Ce qui est implémenté dans la source

- Interface sombre, or et cyan, adaptable avec défilement et tailles de texte système.
- Saisie validée de répétitions et charges, stockage local de séries fictives.
- Minuteur basé sur une échéance (pas sur un compteur suspendu en arrière-plan).
- Feuille de partage native avec mention explicite de démonstration.

## Tests manuels à effectuer sous Xcode

- Compiler pour iPhone ; vérifier petit écran, Dynamic Type, VoiceOver et clavier.
- Refuser valeurs vides, négatives, répétitions décimales ; accepter 0 kg et 12,5 kg.
- Enregistrer une série, relancer l’application : retrouver la série.
- Lancer le minuteur, quitter temporairement l’app : vérifier l’échéance au retour.
- Ouvrir le partage et l’annuler sans publication.

## Non implémenté / non vérifié

Compilation et simulateur non exécutés faute de Xcode complet. Aucune connexion serveur, vidéo, authentification, synchronisation, notification, HealthKit ou achat intégré. Les rubriques préparation et retour au calme sont des espaces de démonstration, pas des conseils d’entraînement. Aucune donnée utilisateur réelle utilisée. Aucun compte développeur payant créé.

Avant une version App Store : définir les API et la connexion mobile, relier les médias validés, tester la synchronisation et la suppression des données, décider du parcours de paiement conforme aux territoires de distribution, puis TestFlight et revue Apple. Ce prototype ne constitue pas une validation de l’architecture finale.
