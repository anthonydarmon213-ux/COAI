import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import type { DecisionAdaptation, Pilier } from "@prisma/client";

const PILIERS: Record<Pilier, string> = { ENTRAINEMENT: "ENTRAÎNEMENT", NUTRITION: "ALIMENTATION", RECUPERATION: "RÉCUPÉRATION" };
const DECISIONS: Record<DecisionAdaptation, string> = { GARDER: "PROGRAMME MAINTENU", PROGRESSER: "NOUVELLE PROGRESSION", REDUIRE: "VOLUME AJUSTÉ", MODIFIER: "PROGRAMME MODIFIÉ", ADAPTER: "SÉANCE ADAPTÉE" };

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const adaptation = await prisma.programmeAdaptation.findFirst({
    where: { id: params.id, user: { supabaseAuthId: authUser.id } },
    select: { pilier: true, decision: true, resume: true, createdAt: true },
  });
  if (!adaptation) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 86, background: "radial-gradient(circle at 15% 10%, rgba(201,162,98,0.22), transparent 48%), radial-gradient(circle at 90% 90%, rgba(58,90,107,0.2), transparent 50%), #090a0b", fontFamily: "system-ui, sans-serif", color: "#f5f6f7" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ fontSize: 24, letterSpacing: 7, color: "#c9a262" }}>MON COACHING ÉVOLUE</span>
        <span style={{ fontSize: 22, letterSpacing: 4, color: "#9aa0a8" }}>{PILIERS[adaptation.pilier]}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <span style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2 }}>{DECISIONS[adaptation.decision]}</span>
        <span style={{ fontSize: 34, lineHeight: 1.35, color: "#d6d8db", maxWidth: 850 }}>{adaptation.resume.slice(0, 210)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, color: "#9aa0a8" }}>{adaptation.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 32, fontWeight: 700 }}>COAI</span><span style={{ fontSize: 16, letterSpacing: 4, color: "#c9a262" }}>HI × AI™</span></div><span style={{ fontSize: 18, color: "#9aa0a8" }}>coai.fr/diagnostic</span></div>
      </div>
    </div>,
    { width: 1080, height: 1080 }
  );
}
