import { FonctionnalitesMenu } from "@/components/fonctionnalites/fonctionnalites-menu";
import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, getMembershipLabel, hasPaidSubscription } from "@/lib/subscription/plan";

export default async function FonctionnalitesPage() {
  const user = await getCurrentAppUser();

  if (!user) return null;

  return (
    <FonctionnalitesMenu
      plan={getEffectivePlan(user.subscription)}
      hasPaidAccess={hasPaidSubscription(user.subscription)}
      membershipLabel={getMembershipLabel(user.subscription)}
    />
  );
}
