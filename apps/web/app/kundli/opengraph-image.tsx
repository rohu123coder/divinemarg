import { ImageResponse } from "next/og";

import { getTenant } from "@/lib/tenants";

export const runtime = "edge";

const tenant = getTenant();
export const alt = `${tenant.name} — Free Vedic Kundli`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const { name, logo, theme } = getTenant();
  const { colors } = theme;
  const violet900 = colors.violet900 ?? "#4c1d95";
  const violet600 = colors.violet600 ?? "#7c3aed";
  const violet800 = colors.violet800 ?? "#5b21b6";
  const violet100 = colors.violet100 ?? "#ede9fe";
  const violet200 = colors.violet200 ?? "#ddd6fe";

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
          background: `linear-gradient(135deg, ${violet900} 0%, ${violet600} 45%, ${violet800} 100%)`,
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
              color: violet100,
              letterSpacing: "-0.02em",
            }}
          >
            {logo.text}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: violet200,
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
