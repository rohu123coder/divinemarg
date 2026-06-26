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
      violet50?: string;
      violet100?: string;
      violet200?: string;
      violet300?: string;
      violet400?: string;
      violet500?: string;
      violet600?: string;
      violet700?: string;
      violet800?: string;
      violet900?: string;
      slate?: string;
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
