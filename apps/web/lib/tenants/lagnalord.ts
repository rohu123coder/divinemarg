import type { TenantConfig } from "./types";

export const lagnalord: TenantConfig = {
  id: "lagnalord",
  name: "LagnaLord",
  tagline: "Decode Your Destiny. Master Your Space.",
  domain: "lagnalord.com",
  theme: {
    colors: {
      cosmicDeep: "#0A1A2F",
      cosmicSecondary: "#13294B",
      goldAccent: "#C9A227",
      softGold: "#E0C158",
      mysticPink: "#A6745A",
      violetElectric: "#2A7D7B",
      violetLight: "#3A9D9B",
      creamWhite: "#F5F1E8",
      successGreen: "#10B981",
      violet50: "#eaf0f6",
      violet100: "#d5e1ed",
      violet200: "#abc3db",
      violet300: "#6a8fb5",
      violet400: "#3a5f85",
      violet500: "#13294B",
      violet600: "#0F2240",
      violet700: "#0A1A2F",
      violet800: "#081424",
      violet900: "#050D1A",
    },
    gradients: {
      heroRadial:
        "radial-gradient(ellipse at 50% 0%, #13294B 0%, #0A1A2F 55%, #050D1A 100%)",
      ctaGold:
        "linear-gradient(135deg, #C9A227 0%, #E0C158 50%, #A6745A 100%)",
      cardHighlight:
        "linear-gradient(135deg, rgba(42,125,123,0.1), rgba(201,162,39,0.1))",
    },
    fonts: {
      heading: "var(--font-heading)",
      sans: "var(--font-sans)",
    },
  },
  logo: { text: "LagnaLord" },
  features: {
    palmReading: true,
    faceReading: true,
    kundali: true,
    horoscope: true,
    panchang: true,
    chat: true,
    voiceCall: true,
    videoCall: true,
  },
  contact: {
    supportEmail: "support@lagnalord.com",
  },
};
