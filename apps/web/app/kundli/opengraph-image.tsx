import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DivineMarg — Free Vedic Kundli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 45%, #5B21B6 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: 48,
            borderRadius: 32,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(237,233,254,0.35)",
          }}
        >
          <div style={{ fontSize: 72, lineHeight: 1 }}>🔮</div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#EDE9FE",
              letterSpacing: "-0.02em",
            }}
          >
            DivineMarg
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#DDD6FE",
            }}
          >
            Free Vedic Kundli — Swiss Ephemeris precision
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
