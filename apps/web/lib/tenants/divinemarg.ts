import type { TenantConfig } from "./types";

export const divinemarg: TenantConfig = {
  id: "divinemarg",
  name: "DivineMarg",
  tagline: "Talk to India's Top Astrologers",
  domain: "divinemarg.com",
  theme: {
    colors: {
      cosmicDeep: "#1A0B2E",
      cosmicSecondary: "#2D1B4E",
      goldAccent: "#FFD700",
      softGold: "#F4C430",
      mysticPink: "#FF6B9D",
      violetElectric: "#8B5CF6",
      violetLight: "#A78BFA",
      creamWhite: "#FFF8E7",
      successGreen: "#10B981",
    },
    gradients: {
      heroRadial:
        "radial-gradient(ellipse at 50% 0%, #1A0B2E 0%, #2D1B4E 45%, #0A0418 100%)",
      ctaGold:
        "linear-gradient(135deg, #FFD700 0%, #F4C430 50%, #FF6B9D 100%)",
      cardHighlight:
        "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(255,107,157,0.1))",
    },
    fonts: {
      heading: "Georgia, serif",
      sans: "system-ui, sans-serif",
    },
  },
  logo: { text: "DivineMarg", imageUrl: "/logo.png" },
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
    supportEmail: "support@divinemarg.com",
  },
};
