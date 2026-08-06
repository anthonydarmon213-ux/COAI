import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Politique de confidentialité — YUMAI" };

export default function ConfidentialitePage() {
  return (
    <LegalPage
      label="RGPD"
      titre="Politique de confidentialité"
      majLe="6 août 2026"
    >
      <section>
        <h2>1. Responsable de traitement</h2>
        <p>
          Le responsable du traitement des données est Anthony Darmon, auto-entrepreneur (SIRET
          53438541400030), 27 rue de Cîteaux, 75012 Paris. Pour toute question relative à tes
          données personnelles :{" "}
          <a href="mailto:anthonydarmon213@hotmail.com">anthonydarmon213@hotmail.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li>Données d&apos;identification : prénom, email, mot de passe (chiffré), téléphone.</li>
          <li>
            Données de profil sportif : objectifs, niveau, équipement disponible, morphologie,
            fréquence d&apos;entraînement, sports pratiqués.
          </li>
          <li>
            Données de santé (catégorie particulière de données) : contraintes de santé,
            antécédents médicaux, qualité du sommeil — renseignées volontairement pour personnaliser
            les programmes.
          </li>
          <li>
            Données de suivi : séances loguées, mesures corporelles, photos de progression que tu
            choisis d&apos;ajouter.
          </li>
          <li>Données de paiement : gérées directement par Stripe, jamais stockées par YUMAI.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités et base légale</h2>
        <p>
          Les données de profil et de santé sont traitées sur la base de ton{" "}
          <strong>consentement explicite</strong>, recueilli à l&apos;inscription, pour générer et
          personnaliser tes programmes d&apos;entraînement, de nutrition et de récupération. Les
          données de compte et de paiement sont traitées pour l&apos;exécution du contrat
          d&apos;abonnement. Tu peux retirer ton consentement à tout moment en supprimant ton
          compte.
        </p>
      </section>

      <section>
        <h2>4. Destinataires des données</h2>
        <p>Tes données peuvent être transmises aux sous-traitants suivants, dans la stricte mesure nécessaire au fonctionnement du service :</p>
        <ul>
          <li>Supabase (hébergement de la base de données et authentification, UE/Frankfurt)</li>
          <li>Vercel (hébergement de l&apos;application)</li>
          <li>Stripe (traitement des paiements)</li>
          <li>Anthropic (génération des programmes par intelligence artificielle — les données de profil sportif et de santé sont transmises pour cette seule finalité, sans être utilisées pour entraîner leurs modèles)</li>
          <li>
            Sentry (suivi technique des erreurs de l&apos;application, UE) — reçoit uniquement des
            informations techniques (message d&apos;erreur, page concernée), jamais tes données de
            profil ou de santé.
          </li>
          <li>
            Le cas échéant, WhatsApp/Twilio si tu actives l&apos;assistant WhatsApp (numéro de
            téléphone uniquement).
          </li>
        </ul>
        <p>Aucune donnée n&apos;est vendue à des tiers à des fins commerciales.</p>
      </section>

      <section>
        <h2>5. Durée de conservation</h2>
        <p>
          Tes données sont conservées pendant toute la durée de ton compte, puis supprimées dans
          un délai raisonnable après suppression de ton compte, sauf obligation légale de
          conservation plus longue (ex. factures).
        </p>
      </section>

      <section>
        <h2>6. Tes droits</h2>
        <p>
          Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, de portabilité et de retrait de ton consentement sur tes données. Tu
          peux exercer ces droits directement et à tout moment depuis ton espace{" "}
          <a href="/compte/parametres">Paramètres</a> : export de toutes tes données au format JSON,
          ou suppression définitive de ton compte. Tu disposes aussi du droit d&apos;introduire une
          réclamation auprès de la CNIL (cnil.fr).
        </p>
      </section>

      <section>
        <h2>7. Sécurité</h2>
        <p>
          Les mots de passe sont chiffrés, les communications sont chiffrées (HTTPS), et
          l&apos;accès à tes données est restreint à ce qui est strictement nécessaire au
          fonctionnement du service.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          YUMAI utilise uniquement des cookies techniques nécessaires à l&apos;authentification
          (session utilisateur). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé.
        </p>
      </section>
    </LegalPage>
  );
}
