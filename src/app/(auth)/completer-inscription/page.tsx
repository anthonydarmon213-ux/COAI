import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { CompleterInscriptionForm } from "@/components/auth/completer-inscription-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Étape obligatoire après une première connexion via Google (ou tout futur
// provider OAuth) : la ligne User applicative n'existe pas encore tant que
// les consentements RGPD/santé n'ont pas été recueillis explicitement.
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

  // Intention Transformation posée en cookie sur /sign-up avant le départ
  // vers Google (cf. intended-plan-cookie.ts) — lue ici côté serveur pour
  // éviter tout flash de contenu au premier rendu.
  const planInitial: "GRATUIT" | "STANDARD" = cookies().get("coai_plan")?.value === "STANDARD" ? "STANDARD" : "GRATUIT";
  const billingInitial: "MONTHLY" | "ANNUAL" = cookies().get("coai_billing")?.value === "ANNUAL" ? "ANNUAL" : "MONTHLY";

  return (
    <main className="bg-lab-grid flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Dernière étape</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">
            Finalise ton compte
          </h1>
          <p className="text-sm text-graphite-400">{authUser.email}</p>
        </div>
        <CompleterInscriptionForm prenomSuggere={prenomSuggere} planInitial={planInitial} billingInitial={billingInitial} />
      </Card>
    </main>
  );
}
