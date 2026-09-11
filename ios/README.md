# COAI — pilote iPhone connecté (préparation technique)

**Pas encore compilé pour iOS, ni testé sur iPhone, ni prêt pour TestFlight/App Store.**
Le projet remplace la manipulation manuelle décrite dans `ios-prototype/README.md`.
Le prototype historique reste conservé mais n'est pas inclus dans la cible iOS.

## Périmètre de ce premier lot

- Projet Xcode `COAI.xcodeproj`, schéma partagé COAI, cible iPhone iOS 16+.
- SwiftUI natif : navigation, menu, confirmations et minuteur de repos persistant.
- WKWebView : réutilisation du parcours COAI existant, sans copie des programmes
  ni nouvelle génération IA. Séance `/programme/entrainement`, RepCount
  `/suivi/repcount`, compte/suppression `/compte/parametres`.
- Le site garde son authentification et ses contrôles d'accès : aucune validation
  coach contournée, aucun abonnement attribué par le client mobile.
- Cookies propres à l'app conservés entre ouvertures ; effacement local proposé
  avec confirmation, distinct de la suppression du compte sur le serveur.
- Lecture vidéo inline configurée, démarrage par action utilisateur. Lecture,
  plein écran, reprise et verrouillage à vérifier sur l'appareil réel.
- Durées de repos en minutes et secondes, échéance conservée sur cet appareil.
  Pas de notification, alerte sonore en arrière-plan ni prescription de repos.
- Gestion de l'échec réseau et bouton de nouvelle tentative sans rejeu de POST.
- Liens extérieurs soumis à confirmation. Pas de pont JavaScript natif, secret
  embarqué, dérogation TLS/ATS ou accès automatique aux capteurs.

**L'interface principale reste web dans ce pilote**, pas une réécriture native
des séances. Ce lot sert à vérifier l'intégration et les limites WebKit avant
de fixer le périmètre final App Store. Le minuteur ne suffit pas à démontrer
à lui seul la conformité à la règle Apple 4.2.

## Achats : gel du pilote, pas un mécanisme de contournement

Les navigations vers `/pricing`, `/compte/abonnement`, `/checkout`,
`/api/stripe` et Stripe sont bloquées. Des règles WKContentRuleList bloquent
aussi les requêtes de ressources/XHR Stripe connues. Le site n'est jamais
chargé si ces règles ne peuvent pas être installées.

Ce gel temporaire ne prouve pas une conformité App Store ni l'absence de tout
autre chemin de facturation futur. Les liens d'achat peuvent encore être visibles
dans les pages web : il faut auditer le parcours réel avant distribution.
Ne pas publier ce pilote comme une app dont les achats seraient fonctionnels.
Ne pas présenter les paiements numériques Stripe du site comme automatiquement
acceptés par Apple. Séparer le contenu numérique des séances individuelles avec
coach, puis faire valider le modèle et les territoires par Anthony avant
développement StoreKit / droits serveur / restauration d'achats.

## Ouvrir / compiler

1. Installer Xcode gratuit depuis le Mac App Store, l'ouvrir et terminer sa
   configuration (licence et composants iOS). Cela ne requiert pas l'adhésion
   payante Apple pour un simulateur.
2. Ouvrir `ios/COAI.xcodeproj`, sélectionner COAI et un simulateur iPhone.
3. Run. Pour un appareil, choisir son équipe dans Signing & Capabilities.
4. `fr.coai.mobile` est un identifiant proposé, **non réservé**. Ne pas saisir
   une équipe ou un certificat appartenant à quelqu'un d'autre.

Tests disponibles depuis la racine :

```sh
bash scripts/check-ios.sh
bash scripts/check-ios.sh --simulator
swift test --package-path ios  # nécessite XCTest fourni avec Xcode
```

Le premier script vérifie la logique Foundation, la syntaxe Swift et les fichiers
de projet, **pas les types UIKit/SwiftUI/WebKit ni le rendu**. `--simulator`
échoue explicitement si Xcode complet manque. Le projet n'ajoute aucune dépendance
payante et ne contient pas de SDK publicitaire natif.

## Tests manuels bloquants avant TestFlight

- Compte de test expressément autorisé : connexion email/mot de passe, relance
  à froid, déconnexion, sessions expirées. Aucun vrai paiement pour tester.
- OAuth Google/Apple et liens email : pas de retour universel configuré dans
  ce lot. Ne pas les déclarer pris en charge ; implémenter et tester le mécanisme
  d'authentification système, les callbacks et Sign in with Apple si requis.
- Séance : bon utilisateur, programme autorisé, médias exacts, vidéo jouable,
  PDF/partage/téléchargement et formulaires clavier. Export PDF natif non implémenté.
- RepCount : enregistrement unique et relecture serveur, pas seulement affichage.
- Suppression compte : annuler puis confirmer sur un compte jetable, vérifier
  serveur et déconnexion ; ne jamais tester en supprimant un client réel.
- Connexion lente/perdue, redirections et liens `_blank`, lectures vidéo externes.
- Achats : navigation, XHR, lien direct, formulaires, redirections, tous les plans.
- Minuteur : fermer la feuille, mettre l'app en arrière-plan, relancer, expiration.
- Petit écran, paysage, clavier, grandes polices, VoiceOver, gestes retour.

## Ce qui manque à une soumission Apple

- Compilation Xcode, tests simulateur/appareil et corrections issues de ces tests.
- Icône App Store 1024, catalogue d'assets et captures d'écran réelles de l'app.
- Audit des données réellement collectées via les pages web, manifestes de
  confidentialité (dont UserDefaults), déclarations App Privacy, tracking/ATT
  si applicable. Aucune déclaration « aucune donnée collectée » ne doit être faite.
- Parcours permissions photo/caméra/micro si conservé : descriptions préparées
  dans Info.plist, mais refus/acceptation et absence de demande au lancement à tester.
- Décision paiements numériques/StoreKit, restauration, reçus et droits serveur.
- Périmètre final apportant une vraie expérience iPhone, pas uniquement un site.
- Compte Apple individuel d'Anthony, bundle enregistré, signature, archive,
  fiche App Store, compte de démonstration pour Apple, TestFlight puis revue.

## État vérifié le 10 septembre 2026

35 contrôles exécutables Foundation réussis (navigation, achats connus, minuteur).
Syntaxe Swift, plist, fichier projet et XML du schéma vérifiables sans Xcode.
`swift test` ne peut pas lancer XCTest avec les seuls Command Line Tools.
Installation de Xcode interrompue par le verrouillage du Mac : aucune compilation
iOS, capture native, installation iPhone, utilisation de compte réel ni soumission.

Références :
- https://developer.apple.com/documentation/webkit/wkwebview/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/programs/enroll/
