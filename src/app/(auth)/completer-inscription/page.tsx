import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { CompleterInscriptionForm } from "@/components/auth/completer-inscription-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Étape obligatoire après une première authentification réussie — Google
// OAuth, ou email/mot de passe une fois le lien de confirmation cliqué
// (14/08/2026, cf. sign-up/page.tsx) : la ligne User applicative n'existe
// pas encore tant que les consentements RGPD/santé n'ont pas été recueillis
// explicitement. prenomSuggere lit `given_name` dans les métadonnées
// utilisateur Supabase, renseigné par Google ou par sign-up/page.tsx selon
// le point d'entrée. Nouveau modèle d'accès libre (13/08/2026) : plus de
// plan à connaître ici, l'inscription est gratuite quel que soit le point
// d'entrée.
export default async function CompleterInscriptionPage() {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    redirect("/sign-in");
  }

  const existing = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (existing) {
    redirect("/dashboard");
  }

  const prenomSuggere =
    (authUser.user_metadata?.given_name as string | undefined) ??
    (authUser.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "";

  return (
    <main className="coai-access-page flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Dernière étape</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">
            Finalise ton compte
          </h1>
          <p className="text-sm text-graphite-400">{authUser.email}</p>
        </div>
        <CompleterInscriptionForm prenomSuggere={prenomSuggere} />
      </Card>
    </main>
  );
}
