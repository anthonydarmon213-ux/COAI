import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification, sendEmail } from "@/lib/email/client";
import { buildMiniDiagnostic, miniDiagnosticEnTexte, type ReponsesDiagnostic } from "@/lib/diagnostic/mini-diagnostic";
import { trackServerEvent } from "@/lib/analytics/product-events";

const FENETRE_ANTI_DOUBLON_MS = 5 * 60 * 1000;

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
  const diagnostic = buildMiniDiagnostic(parsed.data.reponses as ReponsesDiagnostic);

  await Promise.all([
    // Notifie Anthony à chaque lead capturé sur le diagnostic public — ce
    // trou existait depuis la création du quiz (09/08/2026), jusqu'ici
    // invisible sans requête SQL manuelle (repéré le 10/08 via un test d'un
    // ami d'Anthony).
    sendAdminNotification(
      "Nouveau lead — diagnostic COAI",
      `${parsed.data.email} vient de terminer le diagnostic gratuit sur coai.fr.`
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
