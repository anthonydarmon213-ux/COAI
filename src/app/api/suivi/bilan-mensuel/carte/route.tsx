import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const JOUR_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const depuis = new Date(Date.now() - 30 * JOUR_MS);
  const seances = await prisma.seanceLog.findMany({
    where: { user: { supabaseAuthId: authUser.id }, date: { gte: depuis } },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  if (seances.length === 0) return NextResponse.json({ error: "Pas encore de bilan disponible" }, { status: 404 });

  const semainesActives = new Set(
    seances.map(({ date }) => {
      const joursDepuisDebut = Math.floor((date.getTime() - depuis.getTime()) / JOUR_MS);
      return Math.max(0, Math.min(4, Math.floor(joursDepuisDebut / 7)));
    })
  ).size;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 86, background: "radial-gradient(circle at 18% 12%, rgba(201,162,98,0.24), transparent 48%), radial-gradient(circle at 88% 88%, rgba(58,90,107,0.2), transparent 52%), #090a0b", fontFamily: "system-ui, sans-serif", color: "#f5f6f7" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 24, letterSpacing: 7, color: "#c9a262" }}>MON BILAN COAI</span>
        <span style={{ fontSize: 26, color: "#9aa0a8" }}>30 derniers jours</span>
      </div>
      <div style={{ display: "flex", gap: 64, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 190, fontWeight: 750, lineHeight: 0.95 }}>{seances.length}</span><span style={{ fontSize: 32, color: "#c9a262", marginTop: 24 }}>SÉANCE{seances.length > 1 ? "S" : ""} RÉALISÉE{seances.length > 1 ? "S" : ""}</span></div>
        <div style={{ display: "flex", flexDirection: "column", paddingBottom: 7 }}><span style={{ fontSize: 94, fontWeight: 700, lineHeight: 1 }}>{semainesActives}/5</span><span style={{ fontSize: 23, color: "#9aa0a8", marginTop: 18 }}>SEMAINES ACTIVES</span></div>
      </div>
      <span style={{ fontSize: 42, lineHeight: 1.25, maxWidth: 820 }}>La régularité construit la progression.</span>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, color: "#9aa0a8" }}>Plus COAI me connaît, meilleur devient mon coaching.</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 32, fontWeight: 700 }}>COAI</span><span style={{ fontSize: 16, letterSpacing: 4, color: "#c9a262" }}>HI × AI™</span></div><span style={{ fontSize: 18, color: "#9aa0a8" }}>coai.fr/diagnostic</span></div>
      </div>
    </div>,
    { width: 1080, height: 1080 }
  );
}
