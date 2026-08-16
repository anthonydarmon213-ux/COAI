import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { sendAdminNotification } from "@/lib/email/client";
import { buildMiniDiagnostic, type ReponsesDiagnostic } from "@/lib/diagnostic/mini-diagnostic";
import { buildWhatsAppLinkVersLead } from "@/lib/email/lead-notification";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const leads = await prisma.diagnosticLead.findMany({
    where: { createdAt: { gte: depuis } },
    orderBy: { createdAt: "desc" },
  });

  if (leads.length === 0) {
    return NextResponse.json({ sent: false, count: 0 });
  }

  const lignes = leads.map((lead, index) => {
    const reponses = lead.reponses as ReponsesDiagnostic;
    const diagnostic = buildMiniDiagnostic(reponses);
    const objectif = typeof reponses.objectif === "string" ? reponses.objectif : "Non renseigné";
    const source = lead.utmSource
      ? [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" · ")
      : "Direct";
    return [
      `${index + 1}. ${lead.email}`,
      `Téléphone : ${lead.telephone ?? "non renseigné"}`,
      `Objectif : ${objectif}`,
      `Score : ${diagnostic ? `${diagnostic.indiceCoai.score}/100` : "non calculé"}`,
      `Besoins : ${diagnostic?.pointsATravailler.slice(0, 2).join(" · ") || "à préciser"}`,
      `Solutions : ${diagnostic?.pointsResolus.slice(0, 2).join(" · ") || "diagnostic COAI"}`,
      `Source : ${source}`,
    ].join("\n");
  });

  const text = `Récapitulatif des nouveaux leads COAI des dernières 24 h : ${leads.length}\n\n${lignes.join("\n\n")}`;
  const htmlRows = leads
    .map((lead) => {
      const reponses = lead.reponses as ReponsesDiagnostic;
      const diagnostic = buildMiniDiagnostic(reponses);
      const objectif = typeof reponses.objectif === "string" ? reponses.objectif : "Non renseigné";
      const source = lead.utmSource
        ? [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" · ")
        : "Direct";
      const whatsapp = lead.telephone ? buildWhatsAppLinkVersLead(lead.telephone, lead.email) : null;
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e9e3d8;vertical-align:top">
          <strong style="color:#171817">${escapeHtml(lead.email)}</strong><br>
          <span style="color:#6b6b66;font-size:13px">${escapeHtml(lead.telephone ?? "Téléphone non renseigné")}</span>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e9e3d8;vertical-align:top;color:#4f514c;font-size:13px">
          ${escapeHtml(objectif)}<br>${diagnostic ? `Score ${diagnostic.indiceCoai.score}/100` : ""}<br>
          ${diagnostic ? `<strong>Besoins :</strong> ${escapeHtml(diagnostic.pointsATravailler.slice(0, 2).join(" · ") || "À préciser")}<br><strong>Solutions :</strong> ${escapeHtml(diagnostic.pointsResolus.slice(0, 2).join(" · ") || "Diagnostic COAI")}<br>` : ""}
          ${escapeHtml(source)}
        </td>
        <td style="padding:14px 0 14px 12px;border-bottom:1px solid #e9e3d8;text-align:right;vertical-align:top">
          ${whatsapp ? `<a href="${whatsapp}" style="color:#171817;font-size:12px;font-weight:700">WhatsApp</a>` : ""}
        </td>
      </tr>`;
    })
    .join("");

  const html = `<div style="background:#f4f0e8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:680px;margin:auto;background:#fff;border:1px solid #e1d8c8;border-radius:18px;padding:30px">
      <p style="margin:0;color:#9a7130;font-size:11px;letter-spacing:.15em;text-transform:uppercase">COAI · Conciergerie commerciale</p>
      <h1 style="margin:10px 0 6px;color:#171817;font-size:24px">${leads.length} nouveau${leads.length > 1 ? "x" : ""} lead${leads.length > 1 ? "s" : ""}</h1>
      <p style="margin:0 0 20px;color:#6b6b66;font-size:14px">Récapitulatif des dernières 24 heures</p>
      <table role="presentation" style="width:100%;border-collapse:collapse">${htmlRows}</table>
    </div>
  </div>`;

  await sendAdminNotification(`Récap COAI — ${leads.length} nouveau${leads.length > 1 ? "x" : ""} lead${leads.length > 1 ? "s" : ""}`, text, html);
  return NextResponse.json({ sent: true, count: leads.length });
}
