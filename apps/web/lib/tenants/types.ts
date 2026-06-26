export interface TenantConfig {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  theme: {
    colors: {
      cosmicDeep: string;
      cosmicSecondary: string;
      goldAccent: string;
      softGold: string;
      mysticPink: string;
      violetElectric: string;
      violetLight: string;
      creamWhite: string;
      successGreen: string;
    };
    gradients: {
      heroRadial: string;
      ctaGold: string;
      cardHighlight: string;
    };
    fonts: {
      heading: string;
      sans: string;
    };
  };
  logo: { text: string; imageUrl?: string };
  features: {
    palmReading: boolean;
    faceReading: boolean;
    kundali: boolean;
    horoscope: boolean;
    panchang: boolean;
    chat: boolean;
    voiceCall: boolean;
    videoCall: boolean;
  };
  contact: { supportEmail: string; whatsapp?: string };
}
