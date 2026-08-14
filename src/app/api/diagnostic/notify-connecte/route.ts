import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { sendAdminNotification } from "@/lib/email/client";

// Notification admin quand un utilisateur déjà connecté refait le
// diagnostic (parcours D — cf. diagnostic-quiz.tsx). Ce cas ne passe pas
// par /api/diagnostic-lead (pas un lead, pas de compte à créer, profil mis
// à jour directement) : jusqu'au 14/08/2026 il n'envoyait donc jamais de
// notification, contrairement au parcours visiteur anonyme — trou signalé
// par Anthony ("je n'ai pas reçu de mail sur le dernier diagnostic
// effectué"). Best-effort, jamais bloquant pour l'affichage du résultat.
export async function POST() {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  await sendAdminNotification(
    "Diagnostic refait — abonné COAI",
    `${user.prenom ? `${user.prenom} (${user.email})` : user.email} vient de refaire son diagnostic depuis son compte.`
  ).catch((err) => console.error("[diagnostic/notify-connecte]", err));

  return NextResponse.json({ ok: true });
}
