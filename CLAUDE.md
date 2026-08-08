# Notes stratégiques COAI

Ce fichier sert de mémoire persistante entre les sessions pour les idées et
décisions business d'Anthony (pas de la doc technique — voir README.md pour
ça). Il est lu automatiquement au démarrage de chaque session Claude Code.

## Pistes de croissance / distribution (08/08/2026)

Idées d'Anthony pour élargir la distribution de COAI au-delà des abonnés
particuliers :

- **Coachs indépendants** : leur proposer COAI en marque blanche / outil pour
  gérer leurs propres clients. Cycle de vente court, valide le produit en
  B2B2C avant d'attaquer plus gros.
- **Clubs de sport** : proposer COAI aux clubs pour leurs adhérents. Plus
  lourd à vendre (contrats, plusieurs décideurs, intégration) mais gros
  volume potentiel si ça prend.
- **Levée de fonds bancaire** : peu réaliste en amorçage sans CA — les
  banques ne financent pas ce profil. Cible plus pertinente : business
  angels / VC / BPI France, qui demanderont des métriques (abonnés,
  rétention) qu'on n'a pas encore.
- **Partenaire type Mounir Lagoune** : utile pour visibilité/réseau, mais ce
  type de profil embarque généralement après un minimum de traction, pas
  avant.

**Priorité recommandée** : d'abord obtenir quelques dizaines d'abonnés
payants + une rétention correcte (via coachs indépendants en premier), ce
qui rend ensuite les clubs, les investisseurs et les partenaires beaucoup
plus faciles à convaincre.

## Levée / financement (08/08/2026)

- **Montant recherché** : pas encore arrêté — un chiffre de 150 000 € a été
  mentionné une fois puis retiré (Anthony ne se souvenait pas de l'avoir
  écrit), à reconfirmer avec lui avant de le remettre où que ce soit.
- Utilisation prévue : acquisition (coachs indépendants, campagne),
  développement produit, recrutement d'un second coach validateur.
- Ce qui est proposé en échange reste à définir selon l'interlocuteur
  (participation, intérêts, visibilité croisée, accès réseau).
- Un deck de présentation (COAI-presentation.pptx, 12 slides) a été généré
  pour ces rendez-vous : problème/solution, produit, fondateur, modèle
  économique, marché (chiffres sourcés), positionnement, traction (renvoie
  vers `/admin/business`), stratégie de distribution, demande de
  financement (slide "montant" volontairement laissée en placeholder tant
  que le chiffre n'est pas confirmé). Livré à Anthony, pas versionné dans
  le repo.

## Incidents résolus

- **08/08/2026** — Deux bugs production successifs corrigés et confirmés en
  Sentry : (1) `NotFoundError: removeChild` causé par le conflit
  React/traduction auto du navigateur (fix : `translate="no"` sur `<html>`
  + meta `notranslate`) ; (2) "Cookies can only be modified in a Server
  Action or Route Handler" causé par les callbacks `set`/`remove` non
  protégés dans `src/lib/auth/server.ts` (fix : try/catch, le middleware
  gère déjà la persistance du token rafraîchi).
