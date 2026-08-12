import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const date = today();
  const debut30Jours = new Date(date.getTime() - 29 * 24 * 60 * 60 * 1000);
  const [daily, total30Jours] = await Promise.all([
    prisma.dailySession.findUnique({ where: { userId_date: { userId: user.id, date } }, select: { completedAt: true, availableMinutes: true, workoutRating: true } }),
    prisma.dailySession.count({ where: { userId: user.id, completedAt: { not: null }, date: { gte: debut30Jours } } }),
  ]);
  if (!daily?.completedAt || !daily.workoutRating) return NextResponse.json({ error: "Termine d'abord ta séance et ton ressenti" }, { status: 409 });

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 86, background: "radial-gradient(circle at 18% 12%, rgba(201,162,98,0.26), transparent 48%), radial-gradient(circle at 90% 88%, rgba(58,90,107,0.2), transparent 52%), #090a0b", fontFamily: "system-ui, sans-serif", color: "#f5f6f7" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><span style={{ fontSize: 24, letterSpacing: 7, color: "#c9a262" }}>DAILY COAI</span><span style={{ fontSize: 24, color: "#9aa0a8" }}>{date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}><span style={{ fontSize: 92, lineHeight: 1, fontWeight: 750, letterSpacing: -3 }}>SÉANCE<br />ACCOMPLIE.</span><span style={{ fontSize: 34, color: "#c9a262" }}>{daily.availableMinutes ?? 45} MINUTES POUR AVANCER</span></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 34 }}><span style={{ fontSize: 28, color: "#d6d8db" }}>{total30Jours} séance{total30Jours > 1 ? "s" : ""} terminée{total30Jours > 1 ? "s" : ""} en 30 jours</span><span style={{ fontSize: 24, color: "#9aa0a8" }}>La régularité gagne.</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}><span style={{ fontSize: 22, color: "#9aa0a8" }}>Mon coaching apprend avec moi.</span><div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 32, fontWeight: 700 }}>COAI</span><span style={{ fontSize: 16, letterSpacing: 4, color: "#c9a262" }}>HI × AI™</span></div><span style={{ fontSize: 18, color: "#9aa0a8" }}>coai.fr/diagnostic</span></div></div>
    </div>,
    { width: 1080, height: 1080 }
  );
}
