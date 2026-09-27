import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { notifyMakeScenario } from "@/lib/whatsapp/client";

const bodySchema = z.object({
  objectifs: z.string().max(1000).optional(),
  persona: z.string().max(1000).optional(),
  niveau: z.string().max(100).optional(),
  equipementDisponible: z.string().max(1000).optional(),
  lieuEntrainement: z.string().max(200).optional(),
  dureeSeanceMinutes: z.number().int().positive().max(240).optional(),
  contraintesSante: z.string().max(1000).optional(),
  antecedentsMedicaux: z.string().max(2000).optional(),
  tailleCm: z.number().positive().max(300).nullable().optional(),
  poidsKg: z.number().positive().max(400).nullable().optional(),
  age: z.number().int().positive().max(120).nullable().optional(),
  sexe: z.enum(["Homme", "Femme", "Préfère ne pas dire"]).optional(),
  morphologie: z.string().max(50).optional(),
  frequenceEntrainement: z.enum([
    "Jamais",
    "1 fois par semaine",
    "2 fois par semaine",
    "3 fois par semaine",
    "4 fois par semaine",
    "5 fois par semaine",
    "6 fois ou plus par semaine",
  ]).optional(),
  sportsPratiques: z.string().max(1000).optional(),
  habitudesAlimentaires: z.string().max(1000).optional(),
  allergiesAlimentaires: z.string().max(1000).optional(),
  repasParJour: z.string().max(200).optional(),
  hydratation: z.string().max(200).optional(),
  consommationCafe: z.string().max(200).optional(),
  consommationAlcool: z.string().max(200).optional(),
  qualiteSommeil: z.string().max(500).optional(),
  // Cycle menstruel / maternité (14/08/2026) — opt-in explicite, jamais
  // déduit du sexe déclaré. dateDernieresRegles/dateReferenceMaternite
  // arrivent en chaîne ISO depuis le client, converties ici.
  cycleMenstruelSuivi: z.boolean().optional(),
  dateDernieresRegles: z.string().datetime().nullable().optional(),
  dureeCycleJours: z.number().int().min(15).max(60).nullable().optional(),
  reglesDouloureuses: z.boolean().nullable().optional(),
  statutMaternite: z.enum(["ENCEINTE", "POST_PARTUM"]).nullable().optional(),
  dateReferenceMaternite: z.string().datetime().nullable().optional(),
  coachPreference: z.enum(["FULL_IA", "HYBRIDE", "VIP_PRESENTIEL"]).optional(),
});

function profileResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function unavailableResponse() {
  return profileResponse({ error: "Enregistrement indisponible pour le moment. Réessaie dans un instant." }, 503);
}

export async function PUT(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return profileResponse({ error: "Non authentifié" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return profileResponse({ error: "Les informations reçues sont invalides. Réessaie depuis ton profil." }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return profileResponse({ error: parsed.error.flatten() }, 400);
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  } catch {
    // Never expose connection strings or profile values in an error response.
    return unavailableResponse();
  }
  if (!user) {
    return profileResponse({ error: "Profil introuvable" }, 404);
  }

  // dateDernieresRegles/dateReferenceMaternite arrivent en chaîne ISO
  // (zod .datetime() valide déjà le format) — Prisma attend des Date.
  const { dateDernieresRegles, dateReferenceMaternite, ...reste } = parsed.data;
  const data = {
    ...reste,
    ...(dateDernieresRegles !== undefined && { dateDernieresRegles: dateDernieresRegles === null ? null : new Date(dateDernieresRegles) }),
    ...(dateReferenceMaternite !== undefined && { dateReferenceMaternite: dateReferenceMaternite === null ? null : new Date(dateReferenceMaternite) }),
  };

  let profile;
  try {
    profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });
  } catch {
    return unavailableResponse();
  }

  if (user.phoneWhatsapp) {
    await notifyMakeScenario({
      userId: user.id,
      event: "profile_updated",
      data: { phoneWhatsapp: user.phoneWhatsapp, ...parsed.data },
    });
  }

  return profileResponse(profile);
}
