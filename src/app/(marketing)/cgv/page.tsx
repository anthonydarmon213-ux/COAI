import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Conditions générales de vente — COAI",
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <LegalPage
      label="Contrat"
      titre="Conditions générales de vente"
      majLe="14 août 2026"
    >
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions générales de vente (CGV) régissent l&apos;accès aux services
          payants proposés sur COAI par Anthony Darmon, auto-entrepreneur (SIRET 53438541400030) —
          qu&apos;il s&apos;agisse d&apos;un achat ponctuel ou d&apos;un abonnement. L&apos;inscription
          elle-même est gratuite. Toute commande ou souscription payante implique
          l&apos;acceptation pleine et entière des présentes CGV.
        </p>
      </section>

      <section>
        <h2>2. Description des offres</h2>
        <ul>
          <li>
            <strong>Impulsion (19€, paiement unique)</strong> — achat ponctuel, sans abonnement
            ni renouvellement, débloquant de façon permanente la génération d&apos;un programme
            d&apos;entraînement, de nutrition et de récupération par intelligence artificielle —
            ce programme n&apos;est pas relu par un coach humain. Inclut aussi le journal de
            séances, le suivi des mesures et les graphiques de progression, déjà accessibles
            gratuitement dès l&apos;inscription.
          </li>
          <li>
            <strong>Transformation (49€/mois ou 490€/an après 7 jours d&apos;essai)</strong> — 7 jours
            d&apos;accès gratuit à compter de la souscription, carte bancaire requise dès la
            souscription ; sauf résiliation avant la fin de ces 7 jours, l&apos;abonnement bascule
            automatiquement sur 49€/mois ou 490€/an selon la périodicité choisie. Inclut le palier Impulsion, la génération d&apos;un
            programme d&apos;entraînement, de nutrition et de récupération par intelligence
            artificielle relu et validé par un coach diplômé d&apos;État, ainsi qu&apos;une
            séance visio individuelle de 30 minutes offerte avec Anthony Darmon (une fois, à
            réserver via WhatsApp) — toute séance supplémentaire relève de l&apos;offre VIP, à la
            séance.
          </li>
          <li>
            <strong>VIP (à la séance)</strong> — coaching individuel avec Anthony Darmon,
            réservé et payé séance par séance, sans abonnement ni engagement : 200€ en présentiel
            (Paris centre, 1h) ou 100€ en visioconférence (1h). Accessible quel que soit le palier
            de l&apos;utilisateur, y compris Impulsion. La réservation se fait directement avec
            Anthony Darmon sur WhatsApp.
          </li>
        </ul>
        <p>
          Pour l&apos;offre Impulsion, l&apos;utilisateur reconnaît, en cochant la case dédiée lors
          de l&apos;achat, demander le début immédiat du service (génération du programme dès le
          paiement confirmé) et renoncer à son droit de rétractation de 14 jours pour ce service
          pleinement exécuté dès sa livraison.
        </p>
        <p>
          Le détail et les tarifs à jour de chaque offre sont consultables sur la page{" "}
          <a href="/pricing">Tarifs</a>.
        </p>
      </section>

      <section>
        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. Impulsion est payée en une
          seule fois par carte bancaire via notre prestataire Stripe, sans renouvellement.
          L&apos;abonnement Transformation est payé par carte bancaire via Stripe, de manière
          récurrente et automatique chaque mois ou chaque année selon la périodicité choisie, à
          la date anniversaire de la souscription. COAI ne stocke aucune
          donnée bancaire : celles-ci sont traitées directement par Stripe. Les séances VIP sont
          réservées directement auprès d&apos;Anthony Darmon et réglées séance par séance, selon
          les modalités communiquées lors de la réservation.
        </p>
      </section>

      <section>
        <h2>4. Durée et résiliation</h2>
        <p>
          Impulsion est un achat ponctuel : il ne donne lieu à aucun renouvellement ni
          prélèvement ultérieur, et n&apos;a donc pas à être résilié. L&apos;abonnement
          Transformation est sans engagement de durée et se renouvelle automatiquement chaque
          mois ou chaque année selon l&apos;option choisie. L&apos;utilisateur peut le résilier à
          tout moment depuis son espace personnel (Mon accompagnement → Gérer mon abonnement). La
          résiliation prend effet à la fin de la période déjà payée ; aucun remboursement au
          prorata n&apos;est effectué pour la période en cours, sauf disposition légale
          contraire. Les séances VIP, payées à l&apos;acte, ne sont pas concernées par cette
          clause.
        </p>
      </section>

      <section>
        <h2>5. Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
          rétractation ne peut être exercé pour les services pleinement exécutés avant la fin du
          délai de rétractation et dont l&apos;exécution a commencé avec l&apos;accord préalable
          exprès du consommateur. En achetant Impulsion ou en souscrivant à l&apos;abonnement
          Transformation, l&apos;utilisateur demande expressément un accès immédiat au service et
          renonce à son droit de rétractation pour la partie du service déjà exécutée. Pour
          Transformation, il conserve la possibilité de résilier à tout moment pour
          l&apos;avenir, comme indiqué à l&apos;article 4 ; Impulsion, entièrement exécuté dès la
          génération du programme, n&apos;est pas concerné par une résiliation future.
        </p>
      </section>

      <section>
        <h2>6. Nature du service</h2>
        <p>
          Les programmes proposés sont générés par intelligence artificielle à partir des
          informations renseignées par l&apos;utilisateur. Pour l&apos;offre Transformation, chaque
          programme est en plus relu et validé par un coach diplômé d&apos;État avant d&apos;être
          considéré comme définitif ; pour l&apos;offre Impulsion, il n&apos;est pas relu par un
          coach humain. Dans tous les cas, ils constituent des recommandations d&apos;entraînement
          et de nutrition à visée sportive, et ne se substituent
          pas à un avis médical. L&apos;utilisateur est seul responsable de vérifier sa condition
          physique auprès d&apos;un professionnel de santé avant de suivre un programme, en
          particulier en cas d&apos;antécédent médical.
        </p>
      </section>

      <section>
        <h2>7. Responsabilité</h2>
        <p>
          COAI met en œuvre les moyens raisonnables pour assurer la disponibilité et la fiabilité
          du service, sans garantie de résultat sportif. La responsabilité de l&apos;éditeur ne
          saurait être engagée en cas d&apos;usage inapproprié du service par l&apos;utilisateur ou
          de non-respect des recommandations de prudence usuelles en matière d&apos;activité
          physique.
        </p>
      </section>

      <section>
        <h2>8. Droit applicable et litiges</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
          sera recherchée avant toute action judiciaire ; à défaut, les tribunaux français
          compétents seront saisis.
        </p>
      </section>
    </LegalPage>
  );
}
