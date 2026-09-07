import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { profileDepuisReponsesLead } from "@/lib/diagnostic/profile-from-lead";

const bodySchema = z.object({
  consentRgpd: z.boolean(),
  consentSante: z.boolean(),
  prenom: z.string().max(100).optional(),
  parrainageCode: z.string().max(20).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
});

// Appelée par le client juste après un signUp() Supabase Auth réussi :
// crée l'enregistrement User applicatif correspondant, avec l'horodatage
// du consentement RGPD explicite recueilli à l'inscription.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.consentRgpd) {
    return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
  }
  if (!parsed.data.consentSante) {
    return NextResponse.json({ error: "Certification d'aptitude sportive requise" }, { status: 400 });
  }

  // Le code de parrainage n'est jamais bloquant : un code invalide ou
  // expiré ne doit pas empêcher l'inscription, juste ne rattacher à aucun
  // parrain.
  let parraineParId: string | undefined;
  if (parsed.data.parrainageCode) {
    const parrain = await prisma.user.findUnique({
      where: { codeParrainage: parsed.data.parrainageCode.toUpperCase() },
      select: { id: true },
    });
    parraineParId = parrain?.id;
  }

  // Récupération serveur du dernier vrai bilan associé à l'adresse
  // authentifiée. Le pont localStorage reste utile pour une navigation dans
  // le même navigateur, mais ne suffit pas lorsqu'une personne ouvre son
  // email de confirmation sur un autre appareil. On limite la recherche aux
  // 30 derniers jours et le convertisseur ignore les autres types de leads
  // (newsletter, appel découverte, entreprise...).
  const leadsRecents = await prisma.diagnosticLead.findMany({
    where: {
      email: { equals: authUser.email, mode: "insensitive" },
      resultEmailSentAt: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: {
      reponses: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      utmTerm: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const leadAvecProfil = leadsRecents
    .map((lead) => ({ lead, profile: profileDepuisReponsesLead(lead.reponses) }))
    .find((item) => item.profile);

  const user = await prisma.user.upsert({
    where: { supabaseAuthId: authUser.id },
    update: {},
    create: {
      supabaseAuthId: authUser.id,
      email: authUser.email,
      prenom: parsed.data.prenom || undefined,
      consentRgpdAt: new Date(),
      consentSanteAt: new Date(),
      parraineParId,
      utmSource: parsed.data.utmSource ?? leadAvecProfil?.lead.utmSource,
      utmMedium: parsed.data.utmMedium ?? leadAvecProfil?.lead.utmMedium,
      utmCampaign: parsed.data.utmCampaign ?? leadAvecProfil?.lead.utmCampaign,
      utmContent: parsed.data.utmContent ?? leadAvecProfil?.lead.utmContent,
      utmTerm: parsed.data.utmTerm ?? leadAvecProfil?.lead.utmTerm,
    },
  });

  // Jamais d'écrasement : si le profil existe déjà, l'appel idempotent à
  // register ne modifie aucune donnée. Le consentement santé vient d'être
  // explicitement recueilli avant cette copie.
  if (leadAvecProfil?.profile) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ...leadAvecProfil.profile },
    });
  }

  return NextResponse.json(user, { status: 201 });
}
