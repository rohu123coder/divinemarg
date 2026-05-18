import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "cosmic-deep": "#1A0B2E",
        "cosmic-secondary": "#2D1B4E",
        "gold-accent": "#FFD700",
        "soft-gold": "#F4C430",
        "mystic-pink": "#FF6B9D",
        "violet-electric": "#8B5CF6",
        "violet-light": "#A78BFA",
        "cream-white": "#FFF8E7",
        "success-green": "#10B981",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(ellipse at 50% 0%, #1A0B2E 0%, #2D1B4E 45%, #0A0418 100%)",
        "cta-gold":
          "linear-gradient(135deg, #FFD700 0%, #F4C430 50%, #FF6B9D 100%)",
        "card-highlight":
          "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(255,107,157,0.1))",
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(255, 215, 0, 0.35)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
