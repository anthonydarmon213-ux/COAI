import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon (19/08/2026, demande Anthony) : repris directement des couleurs du
// vrai logomark (src/components/brand/coai-mark.tsx — arc doré + œil bleu),
// avant ça ce fichier utilisait des teintes différentes (bleu-acier au lieu
// du bleu de l'œil) et un double contour décoratif absent du vrai mark.
// L'arc n'est pas "ouvert" ici (contrairement au SVG du logo) : à 16-32px
// dans un onglet de navigateur, un anneau plein reste lisible alors qu'une
// coupure fine se serait probablement perdue au rendu.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ea",
          border: "3px solid #c9a262",
          borderRadius: 999,
        }}
      >
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: 999,
            background: "#3d7a99",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: 999, background: "#0d1b22" }} />
        </div>
      </div>
    ),
    size
  );
}
