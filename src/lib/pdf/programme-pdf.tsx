import { Document, Page, View, Text, Link, StyleSheet, Image as PdfImage } from "@react-pdf/renderer";
import type { Pilier } from "@prisma/client";

// Export PDF des programmes générés — porte l'identité visuelle du site
// (graphite/laiton, labels mono uppercase, badges circulaires numérotés,
// cartes "HUD") sur les primitives @react-pdf (View/Text) au lieu du DOM,
// pour que le PDF reste immédiatement reconnaissable comme un document
// COAI et pas un export générique. Couleurs alignées sur tailwind.config.ts.

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

// Palette alignée sur tailwind.config.ts (graphite / laiton / acier).
const C = {
  bg: "#0b0c0d",
  panel: "rgba(255,255,255,0.035)",
  panelBorder: "rgba(255,255,255,0.09)",
  hairline: "rgba(255,255,255,0.08)",
  textPrimary: "#f5f6f7",
  textBody: "#c7cad0",
  textMuted: "#767c86",
  textFaint: "#4c5058",
  gold: "#c9a262",
  goldStrong: "#ddc191",
  goldTint: "rgba(201,162,98,0.09)",
  goldTintStrong: "rgba(201,162,98,0.16)",
  goldBorder: "rgba(201,162,98,0.4)",
  steel: "#5b8296",
  steelTint: "rgba(91,130,150,0.18)",
  steelBorder: "rgba(120,165,185,0.65)",
  danger: "#e2837d",
  dangerTint: "rgba(194,80,73,0.12)",
  dangerBorder: "rgba(214,110,104,0.45)",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 108,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.textBody,
  },

  // --- Header (fixed sur chaque page) ---
  headerFixed: { position: "absolute", top: 0, left: 0, right: 0, paddingTop: 32, paddingHorizontal: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: C.textPrimary },
  brandSub: { fontSize: 6.5, color: C.gold, letterSpacing: 1.3, textTransform: "uppercase", marginTop: 4 },
  metaBlock: { alignItems: "flex-end" },
  metaEyebrow: { fontSize: 7, color: C.gold, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 3 },
  metaLine: { fontSize: 8, color: C.textMuted, marginBottom: 1 },
  headerRule: { height: 1, backgroundColor: C.goldBorder, marginTop: 14, marginBottom: 9 },
  piliersNav: { flexDirection: "row" },
  piliersNavItem: { fontSize: 6.5, letterSpacing: 1.1, textTransform: "uppercase", marginRight: 16 },
  piliersNavItemActive: { color: C.gold, fontFamily: "Helvetica-Bold" },
  piliersNavItemInactive: { color: C.textFaint },

  // --- Titre ---
  eyebrow: {
    fontSize: 8,
    color: C.gold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  h1: { fontSize: 21, fontFamily: "Helvetica-Bold", color: C.textPrimary, letterSpacing: -0.3, marginBottom: 4 },
  genereLe: { fontSize: 7.5, color: C.textFaint, marginBottom: 16 },
  heroImage: { width: "100%", height: 170, objectFit: "cover", borderRadius: 10, marginBottom: 14 },

  // --- Badges ---
  badgeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  badge: {
    fontSize: 7.5,
    color: C.goldStrong,
    backgroundColor: C.goldTint,
    borderWidth: 0.75,
    borderColor: C.goldBorder,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginRight: 6,
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  // --- Vue d'ensemble ---
  vueEnsembleLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  vueEnsembleBox: {
    backgroundColor: C.goldTint,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  vueEnsembleText: { fontSize: 9.5, lineHeight: 1.55, color: C.textBody, fontFamily: "Helvetica-Oblique" },

  // --- Contre-indications ---
  contreIndicationsBox: {
    backgroundColor: C.dangerTint,
    borderLeftWidth: 2,
    borderLeftColor: C.danger,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  contreIndicationsTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.danger,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  contreIndicationsItem: { fontSize: 9, color: C.textBody, marginBottom: 3, lineHeight: 1.4 },

  // --- Sections jour ---
  jourBlock: { marginBottom: 18 },
  jourHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  jourIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.goldBorder,
    backgroundColor: C.goldTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  jourIndexText: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.gold },
  jourTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.textPrimary },
  jourSubtitle: { fontSize: 8, color: C.textMuted, marginTop: 1 },

  subLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 4,
    marginTop: 8,
  },
  paragraph: { fontSize: 9.5, lineHeight: 1.55, color: C.textBody, marginBottom: 4 },

  // --- Cartes génériques (repas / récupération / repli JSON libre) ---
  subCard: {
    backgroundColor: C.panel,
    borderWidth: 0.75,
    borderColor: C.panelBorder,
    borderRadius: 6,
    padding: 9,
    marginBottom: 7,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingVertical: 3.5,
  },
  kvLabel: { fontSize: 7.5, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, width: 130 },
  kvValue: { fontSize: 9, color: C.textPrimary, flex: 1, textAlign: "right" },

  // --- Exercices (chips HUD) ---
  exerciceCard: {
    backgroundColor: C.panel,
    borderWidth: 0.75,
    borderColor: C.panelBorder,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    borderRadius: 5,
    padding: 10,
    marginBottom: 7,
  },
  exerciceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  exerciceNom: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.textPrimary, flex: 1 },
  exerciceLink: { fontSize: 7, color: C.steel, letterSpacing: 0.3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    width: 152,
    borderWidth: 0.75,
    borderColor: C.hairline,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    marginRight: 6,
    marginBottom: 6,
  },
  chipLabel: { fontSize: 6, color: C.textFaint, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  chipValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.textPrimary },

  // --- Conseils nutrition ---
  conseilBloc: {
    backgroundColor: C.steelTint,
    borderLeftWidth: 2,
    borderLeftColor: C.steel,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    padding: 10,
    marginBottom: 7,
  },
  conseilSujet: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.textPrimary, marginBottom: 2 },

  // --- Footer (fixed) ---
  footer: {
    position: "absolute",
    bottom: 0,
    left: 40,
    right: 40,
    paddingBottom: 22,
  },
  footerRule: { height: 0.75, backgroundColor: C.hairline, marginBottom: 8 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footerBrand: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.textFaint, letterSpacing: 1 },
  footerText: { fontSize: 6.3, color: C.textFaint, lineHeight: 1.4, maxWidth: 400 },
  pageNumber: { fontSize: 7.5, color: C.textMuted },
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
        {Object.entries(data).map(([key, value], i, arr) => {
          const label = humanizeKey(key);
          const isComplex = isPlainObject(value) || Array.isArray(value);
          if (isComplex) {
            return (
              <View key={key} style={{ marginBottom: 5, marginTop: i > 0 ? 4 : 0 }}>
                <Text style={styles.subLabel}>{label}</Text>
                <PdfKeyValue data={value} />
              </View>
            );
          }
          return (
            <View key={key} style={i === arr.length - 1 ? { ...styles.kvRow, borderBottomWidth: 0 } : styles.kvRow}>
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
  const chips = CHAMPS_EXERCICE.map(({ cle, label }) => {
    const v = exercice[cle];
    if (v === undefined || v === null || v === "") return null;
    return { label, value: String(v) };
  }).filter((v): v is { label: string; value: string } => v !== null);

  return (
    <View style={styles.exerciceCard} wrap={false}>
      <View style={styles.exerciceHeaderRow}>
        <Text style={styles.exerciceNom}>{nom}</Text>
        <Link
          src={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${nom} technique musculation`)}`}
          style={styles.exerciceLink}
        >
          Voir la technique
        </Link>
      </View>
      {chips.length > 0 && (
        <View style={styles.chipRow}>
          {chips.map((c, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipLabel}>{c.label}</Text>
              <Text style={styles.chipValue}>{c.value}</Text>
            </View>
          ))}
        </View>
      )}
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

function JourHeader({ index, titre, sousTitre }: { index: number; titre: string; sousTitre?: string }) {
  return (
    <View style={styles.jourHeaderRow}>
      <View style={styles.jourIndex}>
        <Text style={styles.jourIndexText}>{String(index + 1).padStart(2, "0")}</Text>
      </View>
      <View>
        <Text style={styles.jourTitle}>{titre}</Text>
        {sousTitre && <Text style={styles.jourSubtitle}>{sousTitre}</Text>}
      </View>
    </View>
  );
}

function EntrainementBody({ data }: { data: Record<string, unknown> }) {
  const { frequenceParSemaine, dureeProgramme, seances } = data as {
    frequenceParSemaine?: string;
    dureeProgramme?: string;
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
      {Array.isArray(seances) &&
        seances.slice(0, 1).map((seance, i) => {
          const nom = typeof seance.nom === "string" ? seance.nom : `Séance ${i + 1}`;
          const jour = typeof seance.jour === "string" ? seance.jour : undefined;
          const echauffement = typeof seance.echauffement === "string" ? seance.echauffement : undefined;
          const retourAuCalme = typeof seance.retourAuCalme === "string" ? seance.retourAuCalme : undefined;
          const exercices = Array.isArray(seance.exercices) ? seance.exercices : [];
          return (
            <View key={i} style={styles.jourBlock}>
              <JourHeader index={i} titre={nom} sousTitre={jour} />
              {echauffement && (
                <>
                  <Text style={styles.subLabel}>Échauffement</Text>
                  <Text style={styles.paragraph}>{echauffement}</Text>
                </>
              )}
              {exercices.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {exercices.slice(0, 6).map((ex, j) => (
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
  const { objectifsJournaliers, jours } = data as {
    objectifsJournaliers?: Record<string, unknown>;
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
      {Array.isArray(jours) &&
        jours.slice(0, 1).map((jourData, i) => {
          const jourNom = typeof jourData.jour === "string" ? jourData.jour : `Jour ${i + 1}`;
          const repas = Array.isArray(jourData.repas) ? jourData.repas : null;
          const { repas: _repas, jour: _jour, ...reste } = jourData;
          void _repas;
          void _jour;
          return (
            <View key={i} style={styles.jourBlock}>
              <JourHeader index={i} titre={jourNom} />
              {repas
                ? repas.slice(0, 4).map((r, ri) => (
                    <View key={ri} style={styles.subCard}>
                      <PdfKeyValue data={r} />
                    </View>
                  ))
                : <PdfKeyValue data={reste} />}
            </View>
          );
        })}
    </>
  );
}

function RecuperationBody({ data }: { data: Record<string, unknown> }) {
  const { jours } = data as {
    jours?: Record<string, unknown>[];
  };

  return (
    <>
      {Array.isArray(jours) &&
        jours.slice(0, 2).map((jourData, i) => {
          const jour = typeof jourData.jour === "string" ? jourData.jour : `Jour ${i + 1}`;
          const type = typeof jourData.type === "string" ? jourData.type : undefined;
          const { jour: _jour, type: _type, ...reste } = jourData;
          void _jour;
          void _type;
          return (
            <View key={i} style={styles.jourBlock}>
              <JourHeader index={i} titre={jour} sousTitre={type} />
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

const PILIERS_ORDRE: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

function HeaderFixed({ pilier, prenom, dateFormatee }: { pilier: Pilier; prenom?: string | null; dateFormatee: string }) {
  return (
    <View style={styles.headerFixed} fixed>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>COAI</Text>
          <Text style={styles.brandSub}>L&apos;IA génère. Ton coach valide.</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaEyebrow}>{PILIER_LABEL[pilier]}</Text>
          {prenom && <Text style={styles.metaLine}>{prenom}</Text>}
          <Text style={styles.metaLine}>Généré le {dateFormatee}</Text>
        </View>
      </View>

      <View style={styles.headerRule} />

      <View style={styles.piliersNav}>
        {PILIERS_ORDRE.map((p, i) => (
          <Text
            key={p}
            style={[
              styles.piliersNavItem,
              p === pilier ? styles.piliersNavItemActive : styles.piliersNavItemInactive,
            ]}
          >
            {String(i + 1).padStart(2, "0")} {PILIER_LABEL[p]}
          </Text>
        ))}
      </View>
    </View>
  );
}

function FooterFixed() {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerRule} />
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.footerBrand}>COAI</Text>
          <Text style={styles.footerText}>
            Programme généré par IA et supervisé par un coach COAI — recommandation sportive, pas un
            avis médical. Consulte ton médecin avant de démarrer un programme, notamment en cas
            d&apos;antécédent ou de doute sur ta condition physique. — coai.fr
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </View>
  );
}

export function ProgrammePdf({
  pilier,
  data,
  prenom,
  generatedAt,
  heroUrl,
}: {
  pilier: Pilier;
  data: unknown;
  prenom?: string | null;
  generatedAt: Date;
  heroUrl?: string;
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
        <HeaderFixed pilier={pilier} prenom={prenom} dateFormatee={dateFormatee} />

        <Text style={styles.eyebrow}>Ton programme {PILIER_LABEL[pilier].toLowerCase()}</Text>
        <Text style={styles.h1}>{titre}</Text>
        <Text style={styles.genereLe}>Généré le {dateFormatee} par l&apos;IA COAI</Text>
        {heroUrl && <PdfImage src={heroUrl} style={styles.heroImage} />}

        {pilier === "ENTRAINEMENT" && <EntrainementBody data={contenu} />}
        {pilier === "NUTRITION" && <NutritionBody data={contenu} />}
        {pilier === "RECUPERATION" && <RecuperationBody data={contenu} />}

        <FooterFixed />
      </Page>
    </Document>
  );
}
