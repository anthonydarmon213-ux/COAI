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

- **Partenariat kiné / diététicienne** (idée du 08/08/2026, à creuser) :
  s'associer avec un kinésithérapeute et une diététicienne pour compléter
  l'offre COAI (aujourd'hui centrée entraînement/nutrition/récupération
  via IA + validation coach) — renforcerait la crédibilité santé et
  ouvrirait des cas d'usage complémentaires (rééducation, suivi
  nutritionnel plus poussé). Détails du modèle (rémunération, intégration
  produit) restent à définir.

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

## Pricing (08/08/2026)

- **Restructuration de l'offre Gratuite en offre d'appel** : au lieu d'un
  palier gratuit illimité, nouvelle inscription = 1 mois offert avec carte
  bancaire obligatoire dès le départ, puis passage automatique à 9€/mois
  (produit Stripe `COAI gratuit`, price `price_1U277IAPYODLq9KTSpX3vjKC`).
  Palier Premium (STANDARD, 49€/mois) inchangé. Décision prise sans
  abonnés gratuits existants à migrer (aucun abonné au moment du
  changement), donc pas de logique de bascule à gérer pour l'historique.
- Palier "Premium+" (199€/mois, self-serve) ajouté puis retiré le jour
  même sur demande d'Anthony — le produit Stripe `COAI Premium` à 199€ a
  été archivé (renommage `COAI standard` → `COAI Premium` fait par Anthony
  pour la clarté du dashboard Stripe, sans lien avec le nom affiché côté
  site qui reste piloté par `price_id`, pas par le nom du produit).
- Case de consentement dédiée ajoutée au flow d'inscription (RGPD +
  aptitude sportive existaient déjà) : reconnaissance des conditions de
  l'offre (1 mois puis 9€/mois) + renonciation au droit de rétractation de
  14 jours pour la partie du service consommée pendant le mois offert.
  Texte rédigé par Claude, **pas relu par un juriste** — à faire valider
  avant que le volume d'inscriptions grossisse.
- Reste à activer côté Stripe (Réglages → Emails clients) : l'email
  automatique de rappel avant la fin de l'essai, pour réduire les litiges
  et donner une vraie visibilité aux futurs abonnés avant le prélèvement.
- Résiliation : repose sur le portail Stripe existant (`PortalButton`) —
  à vérifier qu'il respecte bien l'obligation légale française de
  résiliation en 3 clics (juin 2023) une fois que des abonnés réels
  passeront par ce flow.

## Incidents résolus

- **08/08/2026** — Deux bugs production successifs corrigés et confirmés en
  Sentry : (1) `NotFoundError: removeChild` causé par le conflit
  React/traduction auto du navigateur (fix : `translate="no"` sur `<html>`
  + meta `notranslate`) ; (2) "Cookies can only be modified in a Server
  Action or Route Handler" causé par les callbacks `set`/`remove` non
  protégés dans `src/lib/auth/server.ts` (fix : try/catch, le middleware
  gère déjà la persistance du token rafraîchi).
