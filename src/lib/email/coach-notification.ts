// Email "Nouveau programme à valider" envoyé à Anthony (11/08/2026,
// amélioration workflow coach) — remplace l'ancien texte brut pointant vers
// /admin/programmes (liste générale) par un vrai CTA vers la fiche du
// client précis (/admin/clients/[id]), avec les infos essentielles visibles
// sans avoir à cliquer. HTML minimal en styles inline (compatibilité
// clients mail — pas de feuille de style externe, pas de classes Tailwind
// qui ne seraient pas interprétées par Gmail/Apple Mail).
//
// IMPORTANT sécurité (cf. brief Anthony) : aucune donnée de santé ou
// personnelle sensible ici — juste prénom/email (déjà visibles dans les
// notifications existantes), les piliers générés et une date. Le contenu du
// programme lui-même reste uniquement accessible via le lien, derrière
// l'authentification + vérification du rôle admin (cf. /admin/clients/[id]
// et middleware.ts) — jamais dans l'email.
const PILIER_LABEL: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

export function buildProgrammeAValiderEmailHtml({
  utilisateur,
  piliers,
  generatedAt,
  href,
}: {
  utilisateur: string;
  piliers: string[];
  generatedAt: Date;
  href: string;
}): string {
  const piliersLabel = piliers.map((p) => PILIER_LABEL[p] ?? p).join(" · ");
  const dateLabel = generatedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<div style="background:#0b0c0d;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#141618;border:1px solid rgba(201,162,98,0.3);border-radius:16px;padding:32px;">
    <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a262;">
      Espace coach COAI
    </p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#ffffff;">
      Nouveau programme à valider
    </h1>
    <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;color:#8a8a8a;">Utilisateur</td>
        <td style="padding:6px 0;text-align:right;color:#ffffff;">${escapeHtml(utilisateur)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#8a8a8a;">Piliers générés</td>
        <td style="padding:6px 0;text-align:right;color:#ffffff;">${escapeHtml(piliersLabel)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#8a8a8a;">Date</td>
        <td style="padding:6px 0;text-align:right;color:#ffffff;">${escapeHtml(dateLabel)}</td>
      </tr>
    </table>
    <a href="${href}" style="display:inline-block;background:#c9a262;color:#0b0c0d;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:999px;">
      VALIDER LE PROGRAMME
    </a>
  </div>
</div>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
