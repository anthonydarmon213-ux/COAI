import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = Math.max(0, Math.min(100, Number(searchParams.get("score")) || 0));
  const objectif = (searchParams.get("objectif") || "progresser durablement").slice(0, 80);
  // Âge COAI (01/09/2026) : l'accroche de la carte, le score reste la preuve.
  // Les deux paramètres sont facultatifs — une carte générée avant cette
  // évolution, ou sans âge déclaré, doit continuer à s'afficher.
  const ageCoai = Number(searchParams.get("age"));
  const ageReel = Number(searchParams.get("ageReel"));
  const ageValide = Number.isFinite(ageCoai) && ageCoai > 0 && Number.isFinite(ageReel) && ageReel > 0;
  const ecart = ageValide ? ageCoai - ageReel : 0;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 82px", background: "radial-gradient(circle at 15% 8%, rgba(221,193,145,.28), transparent 34%), radial-gradient(circle at 88% 72%, rgba(91,130,150,.22), transparent 38%), linear-gradient(155deg,#0a0b0b 0%,#181713 52%,#091014 100%)", color: "#fffdf8", fontFamily: "system-ui, sans-serif" }}>
      {/* Logo en tête, bien visible (23/08/2026, demande Anthony : "il faut
          qu'on ait notre logo sur le prog pour les partages Insta/TikTok").
          Le logomark est dessiné avec des div plutôt qu'un SVG importé : le
          rendu d'image tourne en edge runtime et ne charge pas de fichier
          externe, un <img> vers /coai-logo.svg resterait vide. Deux anneaux
          concentriques + point central, comme le mark de la marque. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", width: 92, height: 92, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "5px solid #D4AF37", boxShadow: "0 0 30px rgba(212,175,55,.45)" }}>
            <div style={{ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "2px solid rgba(0,240,255,.55)" }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, background: "#fffdf8" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: 16, lineHeight: 1 }}>COAI</span>
            <span style={{ fontSize: 17, color: "#D4AF37", letterSpacing: 5 }}>PERSONAL TRAINING, REIMAGINED.</span>
          </div>
        </div>
        <span style={{ border: "1px solid rgba(221,193,145,.34)", borderRadius: 999, padding: "14px 22px", color: "#efd9ad", fontSize: 18, letterSpacing: 4 }}>DÉFI COAI</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: 28, color: "#ddc191", letterSpacing: 7 }}>{ageValide ? "MON ÂGE COAI" : "MON SCORE"}</span>
        {ageValide ? (
          // Satori n'hérite pas de direction : sans flexDirection explicite,
          // les trois blocs se posaient en ligne et se chevauchaient.
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 28 }}><strong style={{ fontSize: 260, lineHeight: .9, letterSpacing: -18 }}>{ageCoai}</strong><span style={{ marginLeft: 20, color: "#c8c6bf", fontSize: 52 }}>ans</span></div>
            <span style={{ marginTop: 20, color: ecart <= 0 ? "#7ee2b8" : "#efd9ad", fontSize: 38, fontWeight: 700, textAlign: "center" }}>
              {ecart === 0 ? `Pile mes ${ageReel} ans` : ecart < 0 ? `${Math.abs(ecart)} ans de moins que mes ${ageReel} ans` : `${ecart} ans de plus que mes ${ageReel} ans`}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 34 }}><span style={{ color: "#ddc191", fontSize: 26, letterSpacing: 5 }}>SCORE COAI</span><strong style={{ marginLeft: 18, fontSize: 58, lineHeight: 1 }}>{score}</strong><span style={{ marginLeft: 8, color: "#c8c6bf", fontSize: 30 }}>/100</span></div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 28 }}><strong style={{ fontSize: 330, lineHeight: .85, letterSpacing: -24 }}>{score}</strong><span style={{ marginLeft: 24, color: "#c8c6bf", fontSize: 48 }}>/100</span></div>
        )}
        <div style={{ display: "flex", width: 720, height: 8, marginTop: 64, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#a8763e,#efd9ad)" }} /></div>
        <span style={{ maxWidth: 760, marginTop: 52, color: "#f1eee6", fontSize: 40, lineHeight: 1.25, textAlign: "center" }}>Mon objectif : {objectif}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.14)", paddingTop: 34, color: "#ddc191", fontSize: 42, fontWeight: 700 }}>À ton tour. Fais mieux que moi.</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}><span style={{ maxWidth: 590, color: "#b9bbb8", fontSize: 24, lineHeight: 1.5 }}>Bilan offert · estimation de forme relative, pas une mesure médicale.</span><span style={{ color: "#fffdf8", fontSize: 30, fontWeight: 750 }}>coai.fr/diagnostic</span></div>
      </div>
    </div>,
    { width: 1080, height: 1920 }
  );
}
