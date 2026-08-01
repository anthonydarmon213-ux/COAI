import { NextResponse } from "next/server";

// Webhook Supabase Auth (ex: user.created) : crée l'enregistrement User applicatif
// correspondant à l'identité auth.users nouvellement créée.
export async function POST(request: Request) {
  // TODO: valider la provenance de l'appel (secret partagé Supabase → this route)
  // TODO: créer prisma.user à partir du payload auth.users
  return NextResponse.json({ received: true });
}
