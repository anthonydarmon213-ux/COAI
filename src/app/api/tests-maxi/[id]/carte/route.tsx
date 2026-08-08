import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { LABEL_PAR_EXERCICE } from "@/lib/tests-maxi/labels";

// Carte de partage façon Strava — visuel carré téléchargeable, généré à la
// demande (pas stocké), pour poster un nouveau record sur les réseaux.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const testMaxi = await prisma.testMaxi.findFirst({
    where: { id: params.id, user: { supabaseAuthId: authUser.id } },
  });
  if (!testMaxi) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const dateFormatee = testMaxi.date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background:
            "radial-gradient(circle at 15% 10%, rgba(201,162,98,0.18), transparent 55%), radial-gradient(circle at 85% 85%, rgba(58,90,107,0.16), transparent 55%), linear-gradient(180deg, #090a0b 0%, #0d0e10 50%, #090a0b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#c9a262",
          }}
        >
          Nouveau record
        </span>
        <span
          style={{
            fontSize: 220,
            fontWeight: 700,
            color: "#f5f6f7",
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          {testMaxi.valeur % 1 === 0 ? testMaxi.valeur.toFixed(0) : testMaxi.valeur}
        </span>
        <span
          style={{
            fontSize: 40,
            color: "#c9a262",
            marginTop: -20,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {testMaxi.unite}
        </span>
        <span style={{ fontSize: 44, fontWeight: 600, color: "#f5f6f7", marginTop: 10 }}>
          {LABEL_PAR_EXERCICE[testMaxi.exercice]}
        </span>
        <span style={{ fontSize: 24, color: "#9aa0a8" }}>{dateFormatee}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 40 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#f5f6f7", letterSpacing: -1 }}>
            COAI
          </span>
          <span
            style={{
              fontSize: 16,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#c9a262",
            }}
          >
            HI × AI™
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
