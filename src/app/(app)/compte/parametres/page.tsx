import { RgpdActions } from "@/components/compte/rgpd-actions";

export default function ParametresPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Paramètres du compte</h1>
      <RgpdActions />
    </div>
  );
}
