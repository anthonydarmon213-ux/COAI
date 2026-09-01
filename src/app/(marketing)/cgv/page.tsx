import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Conditions générales de vente — COAI",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage label="Contrat" titre="Conditions générales de vente" majLe="27 août 2026">
      <section>
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent les abonnements et achats de programmes numériques COAI proposés par Anthony Darmon, auto-entrepreneur (SIRET 53438541400030). Le diagnostic est offert. Toute commande payante implique l&apos;acceptation des présentes conditions.</p>
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
        <h2>3. Programmes à l&apos;unité — offre rentrée</h2>
        <p>Un utilisateur peut acheter un programme prêt à l&apos;emploi sans souscrire d&apos;abonnement. Le tarif de lancement du pack est de 19€ TTC en paiement unique. Pendant l&apos;offre rentrée affichée sur le site, l&apos;acheteur choisit un second programme distinct offert au moment de la commande. Les deux programmes restent accessibles dans son compte sans renouvellement automatique.</p>
        <p>L&apos;offre s&apos;applique en une seule commande aux deux programmes sélectionnés avant le paiement. Le programme offert n&apos;est ni échangeable contre de l&apos;argent ni cumulable avec un programme déjà détenu.</p>
      </section>
      <section>
        <h2>4. Essai, prix et paiement</h2>
        <p>Les prix sont indiqués en euros toutes taxes comprises. Pass IA et Coaching Hybride comprennent 7 jours d&apos;essai avec moyen de paiement requis. Sauf annulation avant la fin de l&apos;essai, le premier prélèvement est effectué selon le rythme choisi : 19,99€ par mois ou 119€ par an pour Pass IA, 99€ par mois pour Coaching Hybride. VIP est facturé dès la souscription. Les achats à l&apos;unité sont débités immédiatement et ne se renouvellent pas. Les paiements et renouvellements sont traités par Stripe ; COAI ne stocke pas les données bancaires.</p>
      </section>
      <section>
        <h2>5. Durée et résiliation</h2>
        <p>Les formules mensuelles sont renouvelées chaque mois sans durée minimale. Le Pass IA annuel est facturé 119€ pour une période de douze mois et renouvelé annuellement. Le renouvellement peut être annulé à tout moment depuis l&apos;espace personnel ; l&apos;accès reste alors disponible jusqu&apos;à la fin de la période déjà réglée. Aucun remboursement au prorata n&apos;est dû, sauf disposition légale contraire.</p>
      </section>
      <section>
        <h2>6. Séances VIP</h2>
        <p>Les séances incluses correspondent au rythme sélectionné lors de la souscription. Leur date, leur lieu et leur format sont convenus directement avec Anthony Darmon, sous réserve de disponibilité. Les conditions de report ou d&apos;annulation applicables sont communiquées lors de la confirmation du créneau.</p>
      </section>
      <section>
        <h2>7. Accès immédiat et rétractation</h2>
        <p>Avant l&apos;achat d&apos;un programme à l&apos;unité, l&apos;utilisateur demande expressément que la fourniture du contenu numérique commence immédiatement et reconnaît expressément perdre son droit de rétractation dès sa mise à disposition. Sans cet accord, l&apos;achat et l&apos;accès immédiat ne peuvent pas être finalisés. Pour les abonnements, cette disposition ne limite pas la faculté de résilier les périodes futures.</p>
      </section>
      <section>
        <h2>8. Nature du service et santé</h2>
        <p>COAI fournit des recommandations sportives personnalisées à partir des informations déclarées par l&apos;utilisateur. Elles ne constituent ni un diagnostic médical ni un traitement et ne remplacent pas l&apos;avis d&apos;un professionnel de santé. En cas de douleur, pathologie, antécédent ou doute, l&apos;utilisateur doit demander un avis médical avant de pratiquer.</p>
      </section>
      <section>
        <h2>9. Responsabilité et litiges</h2>
        <p>COAI met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantir un résultat sportif. Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.</p>
      </section>
    </LegalPage>
  );
}
