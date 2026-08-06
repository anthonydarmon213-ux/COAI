import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Conditions générales de vente — YUMAI" };

export default function CgvPage() {
  return (
    <LegalPage
      label="Contrat"
      titre="Conditions générales de vente"
      majLe="6 août 2026"
    >
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions générales de vente (CGV) régissent l&apos;abonnement aux
          services proposés sur YUMAI par [raison sociale / statut juridique à compléter], édité
          par Anthony Darmon. Toute souscription à un abonnement payant implique l&apos;acceptation
          pleine et entière des présentes CGV.
        </p>
      </section>

      <section>
        <h2>2. Description des offres</h2>
        <ul>
          <li>
            <strong>Gratuit</strong> — accès au journal de séances, au suivi des mesures et aux
            graphiques de progression, sans frais et sans engagement.
          </li>
          <li>
            <strong>Standard (49€/mois)</strong> — inclut le palier Gratuit, ainsi que la
            génération d&apos;un programme d&apos;entraînement, de nutrition et de récupération par
            intelligence artificielle, relu et validé par un coach diplômé d&apos;État.
          </li>
          <li>
            <strong>Premium (199€/mois)</strong> — inclut le palier Standard, ainsi qu&apos;une
            séance mensuelle en présentiel (Paris) ou en visioconférence avec Anthony Darmon.
          </li>
        </ul>
        <p>
          Le détail et les tarifs à jour de chaque offre sont consultables sur la page{" "}
          <a href="/pricing">Tarifs</a>.
        </p>
      </section>

      <section>
        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. Le paiement s&apos;effectue par
          carte bancaire via notre prestataire Stripe, de manière récurrente et automatique chaque
          mois à la date anniversaire de la souscription. YUMAI ne stocke aucune donnée bancaire :
          celles-ci sont traitées directement par Stripe.
        </p>
      </section>

      <section>
        <h2>4. Durée et résiliation</h2>
        <p>
          Les abonnements Standard et Premium sont sans engagement de durée et se renouvellent
          automatiquement chaque mois. L&apos;utilisateur peut résilier à tout moment depuis son
          espace personnel (Mon abonnement → Gérer mon abonnement). La résiliation prend effet à la
          fin de la période déjà payée ; aucun remboursement au prorata n&apos;est effectué pour le
          mois en cours, sauf disposition légale contraire.
        </p>
      </section>

      <section>
        <h2>5. Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
          rétractation ne peut être exercé pour les services pleinement exécutés avant la fin du
          délai de rétractation et dont l&apos;exécution a commencé avec l&apos;accord préalable
          exprès du consommateur. En souscrivant à un abonnement payant, l&apos;utilisateur
          demande expressément un accès immédiat au service et renonce à son droit de
          rétractation pour la période déjà entamée. Il conserve la possibilité de résilier à tout
          moment pour l&apos;avenir, comme indiqué à l&apos;article 4.
        </p>
      </section>

      <section>
        <h2>6. Nature du service</h2>
        <p>
          Les programmes proposés sont générés par intelligence artificielle à partir des
          informations renseignées par l&apos;utilisateur, puis relus et validés par un coach
          diplômé d&apos;État avant d&apos;être considérés comme définitifs. Ils constituent des
          recommandations d&apos;entraînement et de nutrition à visée sportive, et ne se substituent
          pas à un avis médical. L&apos;utilisateur est seul responsable de vérifier sa condition
          physique auprès d&apos;un professionnel de santé avant de suivre un programme, en
          particulier en cas d&apos;antécédent médical.
        </p>
      </section>

      <section>
        <h2>7. Responsabilité</h2>
        <p>
          YUMAI met en œuvre les moyens raisonnables pour assurer la disponibilité et la fiabilité
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
