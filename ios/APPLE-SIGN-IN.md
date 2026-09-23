# Connexion Apple — préparation du 24 septembre 2026

Statut : implémentation préparée, désactivée par défaut. Pas de connexion
Apple réelle testée, pas de configuration distante ni de publication.

## Parcours retenu

L'application hybride réutilise OAuth Supabase avec PKCE et la session
système ASWebAuthenticationSession. Ce n'est pas une implémentation native
ASAuthorizationAppleIDProvider / signInWithIdToken.
Google et email restent disponibles. Le bouton Apple est rendu uniquement
si NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED vaut exactement true au build.
Cette variable publique ne contient aucun secret et n'active pas le fournisseur.
Un verrou partagé empêche deux démarrages simultanés Apple/Google.
La navigation native conserve les vérifications d'origine, de callback et S256.

## Conditions avant activation

- Configurer les identifiants Apple et le fournisseur Supabase, sans stocker
  de clé privée dans le client ou le dépôt ; aucune configuration faite ici.
- Vérifier les domaines et URL de retour exacts dans les deux services.
- Prévoir la rotation du secret OAuth Apple (six mois selon la documentation
  Supabase) et un responsable pour son renouvellement.
- Tester sur iPhone : première connexion, reconnexion, annulation, erreur,
  retour au bon écran et conservation de session après redémarrage.
- Tester le masquage d'email Apple, l'absence de nom dans le retour OAuth,
  la complétion du profil et les comptes existants Google/email. Ne jamais
  fusionner des comptes uniquement sur une adresse non vérifiée.
- Vérifier la suppression de compte et la révocation des autorisations Apple.
- Contrôler le bouton et l'accessibilité sur petit écran avant publication.

## Preuves locales

- Tests des boutons : fournisseur, drapeau désactivé, verrou partagé,
  erreur/reprise et destination. Fournisseurs simulés, aucune connexion réelle.
- Tests des callbacks natifs Apple : acceptation du PKCE attendu et refus
  des fournisseurs/callbacks non autorisés.
- 44 tests Swift, 65 contrôles de base, compilation Release iPhone non signée.
- TypeScript et lint passent (avertissements existants, aucune erreur).

Ces vérifications ne valent ni validation en production ni acceptation Apple.

Références consultées :
- https://supabase.com/docs/guides/auth/social-login/auth-apple
- https://developer.apple.com/app-store/review/guidelines/#login-services
