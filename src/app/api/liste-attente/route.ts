import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide.").transform((email) => email.toLowerCase()),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis." }),
  }),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Informations invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.founderWaitlistEntry.upsert({
    where: { email: parsed.data.email },
    update: { consentAt: new Date() },
    create: {
      email: parsed.data.email,
      consentAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
