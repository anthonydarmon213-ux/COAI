import { NextResponse } from "next/server";
import { z } from "zod";

const PROFILE_VALUES = [
  "dirigeant",
  "independant",
  "cadre",
  "sportif",
  "reprise",
  "autre",
] as const;

const bodySchema = z
  .object({
    firstName: z.string().trim().min(2, "Prénom trop court.").max(80, "Prénom trop long."),
    email: z.string().trim().email("Adresse e-mail invalide.").transform((email) => email.toLowerCase()),
    phone: z
      .string()
      .trim()
      .max(30, "Numéro de téléphone trop long.")
      .refine(
        (phone) => phone.length === 0 || /^[+\d][\d\s().-]{5,29}$/.test(phone),
        "Numéro de téléphone invalide."
      ),
    profile: z.enum(PROFILE_VALUES, {
      errorMap: () => ({ message: "Sélectionne ton profil." }),
    }),
    objective: z.string().trim().min(10, "Précise un peu plus ton objectif.").max(1000, "Objectif trop long."),
    consentRgpd: z.literal(true, {
      errorMap: () => ({ message: "Le consentement est requis." }),
    }),
    contactConsent: z.boolean(),
    website: z.string().max(0).optional(),
    elapsedMs: z.number().int().min(1500).max(86_400_000),
  })
  .superRefine((data, context) => {
    if (data.phone.length > 0 && !data.contactConsent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactConsent"],
        message: "Autorise le contact par téléphone ou WhatsApp pour renseigner un numéro.",
      });
    }
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    console.error("Configuration Supabase publique manquante.");
    return NextResponse.json(
      { error: "Le service est momentanément indisponible. Réessaie plus tard." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/founder_waitlist_entries`,
      {
        method: "POST",
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${supabasePublishableKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          firstName: parsed.data.firstName,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          profile: parsed.data.profile,
          objective: parsed.data.objective,
          consentAt: new Date().toISOString(),
          contactConsentAt:
            parsed.data.phone && parsed.data.contactConsent ? new Date().toISOString() : null,
        }),
      }
    );

    if (!response.ok) {
      const databaseError = await response.text();

      if (
        response.status === 409 &&
        (databaseError.includes("23505") ||
          databaseError.includes("founder_waitlist_entries_email_key"))
      ) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      console.error("Échec de l'inscription à la liste d'attente.", {
        status: response.status,
        databaseError,
      });
      return NextResponse.json(
        { error: "Impossible d'enregistrer la demande. Réessaie dans un instant." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Erreur inattendue pendant l'inscription à la liste d'attente.", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la demande. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
