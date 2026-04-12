import { DateTime, FixedOffsetZone } from "luxon";
import type { PlanetKey, VimPlanet } from "./ephemerisUtils";
import {
  NAKSHATRA_LORDS,
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  VIM_ORDER,
  VIM_YEARS,
  chaldeanNumerology,
  debilitationSign,
  degreesToDMS,
  exaltationSign,
  houseFromDeg,
  ownSigns,
  planetInfo,
  rashiFromDegree,
  rashiFromIndex,
  signLordPlanetKey,
} from "./ephemerisUtils";

const JD_UNIX_EPOCH = 2440587.5;
const J2000 = 2451545.0;
const YEAR_DAYS = 365.2425;

/** Optional UTC offset in hours (e.g. 5.5 for India). Used when not inferred from place name. */
export type KundliInput = {
  name: string;
  dob: string;
  tob: string | null;
  pob: string;
  lat: number;
  lng: number;
  gender: "male" | "female";
  utcOffset?: number;
};

function normalizeLon(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Rough IST / India place detection when `utcOffset` is omitted. */
function resolveUtcOffset(input: KundliInput): number {
  if (typeof input.utcOffset === "number" && Number.isFinite(input.utcOffset)) {
    return input.utcOffset;
  }
  const p = input.pob.toLowerCase();
  if (
    /\b(mumbai|delhi|bangalore|bengaluru|kolkata|chennai|hyderabad|pune|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|thane|bhopal|visakhapatnam|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|ranchi|srinagar|amritsar|chandigarh|gurgaon|gurugram|noida|dehradun|varanasi|mangalore|mysuru|mysore|coimbatore|kochi|goa|surat|kerala|tamil|gujarat|maharashtra|karnataka|punjab|rajasthan|uttar|pradesh|bihar|west bengal|odisha|telangana)\b/i.test(
      p
    )
  ) {
    return 5.5;
  }
  if (/\bindia\b|\bbharat\b|\bist\b/i.test(p)) {
    return 5.5;
  }
  return 5.5;
}

function jdFromUtcMs(ms: number): number {
  return ms / 86400000 + JD_UNIX_EPOCH;
}

function utcHourFractionFromJd(jd: number): number {
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);
  return (
    d.getUTCHours() +
    d.getUTCMinutes() / 60 +
    d.getUTCSeconds() / 3600 +
    d.getUTCMilliseconds() / 3600000
  );
}

/** Lahiri ayanamsa (simplified), using UTC calendar month/year at JD. */
function ayanamsaSimplified(jd: number): number {
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  return 23.85 + (year - 1900) * 0.013611 + (month - 1) * 0.001134;
}

function julianDayUTFromBirth(
  input: KundliInput,
  utcOffset: number
): { jd: number; approximate: boolean } {
  const offsetMin = Math.round(utcOffset * 60);
  const zone = FixedOffsetZone.instance(offsetMin);
  const [y, mo, d] = input.dob.split("-").map((x) => parseInt(x, 10));
  if (!input.tob) {
    const dt = DateTime.fromObject(
      { year: y, month: mo, day: d, hour: 12, minute: 0, second: 0 },
      { zone }
    );
    const utc = dt.toUTC();
    return { jd: jdFromUtcMs(utc.toMillis()), approximate: true };
  }
  const [hh, mm] = input.tob.split(":").map((x) => parseInt(x, 10));
  const dt = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: hh, minute: mm ?? 0, second: 0 },
    { zone }
  );
  const utc = dt.toUTC();
  return { jd: jdFromUtcMs(utc.toMillis()), approximate: false };
}

function jdToIso(jd: number): string {
  const ms = (jd - JD_UNIX_EPOCH) * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addYearsToJd(jd: number, years: number): number {
  return jd + years * YEAR_DAYS;
}

function vimIndex(planet: VimPlanet): number {
  return VIM_ORDER.indexOf(planet);
}

/** Vimshottari — linear walk from birth */
function vimshottariStateSimple(
  moonLongitude: number,
  birthJd: number,
  nowJd: number
): {
  mahadasha: {
    planet: VimPlanet;
    startDate: string;
    endDate: string;
    yearsRemaining: number;
  };
  antardasha: { planet: VimPlanet; startDate: string; endDate: string };
  pratyantar: { planet: VimPlanet; startDate: string; endDate: string };
} {
  const span = 360 / 27;
  const nakIndex = Math.floor(moonLongitude / span) % 27;
  const startLord = NAKSHATRA_LORDS[nakIndex] as VimPlanet;
  const moonWithin = moonLongitude - nakIndex * span;
  const fraction = moonWithin / span;
  const y0 = VIM_YEARS[startLord];
  const yearsElapsedAtBirth = fraction * y0;
  const balanceAtBirth = y0 - yearsElapsedAtBirth;

  let elapsed = Math.max(0, (nowJd - birthJd) / YEAR_DAYS);
  let idx = vimIndex(startLord);
  let rem = balanceAtBirth;

  while (elapsed > rem) {
    elapsed -= rem;
    idx = (idx + 1) % 9;
    rem = VIM_YEARS[VIM_ORDER[idx]];
  }

  const mdPlanet = VIM_ORDER[idx];
  const mdLen = VIM_YEARS[mdPlanet];
  const progressInMd = elapsed;
  const mdEndJd = addYearsToJd(nowJd, mdLen - progressInMd);
  const mdStartJd = addYearsToJd(nowJd, -progressInMd);
  const T = mdLen;

  let antIdx = idx;
  let antProgress = progressInMd;
  let antDur = T * (VIM_YEARS[VIM_ORDER[antIdx]] / 120);
  let antStartJd = mdStartJd;
  while (antProgress >= antDur) {
    antProgress -= antDur;
    antIdx = (antIdx + 1) % 9;
    antStartJd = addYearsToJd(antStartJd, antDur);
    antDur = T * (VIM_YEARS[VIM_ORDER[antIdx]] / 120);
  }
  const antPlanet = VIM_ORDER[antIdx];
  const antEndJd = addYearsToJd(antStartJd, antDur);

  const Ta = antDur;
  let prIdx = antIdx;
  let prProgress = antProgress;
  let prDur = Ta * (VIM_YEARS[VIM_ORDER[prIdx]] / 120);
  let prStartJd = antStartJd;
  while (prProgress >= prDur) {
    prProgress -= prDur;
    prIdx = (prIdx + 1) % 9;
    prStartJd = addYearsToJd(prStartJd, prDur);
    prDur = Ta * (VIM_YEARS[VIM_ORDER[prIdx]] / 120);
  }
  const prPlanet = VIM_ORDER[prIdx];
  const prEndJd = addYearsToJd(prStartJd, prDur);

  return {
    mahadasha: {
      planet: mdPlanet,
      startDate: jdToIso(mdStartJd),
      endDate: jdToIso(mdEndJd),
      yearsRemaining: Math.max(0, (mdEndJd - nowJd) / YEAR_DAYS),
    },
    antardasha: {
      planet: antPlanet,
      startDate: jdToIso(antStartJd),
      endDate: jdToIso(antEndJd),
    },
    pratyantar: {
      planet: prPlanet,
      startDate: jdToIso(prStartJd),
      endDate: jdToIso(prEndJd),
    },
  };
}

function tropicalSun(jd: number): number {
  const D = jd - J2000;
  const L = 280.46 + 0.9856474 * D;
  const gDeg = 357.528 + 0.9856003 * D;
  const g = (gDeg * Math.PI) / 180;
  return L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
}

function tropicalMoon(jd: number): number {
  const D = jd - J2000;
  const L0 = 218.316 + 13.176396 * D;
  const M = 134.963 + 13.064993 * D;
  return L0 + 6.289 * Math.sin((M * Math.PI) / 180);
}

function tropicalMean(jd: number, L0: number, coeff: number): number {
  const D = jd - J2000;
  return L0 + coeff * D;
}

function siderealFromTropical(jd: number, tropical: number): number {
  return normalizeLon(tropical - ayanamsaSimplified(jd));
}

function siderealSun(jd: number): number {
  return siderealFromTropical(jd, tropicalSun(jd));
}

function siderealMoon(jd: number): number {
  return siderealFromTropical(jd, tropicalMoon(jd));
}

function siderealMercury(jd: number): number {
  return siderealFromTropical(jd, tropicalMean(jd, 252.251, 4.092338));
}

function siderealVenus(jd: number): number {
  return siderealFromTropical(jd, tropicalMean(jd, 181.98, 1.602136));
}

function siderealMars(jd: number): number {
  return siderealFromTropical(jd, tropicalMean(jd, 355.433, 0.524033));
}

function siderealJupiter(jd: number): number {
  return siderealFromTropical(jd, tropicalMean(jd, 34.351, 0.083056));
}

function siderealSaturn(jd: number): number {
  return siderealFromTropical(jd, tropicalMean(jd, 50.077, 0.033459));
}

function siderealRahu(jd: number): number {
  const D = jd - J2000;
  const L = 125.044 - 0.052954 * D;
  return siderealFromTropical(jd, L);
}

function siderealKetu(jd: number): number {
  return normalizeLon(siderealRahu(jd) + 180);
}

const SIDEREAL_GETTERS: Record<PlanetKey, (jd: number) => number> = {
  Sun: siderealSun,
  Moon: siderealMoon,
  Mars: siderealMars,
  Mercury: siderealMercury,
  Jupiter: siderealJupiter,
  Venus: siderealVenus,
  Saturn: siderealSaturn,
  Rahu: siderealRahu,
  Ketu: siderealKetu,
};

function centralLongitudeSpeed(
  jd: number,
  siderealLon: (j: number) => number
): number {
  const e = 0.01;
  const a = siderealLon(jd - e);
  const b = siderealLon(jd + e);
  let diff = normalizeLon(b - a);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff / (2 * e);
}

function saturnLongitude(jd: number): number {
  return siderealSaturn(jd);
}

function sadeSatiInfo(
  natalMoonRashi: number,
  nowJd: number
): {
  present: boolean;
  phase: "rising" | "peak" | "setting" | null;
  startYear: number | null;
  endYear: number | null;
} {
  const satLon = saturnLongitude(nowJd);
  const satSign = rashiFromDegree(satLon);
  const rel = (satSign - natalMoonRashi + 12) % 12;
  let phase: "rising" | "peak" | "setting" | null = null;
  if (rel === 11) phase = "rising";
  else if (rel === 0) phase = "peak";
  else if (rel === 1) phase = "setting";

  const present = rel === 11 || rel === 0 || rel === 1;

  let startYear: number | null = null;
  let endYear: number | null = null;
  if (present) {
    const inPhase = (jd: number) => {
      const sl = saturnLongitude(jd);
      const s = rashiFromDegree(sl);
      const r = (s - natalMoonRashi + 12) % 12;
      return r === 11 || r === 0 || r === 1;
    };
    let js = nowJd;
    const maxBack = 10000;
    let steps = 0;
    while (steps < maxBack && inPhase(js)) {
      js -= 1;
      steps++;
    }
    const phaseStart = js + 1;
    let je = nowJd;
    steps = 0;
    while (steps < maxBack && inPhase(je)) {
      je += 1;
      steps++;
    }
    const phaseEnd = je - 1;
    startYear = parseInt(jdToIso(phaseStart).slice(0, 4), 10);
    endYear = parseInt(jdToIso(phaseEnd).slice(0, 4), 10);
  }

  return { present, phase, startYear, endYear };
}

function kaalsarp(
  rahuLon: number,
  bodies: { key: PlanetKey; lon: number }[]
): { present: boolean; type: string } {
  const seven = bodies.filter((b) =>
    ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(
      b.key
    )
  );
  const r = normalizeLon(rahuLon);
  const inFirstSemi = (lon: number) => {
    const d = normalizeLon(lon - r);
    return d > 0 && d < 180;
  };
  const allFirst = seven.every((b) => inFirstSemi(b.lon));
  const allSecond = seven.every((b) => !inFirstSemi(b.lon));
  const present = allFirst || allSecond;
  return {
    present,
    type: present
      ? allFirst
        ? "All classical planets hemmed between Rahu and Ketu (same half)"
        : "All classical planets on opposite arc"
      : "Not all planets confined to one arc between nodes",
  };
}

function sameHouse(a: number, b: number, asc: number): boolean {
  return houseFromDeg(a, asc) === houseFromDeg(b, asc);
}

function conjunctionException(
  marsLon: number,
  jupiterLon: number,
  asc: number
): boolean {
  return sameHouse(marsLon, jupiterLon, asc);
}

/** Sidereal ascendant: LMST-based when birth time known; else Sun longitude. */
function computeSiderealAscendant(
  birthJd: number,
  input: KundliInput,
  approximate: boolean,
  sunSidereal: number
): number {
  if (approximate) {
    return sunSidereal;
  }
  const T = (birthJd - J2000) / 36525;
  const ut = utcHourFractionFromJd(birthJd);
  let LMST = 100.4606184 + 36000.77004 * T + input.lng / 15 + ut;
  LMST = normalizeLon(LMST);
  const obliquity = 23.44;
  const ascDeg = normalizeLon(
    LMST + obliquity * Math.sin((LMST * Math.PI) / 180)
  );
  return normalizeLon(ascDeg - ayanamsaSimplified(birthJd));
}

export function computeKundli(input: KundliInput) {
  const utcOffset = resolveUtcOffset(input);
  const merged: KundliInput = { ...input, utcOffset };

  const { jd: birthJd, approximate } = julianDayUTFromBirth(merged, utcOffset);
  const now = new Date();
  const nowJd = now.getTime() / 86400000 + JD_UNIX_EPOCH;

  const raw: Record<string, { longitude: number; longitudeSpeed: number }> =
    {};
  const order: PlanetKey[] = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
    "Ketu",
  ];

  for (const key of order) {
    const getLon = SIDEREAL_GETTERS[key];
    raw[key] = {
      longitude: getLon(birthJd),
      longitudeSpeed: centralLongitudeSpeed(birthJd, getLon),
    };
  }

  const ascDeg = computeSiderealAscendant(
    birthJd,
    merged,
    approximate,
    raw["Sun"].longitude
  );

  const moonLon = raw["Moon"].longitude;
  const sunLon = raw["Sun"].longitude;
  const marsLon = raw["Mars"].longitude;
  const mercLon = raw["Mercury"].longitude;
  const jupLon = raw["Jupiter"].longitude;

  const span = 360 / 27;
  const nakIndex = Math.floor(moonLon / span) % 27;
  const nakLord = NAKSHATRA_LORDS[nakIndex];
  const moonWithin = moonLon - nakIndex * span;
  const pada = Math.floor(moonWithin / (span / 4)) + 1;

  const moonRashi = rashiFromDegree(moonLon);
  const sunRashi = rashiFromDegree(sunLon);
  const ascRashi = rashiFromDegree(ascDeg);

  const houseOf = (lon: number) => houseFromDeg(lon, ascDeg);
  const marsHouse = houseOf(marsLon);
  const marsFromMoon = houseFromDeg(marsLon, moonLon);

  const marsRashi = rashiFromDegree(marsLon);
  const marsOwn = ownSigns.Mars.includes(marsRashi);
  const marsExalted = exaltationSign.Mars === marsRashi;
  const marsWithJup = conjunctionException(marsLon, jupLon, ascDeg);
  const exceptionList: string[] = [];
  if (marsOwn) exceptionList.push("Mars in own sign (Aries/Scorpio)");
  if (marsExalted) exceptionList.push("Mars exalted in Capricorn");
  if (marsWithJup) exceptionList.push("Mars with Jupiter (same house)");

  const badHouses = [1, 2, 4, 7, 8, 12];
  const fromLagna = badHouses.includes(marsHouse);
  const fromMoon = badHouses.includes(marsFromMoon);
  const placementRisk = fromLagna || fromMoon;
  const mangalPresent =
    placementRisk && !marsOwn && !marsExalted && !marsWithJup;

  let mangalType = "None";
  if (fromLagna && fromMoon) mangalType = "Lagna and Chandra Mangal";
  else if (fromLagna) mangalType = "From Lagna";
  else if (fromMoon) mangalType = "Chandra Mangal";

  let severity: "mild" | "moderate" | "severe" = "mild";
  if (!placementRisk) severity = "mild";
  else if (marsOwn || marsExalted || marsWithJup) severity = "mild";
  else if (fromLagna && fromMoon) severity = "severe";
  else if (fromLagna || fromMoon) severity = "moderate";

  const dasha = vimshottariStateSimple(moonLon, birthJd, nowJd);

  const ninthRashi = rashiFromDegree(normalizeLon(ascDeg + 8 * 30));
  const tenthRashi = rashiFromDegree(normalizeLon(ascDeg + 9 * 30));
  const lord9 = signLordPlanetKey(ninthRashi);
  const lord10 = signLordPlanetKey(tenthRashi);
  const lord9Lon = raw[lord9].longitude;
  const lord10Lon = raw[lord10].longitude;
  const dharmaKarmadhipati =
    sameHouse(lord9Lon, lord10Lon, ascDeg) ||
    Math.abs(normalizeLon(lord9Lon - lord10Lon)) < 8;

  const yogas = [
    {
      name: "Gaja Kesari Yoga",
      sanskritName: "Gaja Kesari",
      present: [1, 4, 7, 10].includes(houseFromDeg(jupLon, moonLon)),
      planets: ["Jupiter", "Moon"],
      description: "Jupiter in kendra from Moon",
      effect: "Wisdom, recognition, and stability of mind when present.",
    },
    {
      name: "Budh Aditya Yoga",
      sanskritName: "Budhaditya",
      present: sameHouse(sunLon, mercLon, ascDeg),
      planets: ["Sun", "Mercury"],
      description: "Sun and Mercury together",
      effect: "Sharp intellect and communicative strength.",
    },
    {
      name: "Chandra Mangal Yoga",
      sanskritName: "Chandra Mangal",
      present: sameHouse(moonLon, marsLon, ascDeg),
      planets: ["Moon", "Mars"],
      description: "Moon and Mars together",
      effect: "Drive, passion, and entrepreneurial energy.",
    },
    {
      name: "Dharma Karmadhipati Yoga",
      sanskritName: "Dharma Karmadhipati",
      present: dharmaKarmadhipati,
      planets: [lord9, lord10],
      description: "9th and 10th lords joined",
      effect: "Alignment of purpose and profession; leadership dharma.",
    },
  ];

  const planetRows: Array<{
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
  }> = [];

  for (const key of order) {
    const lon = raw[key].longitude;
    const sp = raw[key].longitudeSpeed;
    const rIx = rashiFromDegree(lon);
    const within = normalizeLon(lon) % 30;
    const dm = degreesToDMS(within);
    const info = planetInfo(key);
    planetRows.push({
      name: key,
      sanskrit: info.sanskrit,
      symbol: info.symbol,
      longitude: normalizeLon(lon),
      rashi: RASHI_NAMES[rIx] ?? "",
      house: houseOf(lon),
      degree: dm.degrees,
      minutes: dm.minutes,
      isRetrograde: sp < 0,
      isExalted: exaltationSign[key] === rIx,
      isDebilitated: debilitationSign[key] === rIx,
      ownSign: ownSigns[key]?.includes(rIx) ?? false,
    });
  }

  const planetHouseMap: Record<string, number> = {};
  for (const row of planetRows) {
    planetHouseMap[row.name] = row.house;
  }

  const houseRashis: string[] = [];
  for (let n = 1; n <= 12; n++) {
    const startDeg = normalizeLon(ascDeg + (n - 1) * 30);
    houseRashis.push(RASHI_NAMES[rashiFromDegree(startDeg)] ?? "");
  }

  const houses = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const startDeg = normalizeLon(ascDeg + (n - 1) * 30);
    const rIx = rashiFromDegree(startDeg);
    const lord = rashiFromIndex(rIx).lord;
    const inHouse = order.filter((k) => houseOf(raw[k].longitude) === n);
    return {
      number: n,
      rashi: RASHI_NAMES[rIx] ?? "",
      lord,
      planets: inHouse,
    };
  });

  const sade = sadeSatiInfo(moonRashi, nowJd);
  const ks = kaalsarp(
    raw["Rahu"].longitude,
    order.map((k) => ({ key: k, lon: raw[k].longitude }))
  );

  const lagnaInfo = rashiFromIndex(ascRashi);
  const tenth = houses[9];
  const seventh = houses[6];
  const sixth = houses[5];
  const second = houses[1];
  const eleventh = houses[10];

  const predictions = {
    personality: `Lagna in ${lagnaInfo.name.split(" ")[0]} (${lagnaInfo.element}) emphasizes ${lagnaInfo.lord}-ruled themes in self-expression and vitality.`,
    career: `The 10th house (${tenth.rashi}) and its lord ${tenth.lord}, with planets ${tenth.planets.join(", ") || "none"} there, shape career direction and public reputation.`,
    marriage: `The 7th house (${seventh.rashi}) and occupants ${seventh.planets.join(", ") || "none"} describe partnership patterns and spouse significations.`,
    health: `The 6th (${sixth.rashi}) and Lagna (${lagnaInfo.name}) together indicate routines, resilience, and health focus areas.`,
    finance: `Wealth houses 2 (${second.rashi}) and 11 (${eleventh.rashi}), with planets ${second.planets.join(", ")} and ${eleventh.planets.join(", ")}, outline earning and gains.`,
    currentPeriod: `Ongoing ${dasha.mahadasha.planet} Mahadasha with ${dasha.antardasha.planet} Antardasha highlights themes tied to those planetary karakas.`,
  };

  return {
    birthTimeApproximate: approximate,
    basicInfo: {
      name: input.name,
      gender: input.gender,
      dob: input.dob,
      tob: input.tob,
      pob: input.pob,
      sunSign: {
        rashi: RASHI_NAMES[sunRashi] ?? "",
        degree: degreesToDMS(normalizeLon(sunLon) % 30).degrees,
        minutes: degreesToDMS(normalizeLon(sunLon) % 30).minutes,
      },
      moonSign: {
        rashi: RASHI_NAMES[moonRashi] ?? "",
        degree: degreesToDMS(normalizeLon(moonLon) % 30).degrees,
      },
      ascendant: {
        rashi: RASHI_NAMES[ascRashi] ?? "",
        degree: degreesToDMS(normalizeLon(ascDeg) % 30).degrees,
      },
      nakshatra: {
        name: NAKSHATRA_NAMES[nakIndex] ?? "",
        lord: nakLord,
        pada,
      },
      numerologyNumber: chaldeanNumerology(input.name),
    },
    planets: planetRows,
    houses,
    dasha,
    doshas: {
      mangalDosha: {
        present: mangalPresent,
        type: mangalType,
        exceptions: exceptionList,
        severity,
      },
      sadeSati: sade,
      kaalsarpDosha: ks,
    },
    yogas,
    predictions,
    chartData: {
      houseRashis,
      planetHouseMap,
    },
  };
}
