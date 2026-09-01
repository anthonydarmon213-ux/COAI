import { JsonView } from "@/components/programme/json-view";
import Image from "next/image";
import { ContreIndications } from "@/components/programme/contre-indications";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";

import { photoRecuperationPourTexte } from "@/lib/recuperation/photos-recuperation";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function RecuperationView({
  data,
  showContreIndications = false,
  photosParExercice,
  sexe,
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
  sexe?: string | null;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} />;

  const { _source, titre, vueEnsemble, contreIndications, protocoles, jours, ...reste } = data as {
    _source?: string;
    titre?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    protocoles?: Record<string, unknown>[];
    jours?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  void _source;
  const joursUtiles = Array.isArray(jours)
    ? jours.filter((jour) => Object.entries(jour).some(([cle, valeur]) =>
        !["jour", "type", "photoQueryJour"].includes(cle) &&
        valeur !== null && valeur !== undefined && valeur !== "" &&
        (!Array.isArray(valeur) || valeur.length > 0)
      ))
    : [];
  const jourActuel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    timeZone: "Europe/Paris",
  }).format(new Date());
  const normaliser = (texte: string) =>
    texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const recuperationDuJour =
    joursUtiles.find((jour) => normaliser(String(jour.jour ?? "")) === normaliser(jourActuel)) ??
    joursUtiles[0];

  const rendreRecuperation = (jourData: Record<string, unknown>) => {
    const { jour, type, sommeil, photoQueryJour, ...detailJour } = jourData;
    void jour;
    void photoQueryJour;
    void photosParExercice;
    const texteDuJour = [type, sommeil, ...Object.values(detailJour)]
      .filter((v): v is string => typeof v === "string")
      .join(" ");
    const photoJourUrl = photoRecuperationPourTexte(texteDuJour, sexe);

    return (
      <div className="overflow-hidden rounded-2xl border border-laiton-400/25 bg-white/[0.025] shadow-[0_24px_70px_-45px_rgba(201,162,98,0.65)]">
        {photoJourUrl && (
          <div className="relative h-52 overflow-hidden bg-black sm:h-64">
            <Image src={photoJourUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
            <CoaiImageMark />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
                Récupération du jour
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-white">
                {typeof type === "string" ? type : "Prends soin de ton corps"}
              </h3>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {!photoJourUrl && (
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
                Récupération du jour
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-white">
                {typeof type === "string" ? type : "Prends soin de ton corps"}
              </h3>
            </div>
          )}
          {typeof sommeil === "string" && sommeil.trim() && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-laiton-300">Sommeil</p>
              <p className="mt-1.5 text-sm leading-6 text-graphite-200">{sommeil}</p>
            </div>
          )}
          <JsonView data={detailJour} />
        </div>
      </div>
    );
  };

  return (
    <div className="coai-recovery-view flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
      {(titre || vueEnsemble) && (
        <div>
          {titre && <h3 className="font-editorial text-2xl text-graphite-50">{titre}</h3>}
          {vueEnsemble && <p className="mt-2 text-sm leading-6 text-graphite-300">{vueEnsemble}</p>}
        </div>
      )}
      {recuperationDuJour && rendreRecuperation(recuperationDuJour)}

      {Array.isArray(protocoles) && protocoles.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
              Boîte à outils récupération
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">
              Choisis selon ton besoin du jour.
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {protocoles.map((protocole, index) => {
              const nom = typeof protocole.nom === "string" ? protocole.nom : "Récupération";
              const photo = photoRecuperationPourTexte(nom, sexe);
              return (
                <article key={`${nom}-${index}`} className="coai-glass overflow-hidden rounded-2xl">
                  {photo && (
                    <div className="relative">
                      <Image
                        src={photo}
                        alt=""
                        width={900}
                        height={675}
                        className="h-36 w-full object-cover"
                      />
                      <CoaiImageMark />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-display text-base font-semibold text-white">{nom}</h4>
                      {typeof protocole.duree === "string" && (
                        <span className="shrink-0 rounded-full border border-laiton-400/25 bg-laiton-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-laiton-200">
                          {protocole.duree}
                        </span>
                      )}
                    </div>
                    {typeof protocole.conseil === "string" && (
                      <p className="text-xs leading-5 text-graphite-300">{protocole.conseil}</p>
                    )}
                    {typeof protocole.precaution === "string" && (
                      <p className="border-t border-white/[0.07] pt-2 text-[11px] leading-5 text-graphite-500">
                        Prudence · {protocole.precaution}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {Object.keys(reste).length > 0 && <JsonView data={reste} />}
    </div>
  );
}
