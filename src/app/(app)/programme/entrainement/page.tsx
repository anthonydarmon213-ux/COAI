import { PilierPage } from "@/components/programme/pilier-page";

export default function ProgrammeEntrainementPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  return <PilierPage pilierActif="ENTRAINEMENT" premiereSeance={searchParams.onboarding === "1"} />;
}
