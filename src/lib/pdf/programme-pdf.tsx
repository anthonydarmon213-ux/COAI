import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Pilier } from "@prisma/client";

// Export PDF des programmes générés — même logique de rendu que les vues
// web (EntrainementView/NutritionView/RecuperationView + JsonView pour le
// contenu libre généré par l'IA), portée sur les primitives @react-pdf
// (View/Text) au lieu du DOM. Pensé pour l'impression : fond blanc, pas de
// liens externes (YouTube/Google image, inutiles sur papier).

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const KNOWN_LABELS: Record<string, string> = {
  frequenceParSemaine: "Fréquence par semaine",
  vueEnsemble: "Vue d'ensemble",
  retourAuCalme: "Retour au calme",
  dureeProgramme: "Durée du programme",
  objectifsJournaliers: "Objectifs journaliers",
  quantite: "Quantité",
  mobiliteEtirements: "Mobilité / étirements",
  gestionFatigue: "Gestion de la fatigue",
  constatActuel: "Constat actuel",
  proteines: "Protéines",
  lipides: "Lipides",
  calories: "Calories",
  glucides: "Glucides",
};

function humanizeKey(key: string): string {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  const spaced = key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 10, color: "#232323" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, borderBottom: "1.5pt solid #c9a262", paddingBottom: 12 },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 1, color: "#141414" },
  brandSub: { fontSize: 8, color: "#a97f3f", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 },
  metaBlock: { alignItems: "flex-end" },
  metaLine: { fontSize: 8, color: "#6b6b6b", marginBottom: 1 },
  pilierLabel: { fontSize: 9, color: "#a97f3f", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  h1: { fontSize: 19, fontFamily: "Helvetica-Bold", color: "#141414", marginBottom: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  badge: { fontSize: 8, color: "#8a6a2f", backgroundColor: "#f7f0e2", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, marginRight: 6, marginBottom: 6 },
  vueEnsemble: { backgroundColor: "#faf6ec", borderLeft: "2pt solid #c9a262", padding: 10, marginBottom: 16 },
  vueEnsembleText: { fontSize: 9.5, lineHeight: 1.5, color: "#3a3a3a" },
  contreIndicationsBox: { backgroundColor: "#fdf2f2", borderLeft: "2pt solid #c0504d", padding: 10, marginBottom: 16 },
  contreIndicationsTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a33333", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  contreIndicationsItem: { fontSize: 9, color: "#5a2a2a", marginBottom: 2, lineHeight: 1.4 },
  jourBlock: { marginBottom: 16 },
  jourTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#141414", marginBottom: 6, paddingBottom: 4, borderBottom: "0.75pt solid #dddddd" },
  subLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a97f3f", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3, marginTop: 6 },
  paragraph: { fontSize: 9.5, lineHeight: 1.5, color: "#3a3a3a", marginBottom: 4 },
  subCard: { borderLeft: "1.5pt solid #e5e5e5", paddingLeft: 8, marginBottom: 6 },
  exerciceRow: { borderBottom: "0.5pt solid #eeeeee", paddingVertical: 6 },
  exerciceNom: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1a1a1a", marginBottom: 2 },
  exerciceMeta: { fontSize: 8.5, color: "#666666" },
  kv: { flexDirection: "row", marginBottom: 2 },
  kvLabel: { fontSize: 9, color: "#666666", width: 140 },
  kvValue: { fontSize: 9, color: "#1a1a1a", flex: 1 },
  conseilBloc: { marginBottom: 8 },
  conseilSujet: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#3a3a3a", marginBottom: 2 },
  footer: { position: "absolute", bottom: 22, left: 40, right: 60, fontSize: 6.5, color: "#999999", lineHeight: 1.4, borderTop: "0.5pt solid #eeeeee", paddingTop: 8 },
  pageNumber: { position: "absolute", bottom: 22, right: 40, fontSize: 8, color: "#999999" },
});

function PdfKeyValue({ data }: { data: unknown }) {
  if (data === null || data === undefined || data === "") return null;

  if (Array.isArray(data)) {
    const allPrimitive = data.every((item) => !isPlainObject(item) && !Array.isArray(item));
    if (allPrimitive) {
      return (
        <View>
          {data.map((item, i) => (
            <Text key={i} style={styles.paragraph}>
              • {String(item)}
            </Text>
          ))}
        </View>
      );
    }
    return (
      <View>
        {data.map((item, i) => (
          <View key={i} style={styles.subCard}>
            <PdfKeyValue data={item} />
          </View>
        ))}
      </View>
    );
  }

  if (isPlainObject(data)) {
    return (
      <View>
        {Object.entries(data).map(([key, value]) => {
          const label = humanizeKey(key);
          const isComplex = isPlainObject(value) || Array.isArray(value);
          if (isComplex) {
            return (
              <View key={key} style={{ marginBottom: 4 }}>
                <Text style={styles.subLabel}>{label}</Text>
                <PdfKeyValue data={value} />
              </View>
            );
          }
          return (
            <View key={key} style={styles.kv}>
              <Text style={styles.kvLabel}>{label}</Text>
              <Text style={styles.kvValue}>{String(value)}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return <Text style={styles.paragraph}>{String(data)}</Text>;
}

const CHAMPS_EXERCICE: { cle: string; label: string }[] = [
  { cle: "series", label: "Séries" },
  { cle: "repetitions", label: "Répétitions" },
  { cle: "repos", label: "Repos" },
  { cle: "charge", label: "Charge" },
  { cle: "methode", label: "Méthode" },
];

function PdfExercice({ exercice }: { exercice: unknown }) {
  if (!isPlainObject(exercice)) return null;
  const nom = typeof exercice.nom === "string" ? exercice.nom : "Exercice";
  const metas = CHAMPS_EXERCICE.map(({ cle, label }) => {
    const v = exercice[cle];
    if (v === undefined || v === null || v === "") return null;
    return `${label} : ${String(v)}`;
  }).filter((v): v is string => v !== null);

  return (
    <View style={styles.exerciceRow} wrap={false}>
      <Text style={styles.exerciceNom}>{nom}</Text>
      {metas.length > 0 && <Text style={styles.exerciceMeta}>{metas.join("   ·   ")}</Text>}
    </View>
  );
}

function ContreIndicationsBlock({ items }: { items: unknown[] }) {
  return (
    <View style={styles.contreIndicationsBox} wrap={false}>
      <Text style={styles.contreIndicationsTitle}>Points de vigilance</Text>
      {items.map((it, i) => (
        <Text key={i} style={styles.contreIndicationsItem}>
          • {String(it)}
        </Text>
      ))}
    </View>
  );
}

function EntrainementBody({ data }: { data: Record<string, unknown> }) {
  const { frequenceParSemaine, dureeProgramme, vueEnsemble, contreIndications, seances } = data as {
    frequenceParSemaine?: string;
    dureeProgramme?: string;
    vueEnsemble?: string;
    contreIndications?: unknown[];
    seances?: Record<string, unknown>[];
  };

  const badges = [
    frequenceParSemaine ? `Fréquence : ${frequenceParSemaine}` : null,
    dureeProgramme ? `Durée : ${dureeProgramme}` : null,
  ].filter((b): b is string => b !== null);

  return (
    <>
      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.map((b, i) => (
            <Text key={i} style={styles.badge}>
              {b}
            </Text>
          ))}
        </View>
      )}
      {vueEnsemble && (
        <View style={styles.vueEnsemble}>
          <Text style={styles.vueEnsembleText}>{vueEnsemble}</Text>
        </View>
      )}
      {Array.isArray(contreIndications) && contreIndications.length > 0 && (
        <ContreIndicationsBlock items={contreIndications} />
      )}
      {Array.isArray(seances) &&
        seances.map((seance, i) => {
          const nom = typeof seance.nom === "string" ? seance.nom : `Séance ${i + 1}`;
          const jour = typeof seance.jour === "string" ? seance.jour : undefined;
          const echauffement = typeof seance.echauffement === "string" ? seance.echauffement : undefined;
          const retourAuCalme = typeof seance.retourAuCalme === "string" ? seance.retourAuCalme : undefined;
          const exercices = Array.isArray(seance.exercices) ? seance.exercices : [];
          return (
            <View key={i} style={styles.jourBlock}>
              <Text style={styles.jourTitle}>{jour ? `${jour} — ${nom}` : nom}</Text>
              {echauffement && (
                <>
                  <Text style={styles.subLabel}>Échauffement</Text>
                  <Text style={styles.paragraph}>{echauffement}</Text>
                </>
              )}
              {exercices.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {exercices.map((ex, j) => (
                    <PdfExercice key={j} exercice={ex} />
                  ))}
                </View>
              )}
              {retourAuCalme && (
                <>
                  <Text style={styles.subLabel}>Retour au calme</Text>
                  <Text style={styles.paragraph}>{retourAuCalme}</Text>
                </>
              )}
            </View>
          );
        })}
    </>
  );
}

function NutritionBody({ data }: { data: Record<string, unknown> }) {
  const { vueEnsemble, contreIndications, objectifsJournaliers, conseilsHabitudes, jours } = data as {
    vueEnsemble?: string;
    contreIndications?: unknown[];
    objectifsJournaliers?: Record<string, unknown>;
    conseilsHabitudes?: { sujet?: string; constatActuel?: string; conseil?: string }[];
    jours?: Record<string, unknown>[];
  };

  const badges = isPlainObject(objectifsJournaliers)
    ? Object.entries(objectifsJournaliers)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${humanizeKey(k)} : ${String(v)}`)
    : [];

  return (
    <>
      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.map((b, i) => (
            <Text key={i} style={styles.badge}>
              {b}
            </Text>
          ))}
        </View>
      )}
      {vueEnsemble && (
        <View style={styles.vueEnsemble}>
          <Text style={styles.vueEnsembleText}>{vueEnsemble}</Text>
        </View>
      )}
      {Array.isArray(contreIndications) && contreIndications.length > 0 && (
        <ContreIndicationsBlock items={contreIndications} />
      )}
      {Array.isArray(jours) &&
        jours.map((jourData, i) => {
          const jourNom = typeof jourData.jour === "string" ? jourData.jour : `Jour ${i + 1}`;
          const repas = Array.isArray(jourData.repas) ? jourData.repas : null;
          const { repas: _repas, jour: _jour, ...reste } = jourData;
          void _repas;
          void _jour;
          return (
            <View key={i} style={styles.jourBlock}>
              <Text style={styles.jourTitle}>{jourNom}</Text>
              {repas
                ? repas.map((r, ri) => (
                    <View key={ri} style={styles.subCard}>
                      <PdfKeyValue data={r} />
                    </View>
                  ))
                : <PdfKeyValue data={reste} />}
            </View>
          );
        })}
      {Array.isArray(conseilsHabitudes) && conseilsHabitudes.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.subLabel}>Conseils sur tes habitudes</Text>
          {conseilsHabitudes.map((c, i) => (
            <View key={i} style={styles.conseilBloc}>
              {c.sujet && <Text style={styles.conseilSujet}>{c.sujet}</Text>}
              {c.constatActuel && <Text style={styles.paragraph}>{c.constatActuel}</Text>}
              {c.conseil && <Text style={styles.paragraph}>{c.conseil}</Text>}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function RecuperationBody({ data }: { data: Record<string, unknown> }) {
  const { vueEnsemble, contreIndications, jours } = data as {
    vueEnsemble?: string;
    contreIndications?: unknown[];
    jours?: Record<string, unknown>[];
  };

  return (
    <>
      {vueEnsemble && (
        <View style={styles.vueEnsemble}>
          <Text style={styles.vueEnsembleText}>{vueEnsemble}</Text>
        </View>
      )}
      {Array.isArray(contreIndications) && contreIndications.length > 0 && (
        <ContreIndicationsBlock items={contreIndications} />
      )}
      {Array.isArray(jours) &&
        jours.map((jourData, i) => {
          const jour = typeof jourData.jour === "string" ? jourData.jour : `Jour ${i + 1}`;
          const type = typeof jourData.type === "string" ? jourData.type : undefined;
          const { jour: _jour, type: _type, ...reste } = jourData;
          void _jour;
          void _type;
          return (
            <View key={i} style={styles.jourBlock}>
              <Text style={styles.jourTitle}>{type ? `${jour} — ${type}` : jour}</Text>
              <PdfKeyValue data={reste} />
            </View>
          );
        })}
    </>
  );
}

const PILIER_LABEL: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

export function ProgrammePdf({
  pilier,
  data,
  prenom,
  generatedAt,
}: {
  pilier: Pilier;
  data: unknown;
  prenom?: string | null;
  generatedAt: Date;
}) {
  const contenu = isPlainObject(data) ? data : {};
  const titre = typeof contenu.titre === "string" ? contenu.titre : PILIER_LABEL[pilier];
  const dateFormatee = generatedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`COAI — Programme ${PILIER_LABEL[pilier]}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.brand}>COAI</Text>
            <Text style={styles.brandSub}>L&apos;IA génère. Ton coach valide.</Text>
          </View>
          <View style={styles.metaBlock}>
            {prenom && <Text style={styles.metaLine}>{prenom}</Text>}
            <Text style={styles.metaLine}>Généré le {dateFormatee}</Text>
          </View>
        </View>

        <Text style={styles.pilierLabel}>{PILIER_LABEL[pilier]}</Text>
        <Text style={styles.h1}>{titre}</Text>

        {pilier === "ENTRAINEMENT" && <EntrainementBody data={contenu} />}
        {pilier === "NUTRITION" && <NutritionBody data={contenu} />}
        {pilier === "RECUPERATION" && <RecuperationBody data={contenu} />}

        <Text style={styles.footer} fixed>
          Programme généré par IA et supervisé par un coach COAI — recommandation sportive, pas un
          avis médical. Consulte ton médecin avant de démarrer un programme, notamment en cas
          d&apos;antécédent ou de doute sur ta condition physique. — coai.fr
        </Text>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
