// Email "Nouveau lead — diagnostic COAI" (16/08/2026, demande Anthony :
// "je veux avoir plus d'informations sur lui... numéro de téléphone,
// objectifs, score... et pouvoir le contacter par WhatsApp"). Même famille
// que coach-notification.ts (styles inline, sécurité identique : aucune
// donnée de santé, uniquement ce qui aide à qualifier/recontacter le lead).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// wa.me exige des chiffres uniquement (pas de "+"), donc on ne peut pas
// réutiliser buildWhatsAppLink (construit vers LE numéro d'Anthony, statique
// via NEXT_PUBLIC_WHATSAPP_COACH_NUMBER) : ici c'est l'inverse, un lien vers
// le numéro du LEAD pour qu'Anthony lui écrive en premier.
export function buildWhatsAppLinkVersLead(telephone: string, prenomOuEmail: string): string {
  const digits = telephone.replace(/[^\d]/g, "");
  const message = `Bonjour, je viens de voir ton diagnostic COAI (${prenomOuEmail}) — je suis Anthony, coach fondateur de COAI.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildNouveauLeadEmailHtml({
  email,
  telephone,
  score,
  niveauScore,
  objectif,
  activiteQuotidienne,
  objectifPrincipalLibre,
  objectifSecondaire,
  importanceObjectif,
  freinPrincipalLibre,
  attentesCoai,
  echeance,
  evaluation,
  niveau,
  source,
  besoins,
  solutions,
  offreRecommandee,
}: {
  email: string;
  telephone: string | null;
  score: number;
  niveauScore: string;
  objectif: string;
  activiteQuotidienne: string;
  objectifPrincipalLibre: string;
  objectifSecondaire: string;
  importanceObjectif: string;
  freinPrincipalLibre: string;
  attentesCoai: string;
  echeance: string;
  evaluation: string;
  niveau: string;
  source: string;
  besoins: string[];
  solutions: string[];
  offreRecommandee: string;
}): string {
  const whatsappHref = telephone ? buildWhatsAppLinkVersLead(telephone, email) : null;

  const rows: Array<[string, string]> = [
    ["Email", email],
    ["Téléphone", telephone ?? "Non renseigné"],
    ["Score COAI", `${score}/100 — ${niveauScore}`],
    ["Objectif", objectif],
    ["Activité quotidienne", activiteQuotidienne],
    ["Objectif précisé", objectifPrincipalLibre],
    ["Objectif secondaire", objectifSecondaire],
    ["Pourquoi maintenant", importanceObjectif],
    ["Frein principal", freinPrincipalLibre],
    ["Attentes envers COAI", attentesCoai],
    ["Échéance", echeance],
    ["Niveau", niveau],
    ["Évaluation physique", evaluation],
    ["Source", source],
    ["Offre recommandée", offreRecommandee],
  ];

  return `
<div style="background:#0b0c0d;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#141618;border:1px solid rgba(201,162,98,0.3);border-radius:16px;padding:32px;">
    <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a262;">
      Nouveau lead
    </p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#ffffff;">
      Diagnostic COAI terminé
    </h1>
    <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:28px;">
      ${rows
        .map(
          ([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:#8a8a8a;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;text-align:right;color:#ffffff;">${escapeHtml(value)}</td>
      </tr>`
        )
        .join("")}
    </table>
    <div style="margin:0 0 24px;padding:18px;border-radius:12px;background:#f4f0e8;color:#171817;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6428;">Besoins identifiés</p>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${besoins.map(escapeHtml).join(" · ") || "À préciser lors du premier échange"}</p>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6428;">Solutions à proposer</p>
      <p style="margin:0;font-size:14px;line-height:1.6;">${solutions.map(escapeHtml).join(" · ") || "Diagnostic personnalisé COAI"}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">
      ${
        whatsappHref
          ? `<a href="${whatsappHref}" style="display:inline-block;background:#25d366;color:#0b0c0d;text-decoration:none;font-weight:600;font-size:14px;padding:14px 24px;border-radius:999px;">CONTACTER SUR WHATSAPP</a>`
          : ""
      }
      ${
        telephone
          ? `<a href="tel:${telephone}" style="display:inline-block;background:transparent;border:1px solid #c9a262;color:#c9a262;text-decoration:none;font-weight:600;font-size:14px;padding:13px 24px;border-radius:999px;">APPELER</a>`
          : ""
      }
    </div>
  </div>
</div>`.trim();
}
