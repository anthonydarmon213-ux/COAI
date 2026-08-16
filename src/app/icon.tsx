import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          border: "2px solid #c9a262",
          borderRadius: 999,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#5b8296",
            boxShadow: "0 0 0 4px #f7f3ea, 0 0 0 6px #8f672b",
          }}
        />
      </div>
    ),
    size
  );
}
