import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = Math.max(0, Math.min(100, Number(searchParams.get("score")) || 0));
  const objectif = (searchParams.get("objectif") || "progresser durablement").slice(0, 80);

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 82px", background: "radial-gradient(circle at 15% 8%, rgba(221,193,145,.28), transparent 34%), radial-gradient(circle at 88% 72%, rgba(91,130,150,.22), transparent 38%), linear-gradient(155deg,#0a0b0b 0%,#181713 52%,#091014 100%)", color: "#fffdf8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={{ fontSize: 38, fontWeight: 800, letterSpacing: 12 }}>COAI</span><span style={{ fontSize: 15, color: "#ddc191", letterSpacing: 5 }}>PERSONAL TRAINING, REIMAGINED.</span></div>
        <span style={{ border: "1px solid rgba(221,193,145,.34)", borderRadius: 999, padding: "14px 22px", color: "#efd9ad", fontSize: 18, letterSpacing: 4 }}>DÉFI COAI</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: 28, color: "#ddc191", letterSpacing: 7 }}>MON SCORE</span>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 28 }}><strong style={{ fontSize: 330, lineHeight: .85, letterSpacing: -24 }}>{score}</strong><span style={{ marginLeft: 24, color: "#c8c6bf", fontSize: 48 }}>/100</span></div>
        <div style={{ width: 720, height: 8, marginTop: 64, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#a8763e,#efd9ad)" }} /></div>
        <span style={{ maxWidth: 760, marginTop: 52, color: "#f1eee6", fontSize: 40, lineHeight: 1.25, textAlign: "center" }}>Mon objectif : {objectif}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.14)", paddingTop: 34, color: "#ddc191", fontSize: 42, fontWeight: 700 }}>À ton tour. Fais mieux que moi.</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}><span style={{ maxWidth: 590, color: "#b9bbb8", fontSize: 24, lineHeight: 1.5 }}>Bilan initial offert · 3 piliers · un point de départ à comparer avec tes proches.</span><span style={{ color: "#fffdf8", fontSize: 30, fontWeight: 750 }}>coai.fr/diagnostic</span></div>
      </div>
    </div>,
    { width: 1080, height: 1920 }
  );
}
