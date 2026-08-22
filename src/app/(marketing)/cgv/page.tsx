import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Conditions générales de vente — COAI",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage label="Contrat" titre="Conditions générales de vente" majLe="17 août 2026">
      <section>
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent les abonnements COAI proposés par Anthony Darmon, auto-entrepreneur (SIRET 53438541400030). Le diagnostic est offert. Toute souscription payante implique l&apos;acceptation des présentes conditions.</p>
      </section>
      <section>
        <h2>2. Abonnements proposés</h2>
        <ul>
          <li><strong>Pass IA — 19,99€/mois ou 119€/an</strong> : bilan, programme adaptatif, check-ins, entraînement, nutrition, récupération, suivi des progrès et Coach IA disponible 24h/24.</li>
          <li><strong>Coaching Hybride — 99€/mois</strong> : tous les services Pass IA, complétés par le regard, la supervision et les ajustements d&apos;un coach humain.</li>
          <li><strong>VIP — dès 199€/mois</strong> : tous les services Coaching Hybride et des séances privées mensuelles avec Anthony Darmon, en visio ou à Paris centre. Le tarif est de 199€/mois pour 1 séance, 398€/mois pour 2 séances, 597€/mois pour 3 séances et 796€/mois pour 4 séances. Les créneaux et accompagnements sont volontairement très limités.</li>
        </ul>
        <p>Une transformation privée plus longue ou plus intensive fait l&apos;objet d&apos;un échange préalable et d&apos;une proposition personnalisée. Le détail à jour figure sur la page <a href="/pricing">Tarifs</a>.</p>
      </section>
      <section>
        <h2>3. Essai, prix et paiement</h2>
        <p>Les prix sont indiqués en euros toutes taxes comprises. Pass IA et Coaching Hybride comprennent 7 jours d&apos;essai avec moyen de paiement requis. Sauf résiliation avant la fin de l&apos;essai, la facturation mensuelle débute automatiquement. VIP est facturé dès la souscription. Les paiements et renouvellements sont traités par Stripe ; COAI ne stocke pas les données bancaires.</p>
      </section>
      <section>
        <h2>4. Durée et résiliation</h2>
        <p>Chaque formule est un abonnement mensuel sans engagement de durée, renouvelé automatiquement. Il peut être résilié à tout moment depuis l&apos;espace personnel. La résiliation prend effet à la fin de la période en cours ; aucun remboursement au prorata n&apos;est dû, sauf disposition légale contraire.</p>
      </section>
      <section>
        <h2>5. Séances VIP</h2>
        <p>Les séances incluses correspondent au rythme sélectionné lors de la souscription. Leur date, leur lieu et leur format sont convenus directement avec Anthony Darmon, sous réserve de disponibilité. Les conditions de report ou d&apos;annulation applicables sont communiquées lors de la confirmation du créneau.</p>
      </section>
      <section>
        <h2>6. Accès immédiat et rétractation</h2>
        <p>L&apos;utilisateur demande l&apos;accès immédiat aux fonctionnalités numériques de COAI. Conformément au droit applicable, il reconnaît que les services déjà pleinement exécutés avec son accord peuvent ne plus être éligibles au droit de rétractation. Cette disposition ne limite pas la faculté de résilier l&apos;abonnement pour les périodes futures.</p>
      </section>
      <section>
        <h2>7. Nature du service et santé</h2>
        <p>COAI fournit des recommandations sportives personnalisées à partir des informations déclarées par l&apos;utilisateur. Elles ne constituent ni un diagnostic médical ni un traitement et ne remplacent pas l&apos;avis d&apos;un professionnel de santé. En cas de douleur, pathologie, antécédent ou doute, l&apos;utilisateur doit demander un avis médical avant de pratiquer.</p>
      </section>
      <section>
        <h2>8. Responsabilité et litiges</h2>
        <p>COAI met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantir un résultat sportif. Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.</p>
      </section>
    </LegalPage>
  );
}
