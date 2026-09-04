import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification, sendEmail } from "@/lib/email/client";
import { buildUnsubscribeLink } from "@/lib/email/unsubscribe";

const bodySchema = z.object({
  email: z.string().email().max(320),
  prenom: z.string().trim().max(80).optional(),
  objectif: z.string().trim().max(180).optional(),
  themes: z.array(z.string().trim().min(2).max(80)).min(1).max(8).default([]),
  offresInteressees: z.array(z.string().trim().min(2).max(100)).min(0).max(8).default([]),
  consentMarketing: z.boolean(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    email,
    prenom,
    objectif,
    themes,
    offresInteressees,
    consentMarketing,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  } = parsed.data;

  const payload = {
    type: "NEWSLETTER",
    source: "landing_newsletter",
    prenom: prenom?.trim() || null,
    objectif: objectif?.trim() || null,
    themes,
    offresInteressees,
    consentMarketing,
  };

  const lead = await prisma.diagnosticLead.create({
    data: {
      email,
      reponses: payload,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    },
  });

  const offreLue = offresInteressees.length > 0 ? offresInteressees.join(" · ") : "(Non précisée)";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
  const themeList = themes.length > 0 ? themes.join(" · ") : "(Aucun thème choisi)";
  const source = parsed.data.utmSource
    ? [parsed.data.utmSource, parsed.data.utmMedium, parsed.data.utmCampaign].filter(Boolean).join(" · ")
    : "Direct (pas de lien traqué)";

  await Promise.all([
    sendAdminNotification(
      "Nouveau lead newsletter COAI",
      [
        `${email} vient de s'inscrire à la newsletter COAI.`,
        `Prénom : ${prenom ?? "Non renseigné"}`,
        `Objectif : ${objectif ?? "Non précisé"}`,
        `Thèmes : ${themeList}`,
        `Offres intéressées : ${offreLue}`,
        `Consentement marketing : ${consentMarketing ? "oui" : "non"}`,
        `Source : ${source}`,
      ].join("\n")
    ).catch((err) => console.error("[newsletter] notification admin :", err)),

    (async () => {
      if (!consentMarketing) return;

      const unsubscribe = buildUnsubscribeLink(appUrl, email);

      const text = [
        `Bonjour ${prenom ? prenom : "à toi"},`,
        "",
        "Merci pour ton inscription à la newsletter COAI.\nTu vas recevoir 1 à 2 emails par semaine pour passer à l'action.",
        "",
        "Voici ce que tu recevras en priorité :",
        "• Des conseils pratiques entraînement, nutrition et récupération, directement appliquables.",
        "• Des explications claires sur nos offres : Pass IA, Coaching Hybride, VIP.",
        "• Des exemples de services : plans, progressions, routines de récupération.",
        "",
        `Ton lien de ressources : ${appUrl}/bilan-forme-gratuit`,
        `Ton point de départ : ${appUrl}/diagnostic`,
        `Nos offres : ${appUrl}/pricing`,
        `${unsubscribe ? `Désabonnement : ${unsubscribe}` : "Pour te désabonner, réponds à cet email."}`,
      ].join("\n");

      const html = [
        `<h2>Bienvenue dans la newsletter COAI</h2>`,
        `<p>Tu vas recevoir des conseils concrets pour progresser : entraînement, nutrition, récupération.</p>`,
        `<p><strong>Contenu de départ :</strong></p>`,
        `<ul>`,
        `<li>Entraînement : format prêt à exécuter</li>`,
        `<li>Nutrition : idées de repas et habitudes solides</li>`,
        `<li>Récupération : mobilité, sommeil, respiration</li>`,
        `</ul>`,
        `<p>Nos offres : <strong>Pass IA</strong> (programme personnalisé), <strong>Coaching Hybride</strong> (ajustement humain), <strong>VIP</strong> (suivi premium).</p>`,
        `<p><a href="${appUrl}/pricing">Voir les accompagnements</a></p>`,
        `${unsubscribe ? `<p><a href="${unsubscribe}">Désabonnement</a></p>` : ""}`,
      ].join("");

      const sent = await sendEmail(email, "Bienvenue dans la newsletter COAI", text, html);
      if (sent) {
        await prisma.diagnosticLead.update({
          where: { id: lead.id },
          data: { resultEmailSentAt: new Date() },
        });
      }
    })().catch((err) => console.error("[newsletter] email de bienvenue :", err)),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
