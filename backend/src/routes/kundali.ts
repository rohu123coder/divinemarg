import express from "express";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);

const router = express.Router();

let swisseph: any = null;
try {
  swisseph = require("swisseph");
  // Try multiple ephe paths
  const paths = [
    path.join(process.cwd(), "ephe"),
    path.join(process.cwd(), "node_modules/swisseph/ephe"),
    path.join(__dirname, "../../node_modules/swisseph/ephe"),
    "/app/node_modules/swisseph/ephe",
  ];
  for (const p of paths) {
    try {
      swisseph.swe_set_ephe_path(p);
      break;
    } catch {}
  }
  console.log("[Kundali] swisseph loaded successfully");
} catch (e) {
  console.error("[Kundali] swisseph load error:", e);
}

const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_TRUE_NODE = 11;
const SE_SIDM_LAHIRI = 1;
const SEFLG_SIDEREAL = 64;
const SEFLG_SPEED = 256;

const RASHI_NAMES = [
  "Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)",
  "Kark (Cancer)", "Singh (Leo)", "Kanya (Virgo)",
  "Tula (Libra)", "Vrishchik (Scorpio)", "Dhanu (Sagittarius)",
  "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)"
];

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
  "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
  "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
];

const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter",
  "Saturn", "Mercury", "Ketu", "Venus", "Sun", "Moon", "Mars",
  "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

function dateToJD(year: number, month: number, day: number, hour: number, minute: number, utcOffset: number): number {
  const utHour = hour + minute / 60 - utcOffset;
  const jd = swisseph.swe_julday(year, month, day, utHour, swisseph.SE_GREG_CAL);
  return jd;
}

function getPlanetLon(jd: number, planet: number): number {
  // Get tropical position first (no sidereal flag)
  const result = swisseph.swe_calc_ut(jd, planet, SEFLG_SPEED);
  if (result.error) throw new Error(result.error);
  const tropical = ((result.longitude % 360) + 360) % 360;
  
  // Get Lahiri ayanamsa
  swisseph.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(jd);
  
  // Subtract ayanamsa to get sidereal
  let sidereal = tropical - ayanamsa;
  if (sidereal < 0) sidereal += 360;
  return sidereal;
}

function getAscendant(jd: number, lat: number, lon: number): number {
  // Use tropical houses then convert to sidereal manually
  const houses = swisseph.swe_houses(jd, lat, lon, "P");
  if (houses.error) throw new Error(houses.error);
  
  // Get ayanamsa
  swisseph.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(jd);
  
  // Convert tropical ascendant to sidereal
  let siderealAsc = houses.ascendant - ayanamsa;
  if (siderealAsc < 0) siderealAsc += 360;
  if (siderealAsc >= 360) siderealAsc -= 360;
  return siderealAsc;
}

function rashiFromLon(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30);
}

function nakshatraFromLon(lon: number): { name: string; lord: string; pada: number } {
  const normalLon = ((lon % 360) + 360) % 360;
  const nakIndex = Math.floor(normalLon / (360 / 27));
  const within = normalLon - nakIndex * (360 / 27);
  const pada = Math.floor(within / ((360 / 27) / 4)) + 1;
  return {
    name: NAKSHATRA_NAMES[nakIndex] ?? "",
    lord: NAKSHATRA_LORDS[nakIndex] ?? "",
    pada
  };
}

export type KundaliCalculateInput = {
  dob: string;
  tob?: string | null;
  lat: number;
  lng: number;
  utcOffset?: number;
};

/** Shared calculation used by POST /calculate and astrologer customer-kundli (no HTTP self-call). */
export function calculateKundaliFromInput(input: KundaliCalculateInput) {
  if (!swisseph) {
    throw new Error("Swiss Ephemeris not available");
  }

  swisseph.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);

  const { dob, tob, lat, lng, utcOffset = 5.5 } = input;

  if (!dob || lat === undefined || lng === undefined) {
    throw new Error("Missing required fields: dob, lat, lng");
  }

  const [year, month, day] = dob.split("-").map(Number);
  let hour = 12,
    minute = 0;
  const tobStr =
    typeof tob === "string" && tob.trim().length > 0 ? tob.trim().slice(0, 5) : undefined;
  if (tobStr) {
    const [h, m] = tobStr.split(":").map(Number);
    hour = h;
    minute = m;
  }

  const jd = dateToJD(year, month, day, hour, minute, utcOffset);
  const approximate = !tobStr;

  const sunLon = getPlanetLon(jd, SE_SUN);
  const moonLon = getPlanetLon(jd, SE_MOON);
  const marsLon = getPlanetLon(jd, SE_MARS);
  const mercLon = getPlanetLon(jd, SE_MERCURY);
  const jupLon = getPlanetLon(jd, SE_JUPITER);
  const venLon = getPlanetLon(jd, SE_VENUS);
  const satLon = getPlanetLon(jd, SE_SATURN);
  const rahuLon = getPlanetLon(jd, SE_TRUE_NODE);
  const ketuLon = ((rahuLon + 180) % 360 + 360) % 360;

  const ascLon = approximate ? sunLon : getAscendant(jd, lat, lng);

  const moonNak = nakshatraFromLon(moonLon);

  const planets = [
    { name: "Sun", longitude: sunLon, rashi: RASHI_NAMES[rashiFromLon(sunLon)], rashiIndex: rashiFromLon(sunLon) },
    { name: "Moon", longitude: moonLon, rashi: RASHI_NAMES[rashiFromLon(moonLon)], rashiIndex: rashiFromLon(moonLon) },
    { name: "Mars", longitude: marsLon, rashi: RASHI_NAMES[rashiFromLon(marsLon)], rashiIndex: rashiFromLon(marsLon) },
    { name: "Mercury", longitude: mercLon, rashi: RASHI_NAMES[rashiFromLon(mercLon)], rashiIndex: rashiFromLon(mercLon) },
    { name: "Jupiter", longitude: jupLon, rashi: RASHI_NAMES[rashiFromLon(jupLon)], rashiIndex: rashiFromLon(jupLon) },
    { name: "Venus", longitude: venLon, rashi: RASHI_NAMES[rashiFromLon(venLon)], rashiIndex: rashiFromLon(venLon) },
    { name: "Saturn", longitude: satLon, rashi: RASHI_NAMES[rashiFromLon(satLon)], rashiIndex: rashiFromLon(satLon) },
    { name: "Rahu", longitude: rahuLon, rashi: RASHI_NAMES[rashiFromLon(rahuLon)], rashiIndex: rashiFromLon(rahuLon) },
    { name: "Ketu", longitude: ketuLon, rashi: RASHI_NAMES[rashiFromLon(ketuLon)], rashiIndex: rashiFromLon(ketuLon) },
  ];

  return {
    ascendant: {
      longitude: ascLon,
      rashi: RASHI_NAMES[rashiFromLon(ascLon)],
      rashiIndex: rashiFromLon(ascLon),
      degree: Math.floor(ascLon % 30),
    },
    moonSign: {
      rashi: RASHI_NAMES[rashiFromLon(moonLon)],
      rashiIndex: rashiFromLon(moonLon),
      degree: Math.floor(moonLon % 30),
    },
    sunSign: {
      rashi: RASHI_NAMES[rashiFromLon(sunLon)],
      rashiIndex: rashiFromLon(sunLon),
      degree: Math.floor(sunLon % 30),
    },
    nakshatra: {
      name: moonNak.name,
      lord: moonNak.lord,
      pada: moonNak.pada,
    },
    planets,
    approximate,
  };
}

router.post("/calculate", async (req, res) => {
  try {
    const { dob, tob, lat, lng, utcOffset = 5.5 } = req.body;

    if (!dob || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Missing required fields: dob, lat, lng" });
    }

    const latN = Number(lat);
    const lngN = Number(lng);
    const utcN = Number(utcOffset);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      return res.status(400).json({ error: "lat and lng must be numbers" });
    }

    const data = calculateKundaliFromInput({
      dob,
      tob,
      lat: latN,
      lng: lngN,
      utcOffset: Number.isFinite(utcN) ? utcN : 5.5,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Calculation failed";
    console.error("Kundali calculation error:", e);
    const status = msg.includes("Missing required fields") ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
});

export default router;
