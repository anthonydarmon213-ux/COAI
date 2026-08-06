import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Mentions légales — YUMAI" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage label="Informations légales" titre="Mentions légales" majLe="6 août 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site YUMAI (accessible à l&apos;adresse de ce nom de domaine) est édité par :
          <br />
          <strong>Anthony Darmon, auto-entrepreneur</strong>
          <br />
          SIRET : 53438541400030
          <br />
          Adresse : 27 rue de Cîteaux, 75012 Paris
          <br />
          Email de contact :{" "}
          <a href="mailto:anthonydarmon213@hotmail.com">anthonydarmon213@hotmail.com</a>
        </p>
        <p>Directeur de la publication : Anthony Darmon.</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site et l&apos;application sont hébergés par Vercel Inc. (
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
          ). Les données (comptes, profils, programmes) sont stockées par Supabase Inc. (
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>
          ), sur des serveurs situés dans l&apos;Union européenne (Frankfurt, Allemagne).
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, marque YUMAI, logo,
          méthodologie THE METHOD) sont la propriété d&apos;Anthony Darmon, sauf mention contraire.
          Toute reproduction sans autorisation préalable est interdite.
        </p>
      </section>

      <section>
        <h2>Programmes générés par intelligence artificielle</h2>
        <p>
          Les programmes d&apos;entraînement, de nutrition et de récupération proposés sur YUMAI
          sont générés par un système d&apos;intelligence artificielle puis relus et validés par
          Anthony Darmon, coach diplômé d&apos;État, avant d&apos;être présentés comme définitifs à
          l&apos;utilisateur. Ils ne remplacent pas un avis médical : en cas de doute ou de
          pathologie particulière, consulte un professionnel de santé avant de commencer un
          programme.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Pour toute question relative au site ou à l&apos;application :{" "}
          <a href="mailto:anthonydarmon213@hotmail.com">anthonydarmon213@hotmail.com</a>.
        </p>
      </section>
    </LegalPage>
  );
}
