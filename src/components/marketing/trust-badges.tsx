import { Badge } from "@/components/ui/badge";

// Réassurance factuelle regroupée (11/08/2026) — chaque item reprend un
// fait déjà écrit ailleurs sur le site (CGV, confidentialité, pricing),
// jamais une promesse nouvelle. Volontairement PAS de "satisfait ou
// remboursé" : les CGV excluent explicitement le remboursement au prorata
// et la rétractation sur la période d'essai déjà consommée (cf.
// /cgv#resiliation) — en ajouter un ici contredirait le contrat.
const ITEMS = [
  "Sans engagement",
  "Résiliable à tout moment",
  "Coach diplômé d'État",
  "Paiement sécurisé (Stripe)",
  "Données hébergées en UE (RGPD)",
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => (
        <Badge key={item} tone="success">
          {item}
        </Badge>
      ))}
    </div>
  );
}
