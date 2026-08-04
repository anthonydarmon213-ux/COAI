import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  phoneWhatsapp: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Format international requis, ex: +33612345678")
    .nullable(),
});

export async function PUT(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = parsed.data.phoneWhatsapp
    ? await prisma.user.findUnique({ where: { phoneWhatsapp: parsed.data.phoneWhatsapp } })
    : null;
  if (existing && existing.supabaseAuthId !== authUser.id) {
    return NextResponse.json(
      { error: "Ce numéro WhatsApp est déjà associé à un autre compte." },
      { status: 409 }
    );
  }

  const user = await prisma.user.update({
    where: { supabaseAuthId: authUser.id },
    data: { phoneWhatsapp: parsed.data.phoneWhatsapp },
  });

  return NextResponse.json({ phoneWhatsapp: user.phoneWhatsapp });
}
