/** Sidereal rashi labels (index 0 = Mesh). */
export const RASHI_NAMES = [
  "Mesh (Aries)",
  "Vrishabh (Taurus)",
  "Mithun (Gemini)",
  "Kark (Cancer)",
  "Singh (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrishchik (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makar (Capricorn)",
  "Kumbh (Aquarius)",
  "Meen (Pisces)",
] as const;

export const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

/** Vimshottari lord for each nakshatra (27). */
export const NAKSHATRA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

export type VimPlanet = (typeof VIM_ORDER)[number];

export const VIM_ORDER = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

export const VIM_YEARS: Record<VimPlanet, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const CHALDEAN: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 8,
  G: 3,
  H: 5,
  I: 1,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  O: 7,
  P: 8,
  Q: 1,
  R: 2,
  S: 3,
  T: 4,
  U: 6,
  V: 6,
  W: 6,
  X: 5,
  Y: 1,
  Z: 7,
};

export function degreesToDMS(decimal: number): {
  degrees: number;
  minutes: number;
  seconds: number;
} {
  const x = ((decimal % 360) + 360) % 360;
  const deg = Math.floor(x);
  const minFloat = (x - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  return { degrees: deg, minutes: min, seconds: sec };
}

export function rashiFromDegree(deg: number): number {
  const x = ((deg % 360) + 360) % 360;
  return Math.floor(x / 30) % 12;
}

export function rashiFromIndex(index: number): {
  name: string;
  hindi: string;
  symbol: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  lord: string;
} {
  const i = ((index % 12) + 12) % 12;
  const hindi = RASHI_NAMES[i]?.split(" ")[0] ?? "";
  const elements: ("Fire" | "Earth" | "Air" | "Water")[] = [
    "Fire",
    "Earth",
    "Air",
    "Water",
    "Fire",
    "Earth",
    "Air",
    "Water",
    "Fire",
    "Earth",
    "Air",
    "Water",
  ];
  const symbols = [
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
  ];
  const lords = [
    "Mars",
    "Venus",
    "Mercury",
    "Moon",
    "Sun",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Saturn",
    "Jupiter",
  ];
  return {
    name: RASHI_NAMES[i] ?? "",
    hindi,
    symbol: symbols[i] ?? "",
    element: elements[i] ?? "Fire",
    lord: lords[i] ?? "",
  };
}

export type PlanetKey =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu";

export function planetInfo(name: PlanetKey): {
  symbol: string;
  color: string;
  nature: "benefic" | "malefic" | "neutral";
  sanskrit: string;
} {
  const map: Record<
    PlanetKey,
    { symbol: string; color: string; nature: "benefic" | "malefic" | "neutral"; sanskrit: string }
  > = {
    Sun: { symbol: "☉", color: "#f59e0b", nature: "malefic", sanskrit: "Surya" },
    Moon: { symbol: "☽", color: "#94a3b8", nature: "benefic", sanskrit: "Chandra" },
    Mars: { symbol: "♂", color: "#dc2626", nature: "malefic", sanskrit: "Mangal" },
    Mercury: { symbol: "☿", color: "#22c55e", nature: "neutral", sanskrit: "Budha" },
    Jupiter: { symbol: "♃", color: "#eab308", nature: "benefic", sanskrit: "Guru" },
    Venus: { symbol: "♀", color: "#ec4899", nature: "benefic", sanskrit: "Shukra" },
    Saturn: { symbol: "♄", color: "#64748b", nature: "malefic", sanskrit: "Shani" },
    Rahu: { symbol: "☊", color: "#6366f1", nature: "malefic", sanskrit: "Rahu" },
    Ketu: { symbol: "☋", color: "#a855f7", nature: "malefic", sanskrit: "Ketu" },
  };
  return map[name];
}

/** Rashi index (0–11) where each planet is exalted (sidereal). */
export const exaltationSign: Record<PlanetKey, number | null> = {
  Sun: 0,
  Moon: 1,
  Mars: 9,
  Mercury: 5,
  Jupiter: 3,
  Venus: 11,
  Saturn: 6,
  Rahu: 2,
  Ketu: 8,
};

export const debilitationSign: Record<PlanetKey, number | null> = {
  Sun: 6,
  Moon: 7,
  Mars: 3,
  Mercury: 11,
  Jupiter: 9,
  Venus: 5,
  Saturn: 0,
  Rahu: 8,
  Ketu: 2,
};

export const ownSigns: Record<PlanetKey, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [],
  Ketu: [],
};

export function houseFromDeg(planetDeg: number, ascDeg: number): number {
  const relativeDeg = (planetDeg - ascDeg + 360) % 360;
  return Math.floor(relativeDeg / 30) + 1;
}

export function chaldeanNumerology(fullName: string): number {
  const letters = fullName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("");
  let sum = 0;
  for (const ch of letters) {
    sum += CHALDEAN[ch] ?? 0;
  }
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum)
      .split("")
      .reduce((a, d) => a + parseInt(d, 10), 0);
  }
  return sum;
}

export function signLordPlanetKey(rashiIndex: number): PlanetKey {
  const l: PlanetKey[] = [
    "Mars",
    "Venus",
    "Mercury",
    "Moon",
    "Sun",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Saturn",
    "Jupiter",
  ];
  return l[rashiIndex % 12] ?? "Sun";
}
