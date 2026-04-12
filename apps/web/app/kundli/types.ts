export type KundliChartPayload = {
  houseRashis: string[];
  planetHouseMap: Record<string, number>;
};

export type KundliCalculateResponse = {
  birthTimeApproximate: boolean;
  basicInfo: {
    name: string;
    gender: string;
    dob: string;
    tob: string | null;
    pob: string;
    sunSign: { rashi: string; degree: number; minutes: number };
    moonSign: { rashi: string; degree: number };
    ascendant: { rashi: string; degree: number };
    nakshatra: { name: string; lord: string; pada: number };
    numerologyNumber: number;
  };
  planets: Array<{
    name: string;
    sanskrit: string;
    symbol: string;
    longitude: number;
    rashi: string;
    house: number;
    degree: number;
    minutes: number;
    isRetrograde: boolean;
    isExalted: boolean;
    isDebilitated: boolean;
    ownSign: boolean;
  }>;
  houses: Array<{
    number: number;
    rashi: string;
    lord: string;
    planets: string[];
  }>;
  dasha: {
    mahadasha: {
      planet: string;
      startDate: string;
      endDate: string;
      yearsRemaining: number;
    };
    antardasha: { planet: string; startDate: string; endDate: string };
    pratyantar: { planet: string; startDate: string; endDate: string };
  };
  doshas: {
    mangalDosha: {
      present: boolean;
      type: string;
      exceptions: string[];
      severity: string;
    };
    sadeSati: {
      present: boolean;
      phase: string | null;
      startYear: number | null;
      endYear: number | null;
    };
    kaalsarpDosha: { present: boolean; type: string };
  };
  yogas: Array<{
    name: string;
    sanskritName: string;
    present: boolean;
    planets: string[];
    description: string;
    effect: string;
  }>;
  predictions: Record<string, string>;
  chartData: KundliChartPayload;
};
