import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification, sendEmail } from "@/lib/email/client";
import {
  AUCUNE_DOULEUR_LABEL,
  buildMiniDiagnostic,
  miniDiagnosticEnTexte,
  type MiniDiagnostic,
  type ReponsesDiagnostic,
} from "@/lib/diagnostic/mini-diagnostic";
import { trackServerEvent } from "@/lib/analytics/product-events";

const FENETRE_ANTI_DOUBLON_MS = 5 * 60 * 1000;

type ReponsesLead = ReponsesDiagnostic & {
  sport?: string[];
  sexe?: string | null;
  age?: number | null;
  tailleCm?: number | null;
  poidsKg?: number | null;
};

function texte(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function liste(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function echapperHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function valeurOuTiret(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "Non renseigné" : String(value);
}

function ligneEmail(label: string, value: string | number | null | undefined): string {
  return `<tr>
    <td style="padding:10px 12px;color:#766f65;font-size:13px;border-bottom:1px solid #eee8de;width:38%;">${echapperHtml(label)}</td>
    <td style="padding:10px 12px;color:#161513;font-size:14px;font-weight:600;border-bottom:1px solid #eee8de;">${echapperHtml(valeurOuTiret(value))}</td>
  </tr>`;
}

function construireNotificationLead(params: {
  leadId: string;
  createdAt: Date;
  email: string;
  reponses: ReponsesLead;
  diagnostic: MiniDiagnostic | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  appUrl: string;
}): { subject: string; text: string; html: string } {
  const { leadId, createdAt, email, reponses, diagnostic, appUrl } = params;
  const objectif = texte(reponses.objectif);
  const niveau = texte(reponses.niveau);
  const personas = liste(reponses.persona);
  const equipements = liste(reponses.equipement);
  const sports = liste(reponses.sport);
  const contraintes = liste(reponses.sante).filter((item) => item !== AUCUNE_DOULEUR_LABEL);
  const source = [params.utmSource, params.utmMedium, params.utmCampaign].filter(Boolean).join(" · ") || "Accès direct";
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(createdAt);
  const adminUrl = `${appUrl.replace(/\/$/, "")}/admin/leads`;
  const score = diagnostic ? `${diagnostic.indiceCoai.score}/100 — ${diagnostic.indiceCoai.niveau}` : "Calcul incomplet";
  const subject = `Nouveau lead COAI${objectif ? ` — ${objectif}` : ""}`;
  const text = [
    "Nouveau diagnostic COAI terminé",
    `Email : ${email}`,
    `Date : ${date}`,
    `Objectif : ${valeurOuTiret(objectif)}`,
    `Niveau : ${valeurOuTiret(niveau)}`,
    `Score COAI : ${score}`,
    `Rythme : ${valeurOuTiret(reponses.frequence)}${reponses.duree ? ` · ${reponses.duree}` : ""}`,
    `Source : ${source}`,
    `Contacter : mailto:${email}`,
    `Voir les leads : ${adminUrl}`,
  ].join("\n");

  const profilRows = [
    ligneEmail("Objectif", objectif),
    ligneEmail("Niveau", niveau),
    ligneEmail("Profil actuel", personas.join(" · ") || null),
    ligneEmail("Rythme souhaité", [reponses.frequence, reponses.duree].filter(Boolean).join(" · ") || null),
    ligneEmail("Lieu", reponses.lieu),
    ligneEmail("Matériel", equipements.join(" · ") || null),
    ligneEmail("Sports pratiqués", sports.join(" · ") || null),
  ].join("");
  const quotidienRows = [
    ligneEmail("Sommeil", reponses.qualiteSommeil),
    ligneEmail("Alimentation", reponses.habitudesAlimentaires),
    ligneEmail("Sexe", reponses.sexe),
    ligneEmail("Âge", reponses.age ? `${reponses.age} ans` : null),
    ligneEmail("Taille", reponses.tailleCm ? `${reponses.tailleCm} cm` : null),
    ligneEmail("Poids", reponses.poidsKg ? `${reponses.poidsKg} kg` : null),
  ].join("");
  const diagnosticRows = diagnostic
    ? diagnostic.pointsATravailler.map((point, index) => {
        const solution = diagnostic.pointsResolus[index];
        return `<tr>
          <td style="padding:12px;vertical-align:top;border-bottom:1px solid #eee8de;color:#5c554c;font-size:13px;line-height:1.5;">${echapperHtml(point)}</td>
          <td style="padding:12px;vertical-align:top;border-bottom:1px solid #eee8de;color:#161513;font-size:13px;line-height:1.5;font-weight:600;">${echapperHtml(solution ?? "Accompagnement personnalisé COAI")}</td>
        </tr>`;
      }).join("")
    : "";
  const actions = diagnostic?.indiceCoai.actions.map((action) =>
    `<li style="margin:0 0 8px;color:#403b34;font-size:14px;line-height:1.5;"><strong>${echapperHtml(action.titre)}</strong> — ${echapperHtml(action.impact)}</li>`
  ).join("") ?? "";

  const html = `<!doctype html>
  <html lang="fr"><body style="margin:0;background:#f2f0eb;font-family:Arial,Helvetica,sans-serif;color:#161513;">
    <div style="display:none;max-height:0;overflow:hidden;">${echapperHtml(email)} — ${echapperHtml(score)}</div>
    <div style="max-width:680px;margin:0 auto;padding:28px 14px;">
      <div style="background:#151513;border-radius:20px 20px 0 0;padding:26px 28px;color:#fff;">
        <div style="color:#d1a85e;font-size:12px;letter-spacing:2px;font-weight:700;">NOUVEAU DIAGNOSTIC COAI</div>
        <h1 style="margin:10px 0 6px;font-family:Georgia,serif;font-size:30px;line-height:1.15;">Un nouveau prospect vient de terminer son diagnostic.</h1>
        <div style="color:#c9c6bf;font-size:13px;">${echapperHtml(date)} · ${echapperHtml(source)}</div>
      </div>
      <div style="background:#fff;padding:26px 28px;border-radius:0 0 20px 20px;box-shadow:0 12px 34px rgba(30,27,22,.08);">
        <div style="background:#f8f5ee;border:1px solid #e8dcc6;border-radius:16px;padding:18px;margin-bottom:22px;">
          <div style="font-size:13px;color:#766f65;margin-bottom:5px;">CONTACT</div>
          <a href="mailto:${echapperHtml(email)}" style="color:#161513;font-size:18px;font-weight:700;text-decoration:none;word-break:break-all;">${echapperHtml(email)}</a>
          <div style="margin-top:16px;">
            <a href="mailto:${echapperHtml(email)}?subject=${encodeURIComponent("Ton diagnostic COAI")}" style="display:inline-block;background:#d1a85e;color:#111;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;margin:0 8px 8px 0;">Envoyer un email</a>
            <a href="${echapperHtml(adminUrl)}" style="display:inline-block;background:#fff;color:#161513;text-decoration:none;font-weight:700;padding:11px 18px;border:1px solid #cfc8bc;border-radius:999px;">Voir la fiche lead</a>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:22px;">
          <div style="flex:1;background:#151513;color:#fff;border-radius:16px;padding:18px;">
            <div style="color:#d1a85e;font-size:12px;letter-spacing:1px;">SCORE COAI</div>
            <div style="font-family:Georgia,serif;font-size:28px;margin-top:6px;">${echapperHtml(score)}</div>
          </div>
          <div style="flex:1;background:#eef4f5;border-radius:16px;padding:18px;">
            <div style="color:#5f7074;font-size:12px;letter-spacing:1px;">OBJECTIF</div>
            <div style="font-family:Georgia,serif;font-size:21px;margin-top:6px;">${echapperHtml(valeurOuTiret(objectif))}</div>
          </div>
        </div>

        <h2 style="font-family:Georgia,serif;font-size:21px;margin:24px 0 10px;">Son profil</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eee8de;border-radius:12px;overflow:hidden;">${profilRows}</table>

        <h2 style="font-family:Georgia,serif;font-size:21px;margin:24px 0 10px;">Mode de vie et données déclarées</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eee8de;border-radius:12px;overflow:hidden;">${quotidienRows}</table>

        ${contraintes.length > 0 ? `<div style="margin-top:22px;background:#fff4ed;border-left:4px solid #c96e3f;border-radius:10px;padding:15px 16px;">
          <div style="font-weight:700;color:#8b4425;margin-bottom:5px;">À prendre en compte</div>
          <div style="color:#5c4032;font-size:14px;line-height:1.5;">${echapperHtml(contraintes.join(" · "))}</div>
          <div style="color:#8a766a;font-size:11px;margin-top:7px;">Informations déclarées par le prospect — ne constituent pas un diagnostic médical.</div>
        </div>` : ""}

        ${diagnosticRows ? `<h2 style="font-family:Georgia,serif;font-size:21px;margin:24px 0 10px;">Résultat : freins détectés et réponse COAI</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eee8de;">
          <tr><th style="padding:10px 12px;text-align:left;background:#f5f2ec;color:#766f65;font-size:12px;">AUJOURD'HUI</th><th style="padding:10px 12px;text-align:left;background:#f5f2ec;color:#766f65;font-size:12px;">AVEC COAI</th></tr>
          ${diagnosticRows}
        </table>` : ""}

        ${actions ? `<h2 style="font-family:Georgia,serif;font-size:21px;margin:24px 0 10px;">Leviers prioritaires</h2><ul style="padding-left:20px;margin:0;">${actions}</ul>` : ""}

        <div style="text-align:center;margin-top:28px;">
          <a href="mailto:${echapperHtml(email)}?subject=${encodeURIComponent("Ton diagnostic COAI")}" style="display:inline-block;background:#d1a85e;color:#111;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;">Contacter ce prospect</a>
        </div>
        <div style="margin-top:22px;text-align:center;color:#999188;font-size:11px;">Lead ${echapperHtml(leadId)} · Source ${echapperHtml(source)}</div>
      </div>
    </div>
  </body></html>`;

  return { subject, text, html };
}

// CTA adapté au statut réel du destinataire (Phase 5.1, 11/08/2026) — cette
// route est appelée avant tout compte (lead anonyme), mais la même adresse
// email peut déjà correspondre à un compte existant (re-fait le diagnostic
// sans être connecté, par exemple). Toujours "prospect" par défaut : le cas
// de loin le plus fréquent, et le seul qui ne nécessite pas de requête
// supplémentaire.
async function resoudreCta(email: string): Promise<{ label: string; href: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { label: "Voir mes formules", href: "/pricing" };

  const aUnProgramme = await prisma.programmeGenerated.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (aUnProgramme) return { label: "Voir mon programme", href: "/programme/entrainement" };

  return { label: "Compléter mon profil", href: "/compte/profil" };
}

const bodySchema = z.object({
  email: z.string().email().max(320),
  reponses: z.record(z.unknown()),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
});

// Capture le lead sur /diagnostic (quiz public, visiteur anonyme) juste
// avant de révéler l'aperçu personnalisé — pas d'authentification requise
// par nature (personne n'a encore de compte à ce stade). Best-effort côté
// appelant : ne doit jamais bloquer l'affichage du résultat si ça échoue.
export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-vercel-id");
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await prisma.diagnosticLead.create({
    data: {
      email: parsed.data.email,
      reponses: parsed.data.reponses as Prisma.InputJsonValue,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      utmContent: parsed.data.utmContent,
      utmTerm: parsed.data.utmTerm,
    },
  });

  // Best-effort, chacun dans son propre try/catch : un échec de l'un ne doit
  // jamais faire échouer l'autre ni la réponse 201 déjà acquise (bug latent
  // corrigé le 11/08/2026 : un seul Promise.all groupant les deux pouvait
  // faire tomber toute la route en 500 si l'un des deux rejetait, malgré le
  // lead déjà écrit en base). Toujours attendus avant de répondre : une
  // fonction serverless Vercel peut être suspendue juste après l'envoi de la
  // réponse, un "fire and forget" après le retour n'a aucune garantie
  // d'exécution complète.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
  const reponses = parsed.data.reponses as ReponsesLead;
  const diagnostic = buildMiniDiagnostic(reponses);
  const notificationLead = construireNotificationLead({
    leadId: lead.id,
    createdAt: lead.createdAt,
    email: parsed.data.email,
    reponses,
    diagnostic,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    appUrl,
  });

  await Promise.all([
    // Notifie Anthony à chaque lead capturé sur le diagnostic public — ce
    // trou existait depuis la création du quiz (09/08/2026), jusqu'ici
    // invisible sans requête SQL manuelle (repéré le 10/08 via un test d'un
    // ami d'Anthony).
    sendAdminNotification(
      notificationLead.subject,
      notificationLead.text,
      notificationLead.html
    ).then((delivery) => {
      console.log(JSON.stringify({
        level: delivery.emailSent || delivery.pushSent ? "info" : "error",
        message: "diagnostic_admin_notification",
        requestId,
        leadId: lead.id,
        ...delivery,
      }));
    }).catch((err) => console.error(JSON.stringify({
      level: "error",
      message: "diagnostic_admin_notification_failed",
      requestId,
      leadId: lead.id,
      error: err instanceof Error ? err.message : String(err),
    }))),

    // Envoie aussi le diagnostic à la personne elle-même — CTA final adapté
    // à son statut réel (prospect / abonné profil incomplet / abonné avec
    // programme, Phase 5.1 11/08/2026). Protection anti-doublon : ne renvoie
    // pas l'email si la même adresse en a déjà reçu un il y a moins de 5 min
    // (double-clic, retry réseau côté client) — un nouveau diagnostic plus
    // tard (résultats différents) reste un envoi légitime, jamais bloqué.
    (async () => {
      try {
        if (!diagnostic) return;

        const recent = await prisma.diagnosticLead.findFirst({
          where: {
            email: parsed.data.email,
            id: { not: lead.id },
            resultEmailSentAt: { not: null, gte: new Date(Date.now() - FENETRE_ANTI_DOUBLON_MS) },
          },
          select: { id: true },
        });
        if (recent) return;

        const cta = await resoudreCta(parsed.data.email);
        const envoye = await sendEmail(
          parsed.data.email,
          "Ton diagnostic COAI",
          miniDiagnosticEnTexte(diagnostic, appUrl, cta)
        );
        if (envoye) {
          await prisma.diagnosticLead.update({
            where: { id: lead.id },
            data: { resultEmailSentAt: new Date() },
          });
          trackServerEvent("diagnostic_email_sent", null, { email: parsed.data.email });
        }
      } catch (err) {
        console.error("[diagnostic-lead] envoi email résultat :", err);
      }
    })(),
  ]);

  console.log(JSON.stringify({
    level: "info",
    message: "diagnostic_lead_saved",
    requestId,
    leadId: lead.id,
    durationMs: Date.now() - startedAt,
  }));
  return NextResponse.json(lead, { status: 201 });
}
