"use client";

export type SeanceCheckinValeurs = {
  difficulte?: number;
  energie?: number;
  douleur?: "AUCUNE" | "LEGERE" | "IMPORTANTE";
  douleurZone?: string;
};

export function SeanceCheckin({ value, onChange, disabled = false }: {
  value: SeanceCheckinValeurs;
  onChange: (value: SeanceCheckinValeurs) => void;
  disabled?: boolean;
}) {
  const selectClass = "mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-abysse px-3 text-sm text-white";
  return (
    <fieldset disabled={disabled} className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 p-4 text-left disabled:opacity-60">
      <legend className="px-2 text-sm font-semibold text-laiton-200">Ton bilan rapide · facultatif</legend>
      <p className="text-xs text-graphite-300">Ces repères complètent ton suivi. Tu peux aussi terminer sans répondre.</p>
      <label className="block text-sm text-graphite-200">
        Difficulté de la séance
        <select className={selectClass} value={value.difficulte ?? ""} onChange={(e) => onChange({ ...value, difficulte: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Non renseignée</option>
          {["Très facile", "Facile", "Modérée", "Difficile", "Très difficile"].map((label, i) => <option key={label} value={i + 1}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm text-graphite-200">
        Énergie après la séance
        <select className={selectClass} value={value.energie ?? ""} onChange={(e) => onChange({ ...value, energie: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Non renseignée</option>
          {["À plat", "Basse", "Moyenne", "Bonne", "En forme"].map((label, i) => <option key={label} value={i + 1}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm text-graphite-200">
        Douleur pendant la séance
        <select className={selectClass} value={value.douleur ?? ""} onChange={(e) => onChange({ ...value, douleur: (e.target.value || undefined) as SeanceCheckinValeurs["douleur"], douleurZone: undefined })}>
          <option value="">Non renseignée</option>
          <option value="AUCUNE">Aucune</option>
          <option value="LEGERE">Légère</option>
          <option value="IMPORTANTE">Importante</option>
        </select>
      </label>
      {(value.douleur === "LEGERE" || value.douleur === "IMPORTANTE") && (
        <label className="block text-sm text-graphite-200">
          Zone concernée · facultatif
          <select className={selectClass} value={value.douleurZone ?? ""} onChange={(e) => onChange({ ...value, douleurZone: e.target.value || undefined })}>
            <option value="">Non renseignée</option>
            {["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"].map((zone) => <option key={zone}>{zone}</option>)}
          </select>
        </label>
      )}
      {value.douleur === "IMPORTANTE" && <p role="status" className="text-sm text-amber-200">Ne force pas sur une douleur importante. Demande un avis professionnel avant de reprendre le mouvement concerné.</p>}
    </fieldset>
  );
}
