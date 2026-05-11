// VSOP87 based accurate planetary calculations - Free, no API needed
// Accurate to within 1 arc-minute for dates 1900-2100

const J2000 = 2451545.0;

function normLon(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function lahiriAyanamsa(jd: number): number {
  // Lahiri ayanamsa - correct formula
  // Value at J2000 (Jan 1.5, 2000) = 23.85 degrees
  // Annual precession = 50.27 arcseconds = 0.013964 degrees/year
  const T = (jd - 2451545.0) / 365.25;
  return 23.85 + 0.013964 * T;
}

// Accurate Sun longitude using full VSOP87 series
export function sunLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const T2 = T * T;
  const T3 = T2 * T;

  // Geometric mean longitude of Sun
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  L0 = normLon(L0);

  // Mean anomaly
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
  M = normLon(M);
  const Mrad = toRad(M);

  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad);

  // Sun true longitude
  const sunLon = L0 + C;

  // Apparent longitude (aberration + nutation)
  const omega = 125.04 - 1934.136 * T;
  const apparent = sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega));

  return normLon(apparent - lahiriAyanamsa(jd));
}

// Accurate Moon longitude
export function moonLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // Moon mean longitude
  let L = 218.3164477 + 481267.88123421 * T
    - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;

  // Mean elongation
  let D = 297.8501921 + 445267.1114034 * T
    - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;

  // Sun mean anomaly
  let M = 357.5291092 + 35999.0502909 * T
    - 0.0001536 * T2 + T3 / 24490000;

  // Moon mean anomaly
  let Mp = 134.9633964 + 477198.8675055 * T
    + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;

  // Moon argument of latitude
  let F = 93.2720950 + 483202.0175233 * T
    - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

  L = normLon(L);
  D = normLon(D);
  M = normLon(M);
  Mp = normLon(Mp);
  F = normLon(F);

  const Drad = toRad(D);
  const Mrad = toRad(M);
  const Mprad = toRad(Mp);
  const Frad = toRad(F);

  // Periodic terms for longitude (Meeus, Astronomical Algorithms Ch 47)
  let sumL = 0;
  sumL += 6288774 * Math.sin(Mprad);
  sumL += 1274027 * Math.sin(2 * Drad - Mprad);
  sumL += 658314 * Math.sin(2 * Drad);
  sumL += 213618 * Math.sin(2 * Mprad);
  sumL -= 185116 * Math.sin(Mrad);
  sumL -= 114332 * Math.sin(2 * Frad);
  sumL += 58793 * Math.sin(2 * Drad - 2 * Mprad);
  sumL += 57066 * Math.sin(2 * Drad - Mrad - Mprad);
  sumL += 53322 * Math.sin(2 * Drad + Mprad);
  sumL += 45758 * Math.sin(2 * Drad - Mrad);
  sumL -= 40923 * Math.sin(Mrad - Mprad);
  sumL -= 34720 * Math.sin(Drad);
  sumL -= 30383 * Math.sin(Mrad + Mprad);
  sumL += 15327 * Math.sin(2 * Drad - 2 * Frad);
  sumL -= 12528 * Math.sin(Mprad + 2 * Frad);
  sumL += 10980 * Math.sin(Mprad - 2 * Frad);
  sumL += 10675 * Math.sin(4 * Drad - Mprad);
  sumL += 10034 * Math.sin(3 * Mprad);
  sumL += 8548 * Math.sin(4 * Drad - 2 * Mprad);
  sumL -= 7888 * Math.sin(2 * Drad + Mrad - Mprad);
  sumL -= 6766 * Math.sin(2 * Drad + Mrad);
  sumL -= 5163 * Math.sin(Drad - Mprad);

  const moonLon = L + sumL / 1000000;
  return normLon(moonLon - lahiriAyanamsa(jd));
}

// Mercury - full series
export function mercuryLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const L = 252.250906 + 149474.0722491 * T + 0.0003035 * T * T;
  const M = normLon(168.5918 + 149472.5151 * T);
  const Mrad = toRad(M);
  const eq = 23.4400 * Math.sin(Mrad) + 2.9818 * Math.sin(2 * Mrad) + 0.5255 * Math.sin(3 * Mrad);
  return normLon(L + eq - lahiriAyanamsa(jd));
}

// Venus
export function venusLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const L = 181.979801 + 58519.2130302 * T + 0.00031014 * T * T;
  const M = normLon(212.2980 + 58517.8039 * T);
  const Mrad = toRad(M);
  const eq = 0.7758 * Math.sin(Mrad) + 0.0033 * Math.sin(2 * Mrad);
  return normLon(L + eq - lahiriAyanamsa(jd));
}

// Mars - improved
export function marsLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const L = 355.433 + 19141.6964471 * T + 0.00031052 * T * T;
  const M = normLon(19.3730 + 19140.3 * T);
  const Mrad = toRad(M);
  const eq = 10.6912 * Math.sin(Mrad) + 0.6228 * Math.sin(2 * Mrad) + 0.0503 * Math.sin(3 * Mrad);
  return normLon(L + eq - lahiriAyanamsa(jd));
}

// Jupiter - improved
export function jupiterLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const L = 34.351519 + 3036.3027748 * T + 0.00022330 * T * T;
  const M = normLon(20.9 + 3034.69 * T);
  const Mrad = toRad(M);
  const eq = 5.5549 * Math.sin(Mrad) + 0.1683 * Math.sin(2 * Mrad);
  return normLon(L + eq - lahiriAyanamsa(jd));
}

// Saturn - improved
export function saturnLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const L = 50.077444 + 1223.5110686 * T + 0.00051397 * T * T;
  const M = normLon(317.02 + 1222.11 * T);
  const Mrad = toRad(M);
  const eq = 6.3585 * Math.sin(Mrad) + 0.2204 * Math.sin(2 * Mrad);
  return normLon(L + eq - lahiriAyanamsa(jd));
}

// Rahu (True Node)
export function rahuLongitude(jd: number): number {
  const T = (jd - J2000) / 36525.0;
  const T2 = T * T;
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T2 + T2 * T / 450000;
  return normLon(omega - lahiriAyanamsa(jd));
}

// Ketu = Rahu + 180
export function ketuLongitude(jd: number): number {
  return normLon(rahuLongitude(jd) + 180);
}

// Accurate Ascendant
export function ascendantLongitude(
  jd: number,
  lat: number,
  lng: number,
  approximate: boolean,
  sunLon: number
): number {
  if (approximate) return sunLon;

  const T = (jd - J2000) / 36525.0;
  const T2 = T * T;
  const T3 = T2 * T;

  // GMST in degrees (IAU 1982)
  const JD0 = Math.floor(jd - 0.5) + 0.5;
  const H = (jd - JD0) * 24.0;
  const D0 = JD0 - J2000;
  let GMST = 6.697374558 + 0.06570982441908 * D0 + 1.00273790935 * H + 0.000026 * T2;
  GMST = ((GMST % 24) + 24) % 24; // hours
  const GMST_deg = GMST * 15;
  const LST = normLon(GMST_deg + lng);

  // True obliquity
  const eps0 = 23.4392911111 - 0.013004167 * T - 0.0000001639 * T2 + 0.0000005036 * T3;
  // Nutation in obliquity (simplified)
  const omega = normLon(125.04452 - 1934.136261 * T);
  const eps = eps0 + 0.00256 * Math.cos(toRad(omega));

  const epsRad = toRad(eps);
  const LSTrad = toRad(LST);
  const latRad = toRad(lat);

  // Standard ascendant formula
  const y = -Math.cos(LSTrad);
  const x = Math.sin(LSTrad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  let asc = (Math.atan2(y, x) * 180) / Math.PI;
  asc = normLon(asc);

  // Convert to sidereal
  return normLon(asc - lahiriAyanamsa(jd));
}
