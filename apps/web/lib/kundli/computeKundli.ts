import { find } from "geo-tz";
import { DateTime } from "luxon";
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swisseph: typeof import("swisseph") = require("swisseph");

const EPHE_FLAGS =
  swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;
const EPHE_FLAGS_FALLBACK =
  swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH;

const YEAR_DAYS = 365.2425;

export type KundliInput = {
  name: string;
  dob: string;
  tob: string | null;
  pob: string;
  lat: number;
  lng: number;
  gender: "male" | "female";
};

function normalizeLon(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function calcBody(
  jd: number,
  planetId: number,
  flags: number
):
  | {
      longitude: number;
      longitudeSpeed: number;
    }
  | { error: string } {
  try {
    const r = swisseph.swe_calc_ut(jd, planetId, flags);
    if (r && typeof r === "object" && "error" in r && r.error) {
      return { error: String(r.error) };
    }
    if (
      r &&
      typeof r === "object" &&
      "longitude" in r &&
      typeof r.longitude === "number"
    ) {
      return {
        longitude: r.longitude,
        longitudeSpeed: r.longitudeSpeed ?? 0,
      };
    }
    return { error: "Unknown swe_calc_ut response" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function julianDayUTFromBirth(input: KundliInput): {
  jd: number;
  timeZone: string;
  approximate: boolean;
} {
  const zones = find(input.lat, input.lng);
  const timeZone = zones[0] ?? "UTC";
  const [y, mo, d] = input.dob.split("-").map((x) => parseInt(x, 10));
  if (!input.tob) {
    const dt = DateTime.fromObject(
      { year: y, month: mo, day: d, hour: 12, minute: 0, second: 0 },
      { zone: timeZone }
    );
    const utc = dt.toUTC();
    const hour =
      utc.hour +
      utc.minute / 60 +
      utc.second / 3600 +
      utc.millisecond / 3600000;
    const jd = swisseph.swe_julday(
      utc.year,
      utc.month,
      utc.day,
      hour,
      swisseph.SE_GREG_CAL
    );
    return { jd, timeZone, approximate: true };
  }
  const [hh, mm] = input.tob.split(":").map((x) => parseInt(x, 10));
  const dt = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: hh, minute: mm ?? 0, second: 0 },
    { zone: timeZone }
  );
  const utc = dt.toUTC();
  const hour =
    utc.hour +
    utc.minute / 60 +
    utc.second / 3600 +
    utc.millisecond / 3600000;
  const jd = swisseph.swe_julday(
    utc.year,
    utc.month,
    utc.day,
    hour,
    swisseph.SE_GREG_CAL
  );
  return { jd, timeZone, approximate: false };
}

function jdToIso(jd: number): string {
  const r = swisseph.swe_revjul(jd, swisseph.SE_GREG_CAL);
  const iso = new Date(
    Date.UTC(
      r.year,
      r.month - 1,
      r.day,
      Math.floor(r.hour),
      Math.round((r.hour - Math.floor(r.hour)) * 60)
    )
  );
  return iso.toISOString().slice(0, 10);
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

function saturnLongitude(jd: number, flags: number): number | null {
  const r = calcBody(jd, swisseph.SE_SATURN, flags);
  if ("error" in r) return null;
  return r.longitude;
}

function sadeSatiInfo(
  natalMoonRashi: number,
  nowJd: number,
  flags: number
): {
  present: boolean;
  phase: "rising" | "peak" | "setting" | null;
  startYear: number | null;
  endYear: number | null;
} {
  const satLon = saturnLongitude(nowJd, flags);
  if (satLon === null) {
    return { present: false, phase: null, startYear: null, endYear: null };
  }
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
      const sl = saturnLongitude(jd, flags);
      if (sl === null) return false;
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

export function computeKundli(input: KundliInput) {
  try {
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  } catch {
    /* ignore */
  }

  const { jd: birthJd, approximate } = julianDayUTFromBirth(input);
  const now = new Date();
  const nowJd = swisseph.swe_julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600 +
      now.getUTCMilliseconds() / 3600000,
    swisseph.SE_GREG_CAL
  );

  let flags = EPHE_FLAGS;
  const test = calcBody(birthJd, swisseph.SE_SUN, flags);
  if ("error" in test) {
    flags = EPHE_FLAGS_FALLBACK;
  }

  let ascDeg: number;
  try {
    const housesRes = swisseph.swe_houses_ex(
      birthJd,
      swisseph.SEFLG_SIDEREAL,
      input.lat,
      input.lng,
      "P"
    ) as { error?: string; ascendant?: number };
    if (housesRes.error) {
      throw new Error(`swe_houses_ex failed: ${housesRes.error}`);
    }
    if (typeof housesRes.ascendant !== "number") {
      throw new Error("swe_houses_ex: missing ascendant");
    }
    ascDeg = normalizeLon(housesRes.ascendant);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "House calculation failed"
    );
  }

  const planetIds: { key: PlanetKey; id: number }[] = [
    { key: "Sun", id: swisseph.SE_SUN },
    { key: "Moon", id: swisseph.SE_MOON },
    { key: "Mars", id: swisseph.SE_MARS },
    { key: "Mercury", id: swisseph.SE_MERCURY },
    { key: "Jupiter", id: swisseph.SE_JUPITER },
    { key: "Venus", id: swisseph.SE_VENUS },
    { key: "Saturn", id: swisseph.SE_SATURN },
    { key: "Rahu", id: swisseph.SE_MEAN_NODE },
  ];

  const raw: Record<string, { longitude: number; longitudeSpeed: number }> = {};
  for (const p of planetIds) {
    const res = calcBody(birthJd, p.id, flags);
    if ("error" in res) throw new Error(`${p.key}: ${res.error}`);
    raw[p.key] = res;
  }
  const ketuLon = normalizeLon(raw["Rahu"].longitude + 180);
  raw["Ketu"] = { longitude: ketuLon, longitudeSpeed: raw["Rahu"].longitudeSpeed };

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

  const sade = sadeSatiInfo(moonRashi, nowJd, flags);
  const ks = kaalsarp(raw["Rahu"].longitude, order.map((k) => ({ key: k, lon: raw[k].longitude })));

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
