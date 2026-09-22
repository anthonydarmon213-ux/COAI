import { PilierPage } from "@/components/programme/pilier-page";

export default async function ProgrammeEntrainementPage(
  props: {
    searchParams: Promise<{ onboarding?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <PilierPage pilierActif="ENTRAINEMENT" premiereSeance={searchParams.onboarding === "1"} />;
}
