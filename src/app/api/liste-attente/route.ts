import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const PROFILE_VALUES = [
  "dirigeant",
  "independant",
  "cadre",
  "sportif",
  "reprise",
  "autre",
] as const;

const bodySchema = z.object({
  firstName: z.string().trim().min(2, "Prénom trop court.").max(80, "Prénom trop long."),
  email: z.string().trim().email("Adresse e-mail invalide.").transform((email) => email.toLowerCase()),
  profile: z.enum(PROFILE_VALUES, {
    errorMap: () => ({ message: "Sélectionne ton profil." }),
  }),
  objective: z.string().trim().min(10, "Précise un peu plus ton objectif.").max(1000, "Objectif trop long."),
  consentRgpd: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis." }),
  }),
  website: z.string().max(0).optional(),
  elapsedMs: z.number().int().min(1500).max(86_400_000),
});

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string | null) {
  if (!ip) return false;

  const now = Date.now();
  const current = attempts.get(ip);

  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof body.website === "string" &&
    body.website.length > 0
  ) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Informations invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.founderWaitlistEntry.upsert({
    where: { email: parsed.data.email },
    update: {
      firstName: parsed.data.firstName,
      profile: parsed.data.profile,
      objective: parsed.data.objective,
      consentAt: new Date(),
    },
    create: {
      firstName: parsed.data.firstName,
      email: parsed.data.email,
      profile: parsed.data.profile,
      objective: parsed.data.objective,
      consentAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
