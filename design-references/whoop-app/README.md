# Références design — WHOOP (join.whoop.com)

Captures envoyées par Anthony le 19/08/2026, en référence directe pour le
chantier "Score & Âge COAI façon Whoop" (patch 2 du lot
`coai-5-chantiers-patches.zip`, appliqué le même jour). Anthony : « j'adore ».

Pas des assets à intégrer tels quels dans le produit (marque et contenu
WHOOP) — uniquement une inspiration de direction visuelle/UX pour de
futures cartes du dashboard COAI :

- `01-recovery-sleep-whoop-age.webp` — jauges de zones de sommeil, score de
  performance sommeil (%), "Women's Hormonal Insights" (cycle), "WHOOP Age"
  (âge physiologique vs âge réel), "Pace of Aging".
- `02-recovery-healthspan.webp` — carte "Sommeil, récupération et effort" /
  "Healthspan — Maximisez votre longévité" avec le score WHOOP Age.
- `03-sleep-tracking.webp` — carte "Suivi du sommeil".
- `04-ecg-blood-pressure.webp` — carte "Lecteur cardiaque" (ECG) et
  "Indicateur de tension artérielle (beta)".
- `05-blood-pressure-cycle-tracking.webp` — tension artérielle (beta) et
  "Suivi du cycle menstruel".

Pistes déjà couvertes côté COAI (à date) : Score & Âge COAI (patch 2), suivi
du cycle menstruel (14/08/2026, `src/lib/cycle/phase.ts`). Pistes pas encore
couvertes, à considérer si Anthony veut aller plus loin dans cette direction :
un visuel de type "âge physiologique" mis en avant façon carte premium
(déjà fait), un indicateur de tension artérielle ou une carte santé
cardiaque (aucune donnée de ce type collectée aujourd'hui côté COAI — pas de
capteur/API tiers branché, à cadrer avec Anthony avant d'y toucher).
