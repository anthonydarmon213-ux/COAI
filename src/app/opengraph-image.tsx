import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          gap: 20,
          background:
            "radial-gradient(circle at 15% 10%, rgba(201,162,98,0.16), transparent 55%), radial-gradient(circle at 85% 30%, rgba(58,90,107,0.14), transparent 55%), linear-gradient(180deg, #090a0b 0%, #0d0e10 50%, #090a0b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#c9a262",
          }}
        >
          Coaching · Suivi · IA
        </span>
        <span style={{ fontSize: 140, fontWeight: 700, color: "#f5f6f7", letterSpacing: -4 }}>
          CoAI
        </span>
        <span
          style={{
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#c9a262",
          }}
        >
          HI × AI™
        </span>
        <span style={{ fontSize: 30, color: "#c7cad0", marginTop: 10 }}>
          AI generates. Humans validate.
        </span>
      </div>
    ),
    size
  );
}
