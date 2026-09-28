import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Conditions générales de vente — COAI",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage label="Contrat" titre="Conditions générales de vente" majLe="28 septembre 2026">
      <section>
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent les abonnements COAI proposés par Anthony Darmon, auto-entrepreneur (SIRET 53438541400030). Le diagnostic est offert. Toute souscription payante implique l&apos;acceptation des présentes conditions.</p>
      </section>
      <section>
        <h2>2. Offres proposées</h2>
        <ul>
          <li><strong>COAI Essentiel</strong> : bilan, programme adaptatif, check-ins, entraînement, nutrition, récupération, suivi des progrès et Coach IA. Les tarifs et périodes disponibles sont présentés avant la souscription.</li>
          <li><strong>Premium Remote</strong> : accompagnement individuel à distance sur devis. Le prix, la durée, le suivi inclus et les modalités de paiement sont précisés dans le devis avant engagement.</li>
          <li><strong>VIP Présentiel</strong> : accompagnement individuel en présentiel sur devis. Le prix, la durée, le rythme des séances et les modalités de paiement sont convenus avant le démarrage, sous réserve de disponibilité.</li>
        </ul>
        <p>Une transformation privée plus longue ou plus intensive fait l&apos;objet d&apos;un échange préalable et d&apos;une proposition personnalisée. Le détail à jour figure sur la page <a href="/pricing">Tarifs</a>.</p>
      </section>
      <section>
        <h2>3. Essai, prix et paiement</h2>
        <p>Les prix destinés aux particuliers sont indiqués en euros toutes taxes comprises. Pour un abonnement souscrit sur le site, les paiements et renouvellements sont traités par Stripe. La formule, la périodicité et les éventuelles conditions d&apos;essai sont indiquées avant la confirmation du paiement. Les accompagnements sur devis suivent les modalités de paiement précisées dans le devis accepté.</p>
        <p>Dans l&apos;application iOS, lorsqu&apos;un abonnement COAI Essentiel est proposé à l&apos;achat, le paiement et le renouvellement sont gérés par Apple. Les tarifs de référence en France sont de 19,99 € par mois ou 119 € par an. Le prix effectivement applicable et la période choisie sont affichés par l&apos;App Store avant confirmation. L&apos;essai gratuit de 7 jours est proposé uniquement lorsque ton éligibilité est confirmée par Apple ; à son terme, l&apos;abonnement se renouvelle au prix et à la périodicité affichés, sauf résiliation.</p>
        <p>COAI ne stocke pas les numéros de carte bancaire. Des références de transaction et l&apos;état de l&apos;abonnement sont utilisés pour vérifier ton accès au service.</p>
      </section>
      <section>
        <h2>4. Durée et résiliation</h2>
        <p>Les abonnements se renouvellent automatiquement selon la périodicité choisie et affichée avant confirmation. Un abonnement souscrit sur le site se gère depuis l&apos;espace personnel. Un abonnement souscrit auprès d&apos;Apple se gère dans les réglages du compte Apple, ou depuis <a href="https://apps.apple.com/account/subscriptions">Gérer les abonnements Apple</a>. La durée des accompagnements individuels est précisée dans leur devis.</p>
        <p>La résiliation arrête les renouvellements futurs ; l&apos;accès reste ouvert jusqu&apos;à la fin de la période en cours selon les conditions de l&apos;offre. La suppression du compte COAI ne résilie pas un abonnement Apple : il faut gérer celui-ci séparément dans Apple. Les demandes de remboursement d&apos;un achat Apple sont traitées par Apple, sans préjudice des droits légaux applicables.</p>
      </section>
      <section>
        <h2>5. Séances VIP</h2>
        <p>Les séances incluses correspondent au rythme convenu dans le devis. Leur date, leur lieu et leur format sont convenus directement avec Anthony Darmon, sous réserve de disponibilité. Les conditions de report ou d&apos;annulation applicables sont communiquées avant engagement.</p>
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
