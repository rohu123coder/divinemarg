"use client";

import Link from "next/link";
import { useState } from "react";
import { KundliChart } from "./components/KundliChart";
import { KundliForm } from "./components/KundliForm";
import type { KundliCalculateResponse } from "./types";

function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-violet-950 sm:text-2xl">
        {children}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

const PROFESSION_MAP: Record<string, string[]> = {
  Mesh: [
    "Entrepreneur",
    "Military/Defense",
    "Sports",
    "Engineering",
    "Police Services",
    "Startup Leadership",
    "Surgery",
  ],
  Vrishabh: [
    "Banking",
    "Finance",
    "Luxury Retail",
    "Hospitality",
    "Music Industry",
    "Food Business",
    "Interior Design",
  ],
  Mithun: [
    "Marketing",
    "Media",
    "Content Strategy",
    "Teaching",
    "Sales",
    "Consulting",
    "Product Communication",
  ],
  Kark: [
    "Counseling",
    "Healthcare",
    "Education",
    "Real Estate",
    "Hospitality",
    "Public Service",
    "Care Management",
  ],
  Singh: [
    "Government Roles",
    "Administration",
    "Politics",
    "Entertainment",
    "Brand Leadership",
    "Public Relations",
    "Corporate Management",
  ],
  Kanya: [
    "Data Analytics",
    "Healthcare Operations",
    "Accounting",
    "Audit",
    "Quality Assurance",
    "Research",
    "Compliance",
  ],
  Tula: [
    "Law",
    "Diplomacy",
    "Human Resources",
    "Design",
    "Brand Strategy",
    "Mediation",
    "Client Partnerships",
  ],
  Vrishchik: [
    "Investigation",
    "Cyber Security",
    "Psychology",
    "Surgery",
    "Risk Management",
    "Intelligence Services",
    "Forensics",
  ],
  Dhanu: [
    "Teaching",
    "Law",
    "Publishing",
    "International Business",
    "Travel Industry",
    "Consulting",
    "Spiritual Coaching",
  ],
  Makar: [
    "Operations Leadership",
    "Engineering",
    "Infrastructure",
    "Administration",
    "Governance",
    "Project Management",
    "Enterprise Strategy",
  ],
  Kumbh: [
    "Technology",
    "AI/Data Science",
    "Social Impact",
    "Policy Innovation",
    "Network Architecture",
    "Product R&D",
    "Digital Platforms",
  ],
  Meen: [
    "Healing Arts",
    "Creative Writing",
    "Cinema/Media",
    "Spiritual Services",
    "NGO/Charity",
    "Psychology",
    "Design",
  ],
};

const LUCKY_MAP: Record<
  string,
  { colors: string[]; days: string[]; gemstone: string; instruction: string; rudraksha: string }
> = {
  Mesh: {
    colors: ["Red", "Saffron", "Coral"],
    days: ["Tuesday", "Sunday"],
    gemstone: "Red Coral",
    instruction: "Wear in copper or gold on right-hand ring finger on Tuesday morning after Hanuman puja.",
    rudraksha: "3 Mukhi Rudraksha",
  },
  Vrishabh: {
    colors: ["White", "Pastel Pink", "Sky Blue"],
    days: ["Friday", "Monday"],
    gemstone: "Diamond/White Sapphire",
    instruction: "Wear in silver or platinum on Friday in right-hand middle or ring finger after Lakshmi mantra.",
    rudraksha: "6 Mukhi Rudraksha",
  },
  Mithun: {
    colors: ["Green", "Turquoise", "Light Grey"],
    days: ["Wednesday", "Friday"],
    gemstone: "Emerald",
    instruction: "Wear in gold or silver on Wednesday in little finger after Budh beej mantra.",
    rudraksha: "4 Mukhi Rudraksha",
  },
  Kark: {
    colors: ["Pearl White", "Silver", "Light Blue"],
    days: ["Monday", "Thursday"],
    gemstone: "Pearl",
    instruction: "Wear in silver on little finger on Monday evening after Chandra mantra and milk donation.",
    rudraksha: "2 Mukhi Rudraksha",
  },
  Singh: {
    colors: ["Golden", "Orange", "Ruby Red"],
    days: ["Sunday", "Tuesday"],
    gemstone: "Ruby",
    instruction: "Wear in gold on ring finger on Sunday at sunrise after Surya arghya.",
    rudraksha: "1 Mukhi (or 12 Mukhi) Rudraksha",
  },
  Kanya: {
    colors: ["Green", "Earthy Brown", "Mint"],
    days: ["Wednesday", "Friday"],
    gemstone: "Emerald",
    instruction: "Wear in gold on little finger on Wednesday after reciting Budh mantra 108 times.",
    rudraksha: "4 Mukhi Rudraksha",
  },
  Tula: {
    colors: ["White", "Pastel Blue", "Rose"],
    days: ["Friday", "Wednesday"],
    gemstone: "Diamond/Opal",
    instruction: "Wear in silver/platinum on Friday after Shukra mantra and white flower offering.",
    rudraksha: "6 Mukhi Rudraksha",
  },
  Vrishchik: {
    colors: ["Maroon", "Deep Red", "Rust"],
    days: ["Tuesday", "Thursday"],
    gemstone: "Red Coral",
    instruction: "Wear in copper or gold on Tuesday after Hanuman Chalisa and Mangal mantra.",
    rudraksha: "3 Mukhi Rudraksha",
  },
  Dhanu: {
    colors: ["Yellow", "Saffron", "Cream"],
    days: ["Thursday", "Sunday"],
    gemstone: "Yellow Sapphire",
    instruction: "Wear in gold on index finger on Thursday after Guru mantra and turmeric donation.",
    rudraksha: "5 Mukhi Rudraksha",
  },
  Makar: {
    colors: ["Navy Blue", "Charcoal", "Black"],
    days: ["Saturday", "Wednesday"],
    gemstone: "Blue Sapphire (only after trial)",
    instruction: "Wear in steel/silver on middle finger on Saturday after Shani puja and mustard oil daan.",
    rudraksha: "7 Mukhi Rudraksha",
  },
  Kumbh: {
    colors: ["Electric Blue", "Indigo", "Black"],
    days: ["Saturday", "Friday"],
    gemstone: "Blue Sapphire/Amethyst",
    instruction: "Wear after 72-hour trial, on Saturday in middle finger after Shani beej mantra.",
    rudraksha: "7 Mukhi Rudraksha",
  },
  Meen: {
    colors: ["Yellow", "Sea Green", "Lavender"],
    days: ["Thursday", "Monday"],
    gemstone: "Yellow Sapphire",
    instruction: "Wear in gold on index finger on Thursday morning after Guru puja and banana daan.",
    rudraksha: "5 Mukhi Rudraksha",
  },
};

const PLANET_REMEDIES: Record<
  string,
  {
    mantra: string;
    donation: string;
    fasting: string;
    temple: string;
    colors: string;
  }
> = {
  Sun: {
    mantra: "ॐ घृणि सूर्याय नमः",
    donation: "Donate wheat, jaggery, and copper on Sunday.",
    fasting: "Light Sunday fast till sunset.",
    temple: "Offer water to Surya daily and visit Surya/Hanuman temple.",
    colors: "Wear saffron, orange; avoid dull black on key days.",
  },
  Moon: {
    mantra: "ॐ सोमाय नमः",
    donation: "Donate rice, milk, white sweets on Monday.",
    fasting: "Somvar fast with satvik meals.",
    temple: "Visit Shiva temple on Mondays and offer raw milk.",
    colors: "Wear white and silver tones; avoid dark red on Mondays.",
  },
  Mars: {
    mantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
    donation: "Donate masoor dal and red cloth on Tuesday.",
    fasting: "Mangalvar fast; avoid anger and non-veg.",
    temple: "Visit Hanuman temple on Tuesday and recite Hanuman Chalisa.",
    colors: "Wear red/coral; avoid black on Tuesdays.",
  },
  Mercury: {
    mantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
    donation: "Donate green moong, books, and stationery on Wednesday.",
    fasting: "Budhvar light fast with fruits.",
    temple: "Worship Vishnu/Ganesh and chant Vishnu Sahasranama.",
    colors: "Wear green; avoid overly dark shades on Wednesday.",
  },
  Jupiter: {
    mantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरुवे नमः",
    donation: "Donate chana dal, turmeric, yellow cloth on Thursday.",
    fasting: "Guruvar fast with one satvik meal.",
    temple: "Visit Vishnu or Brihaspati temple on Thursdays.",
    colors: "Wear yellow/saffron; avoid black on Thursdays.",
  },
  Venus: {
    mantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
    donation: "Donate white rice, curd, perfume, white clothes on Friday.",
    fasting: "Shukravar fast for harmony and relationships.",
    temple: "Offer white flowers in Lakshmi temple.",
    colors: "Wear white/pastels; avoid harsh red in conflicts.",
  },
  Saturn: {
    mantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
    donation: "Donate black sesame, mustard oil, blanket on Saturday.",
    fasting: "Shanivar fast till sunset with discipline.",
    temple: "Visit Shani/Hanuman temple and light sesame oil diya.",
    colors: "Wear navy/black moderately; avoid bright flashy tones.",
  },
  Rahu: {
    mantra: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
    donation: "Donate blue cloth, mustard, and coconut on Saturday.",
    fasting: "Fast on Saturdays or during Rahu Kaal remedies.",
    temple: "Visit Durga/Bhairav temple and offer coconut.",
    colors: "Wear smoky blue/grey; avoid neon shades on sensitive days.",
  },
  Ketu: {
    mantra: "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
    donation: "Donate multi-color blanket, sesame, and dog feed on Tuesday/Saturday.",
    fasting: "Simple fast with meditation and silence.",
    temple: "Worship Ganesha and visit Ganpati temple before new beginnings.",
    colors: "Wear earthy tones; avoid chaotic color combinations.",
  },
};

function signKey(rashi: string): string {
  return rashi.split(" ")[0] ?? rashi;
}

function calcStars(result: KundliCalculateResponse, targetHouses: number[]): number {
  const planetBoost = result.planets.filter((p) => targetHouses.includes(p.house)).length;
  const lordBoost = result.houses
    .filter((h) => targetHouses.includes(h.number))
    .reduce((sum, h) => {
      const lord = result.planets.find((p) => p.name === h.lord);
      if (!lord) return sum;
      if (lord.isExalted || lord.ownSign) return sum + 1;
      if ([1, 4, 5, 7, 9, 10].includes(lord.house)) return sum + 1;
      return sum;
    }, 0);

  return Math.max(1, Math.min(5, 2 + Math.floor(planetBoost / 2) + Math.min(2, lordBoost)));
}

function stars(starCount: number) {
  return `${"★".repeat(starCount)}${"☆".repeat(5 - starCount)}`;
}

export default function KundliPage() {
  const [result, setResult] = useState<KundliCalculateResponse | null>(null);
  const lagnaKey = result ? signKey(result.basicInfo.ascendant.rashi) : "";
  const moonKey = result ? signKey(result.basicInfo.moonSign.rashi) : "";
  const sunKey = result ? signKey(result.basicInfo.sunSign.rashi) : "";
  const tenthSign = result ? signKey(result.houses[9]?.rashi ?? "") : "";
  const luckyProfile = LUCKY_MAP[lagnaKey] ?? LUCKY_MAP.Mesh;
  const recommendedProfessions = PROFESSION_MAP[tenthSign] ?? PROFESSION_MAP.Mesh;
  const weakPlanets = result
    ? result.planets
        .filter((p) => p.isDebilitated || ([6, 8, 12].includes(p.house) && !p.isExalted))
        .slice(0, 3)
    : [];
  const remedyPlanets = weakPlanets.length
    ? weakPlanets
    : result
      ? result.planets.slice(0, 2)
      : [];

  const ratings = result
    ? [
        { area: "Personality", value: calcStars(result, [1]) },
        { area: "Career", value: calcStars(result, [10, 6]) },
        { area: "Marriage", value: calcStars(result, [7]) },
        { area: "Health", value: calcStars(result, [1, 6]) },
        { area: "Finance", value: calcStars(result, [2, 11]) },
      ]
    : [];

  const onShare = async () => {
    const shareText = `My Kundli: Lagna ${result?.basicInfo.ascendant.rashi}, Moon ${result?.basicInfo.moonSign.rashi}, current Mahadasha ${result?.dasha.mahadasha.planet}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My DivineMarg Kundli Report",
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // user cancelled share; no action required
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      window.alert("Kundli summary copied to clipboard.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDE9FE] via-white to-violet-50/40">
      <header className="border-b border-violet-100/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-semibold text-[#4C1D95] transition hover:text-violet-700"
          >
            DivineMarg
          </Link>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
            Vedic · Sidereal · Lahiri
          </span>
        </div>
      </header>

      <KundliForm onSuccess={setResult} />

      {result ? (
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 sm:px-6">
          {result.birthTimeApproximate ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              Birth time approximated to noon — ascendant &amp; houses are
              indicative; enter exact time for precision.
            </p>
          ) : null}

          <section>
            <SectionTitle subtitle="Lagna chart with signs & planets by house">
              Your birth chart
            </SectionTitle>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onShare}
                className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800"
              >
                Share Your Kundli
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
              >
                Print / Save as PDF
              </button>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <KundliChart chartData={result.chartData} />
              <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg shadow-violet-100/50">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
                  Snapshot
                </h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Ascendant</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.ascendant.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.ascendant.degree}°
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Moon sign</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.moonSign.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.moonSign.degree}°
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Sun sign</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.sunSign.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.sunSign.degree}°{" "}
                        {result.basicInfo.sunSign.minutes}′
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Nakshatra</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.nakshatra.name}{" "}
                      <span className="text-slate-500">
                        (Pada {result.basicInfo.nakshatra.pada}, lord{" "}
                        {result.basicInfo.nakshatra.lord})
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Name number</dt>
                    <dd className="font-medium text-violet-700">
                      {result.basicInfo.numerologyNumber}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle subtitle="Strength rating by house support">
              Life Area Ratings
            </SectionTitle>
            <div className="grid gap-4 rounded-2xl border border-violet-100 bg-white p-6 shadow-md sm:grid-cols-2 lg:grid-cols-5">
              {ratings.map((rating) => (
                <div key={rating.area} className="rounded-xl bg-violet-50/60 p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{rating.area}</p>
                  <p className="mt-1 text-lg font-semibold text-amber-500">{stars(rating.value)}</p>
                  <p className="text-xs text-slate-600">{rating.value}/5</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle subtitle="Sidereal longitudes · retrograde marked">
              Planetary positions
            </SectionTitle>
            <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-md">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-violet-100 bg-violet-50/80 text-violet-900">
                    <th className="px-4 py-3 font-semibold">Planet</th>
                    <th className="px-4 py-3 font-semibold">Sign</th>
                    <th className="px-4 py-3 font-semibold">House</th>
                    <th className="px-4 py-3 font-semibold">Deg</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.planets.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-slate-50 hover:bg-violet-50/30"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        <span className="mr-2 text-violet-600">{p.symbol}</span>
                        {p.name}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{p.rashi}</td>
                      <td className="px-4 py-2.5 text-violet-800">{p.house}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">
                        {p.degree}° {p.minutes}′
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {p.isRetrograde ? (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5">
                            ℞
                          </span>
                        ) : null}{" "}
                        {p.isExalted ? (
                          <span className="text-emerald-600">Exalted</span>
                        ) : null}{" "}
                        {p.isDebilitated ? (
                          <span className="text-rose-600">Debilitated</span>
                        ) : null}{" "}
                        {p.ownSign ? (
                          <span className="text-violet-600">Own</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
              <SectionTitle>Vimshottari Dasha</SectionTitle>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">Mahadasha</span>
                  <span className="font-semibold text-violet-900">
                    {result.dasha.mahadasha.planet}
                  </span>
                </li>
                <li className="flex justify-between text-xs text-slate-500">
                  <span>
                    {result.dasha.mahadasha.startDate} →{" "}
                    {result.dasha.mahadasha.endDate}
                  </span>
                </li>
                <li className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Antardasha</span>
                  <span className="font-medium text-slate-900">
                    {result.dasha.antardasha.planet}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Pratyantar</span>
                  <span className="font-medium text-slate-900">
                    {result.dasha.pratyantar.planet}
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
              <SectionTitle>Doshas</SectionTitle>
              <ul className="space-y-2 text-sm">
                <li className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600">Mangal Dosha</span>
                  <span
                    className={
                      result.doshas.mangalDosha.present
                        ? "rounded-full bg-rose-100 px-2 py-0.5 text-rose-800"
                        : "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800"
                    }
                  >
                    {result.doshas.mangalDosha.present ? "Present" : "None"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {result.doshas.mangalDosha.type} ·{" "}
                    {result.doshas.mangalDosha.severity}
                  </span>
                </li>
                <li className="text-xs text-slate-600">
                  Sade Sati:{" "}
                  {result.doshas.sadeSati.present ? (
                    <>
                      active ({result.doshas.sadeSati.phase}) — approx{" "}
                      {result.doshas.sadeSati.startYear}–
                      {result.doshas.sadeSati.endYear}
                    </>
                  ) : (
                    "not indicated at current transit"
                  )}
                </li>
                <li className="text-xs text-slate-600">
                  Kaal Sarp:{" "}
                  {result.doshas.kaalsarpDosha.present
                    ? "flagged — consult full chart"
                    : "not flagged"}
                </li>
              </ul>
            </div>
          </section>

          <section>
            <SectionTitle subtitle="Classical combinations detected in your chart">
              Yogas
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.yogas.map((y) => (
                <div
                  key={y.name}
                  className={`rounded-xl border p-4 ${
                    y.present
                      ? "border-violet-300 bg-violet-50/80"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{y.name}</h3>
                    <span
                      className={
                        y.present
                          ? "text-xs font-medium text-violet-700"
                          : "text-xs text-slate-400"
                      }
                    >
                      {y.present ? "Present" : "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{y.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{y.effect}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Interpretations</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(result.predictions).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="capitalize text-sm font-semibold text-violet-800">
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Detailed Personality Analysis</SectionTitle>
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p>
                Your Lagna in <span className="font-semibold">{result.basicInfo.ascendant.rashi}</span> defines
                how you project yourself to the world. This gives your natural approach to decisions, confidence,
                and physical vitality. The Lagna lord also shapes your long-term life direction and resilience.
              </p>
              <p>
                Your Moon sign in <span className="font-semibold">{result.basicInfo.moonSign.rashi}</span> shows
                emotional needs, inner comfort zones, and relationship response patterns. It indicates how you
                process stress, connect with loved ones, and seek mental peace in day-to-day life.
              </p>
              <p>
                Your Sun sign in <span className="font-semibold">{result.basicInfo.sunSign.rashi}</span> reveals
                your core purpose, authority style, and confidence in the public sphere. The combination of{" "}
                <span className="font-semibold">{lagnaKey}</span>, <span className="font-semibold">{moonKey}</span>,
                and <span className="font-semibold">{sunKey}</span> creates a balanced signature of action,
                emotion, and identity that can be refined into a powerful personal brand.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Career &amp; Finance Deep Dive</SectionTitle>
            <p className="text-sm leading-relaxed text-slate-700">
              Your 10th house in <span className="font-semibold">{result.houses[9].rashi}</span> and wealth axis
              (2nd/11th houses) indicate a path of sustained growth through skill-building and strategic timing.
              Career opportunities increase notably during supportive dasha phases, while finances improve through
              diversified income streams and disciplined long-term investing.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendedProfessions.map((profession) => (
                <span
                  key={profession}
                  className="rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 px-3 py-1 text-xs font-medium text-violet-800"
                >
                  {profession}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Love &amp; Marriage Analysis</SectionTitle>
            <p className="text-sm leading-relaxed text-slate-700">
              Your 7th house in <span className="font-semibold">{result.houses[6].rashi}</span> suggests a
              relationship pattern that matures with emotional clarity and commitment readiness. Marriage timing
              is generally stronger during benefic dasha-antardasha windows and when Venus/Jupiter transits support
              your 7th house axis. Spouse energy appears {result.houses[6].lord}-influenced: loyal in commitment,
              value-driven in partnership, and more compatible with emotionally mature communication.
            </p>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Health &amp; Wellness Guide</SectionTitle>
            <p className="text-sm leading-relaxed text-slate-700">
              Focus on body zones indicated by your Lagna and 6th house for preventive wellness. Prioritize routine
              sleep, hydration, gut care, and stress regulation through yoga, pranayama, and weekly detox habits.
              Regular checkups around vulnerable areas reduce long-term risk and keep vitality high.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Key watch areas: {result.predictions.health}
            </p>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Lucky Numbers, Colors &amp; Gems</SectionTitle>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <span className="font-semibold text-violet-800">Lucky Number:</span>{" "}
                {result.basicInfo.numerologyNumber}
              </li>
              <li>
                <span className="font-semibold text-violet-800">Lucky Colors:</span>{" "}
                {luckyProfile.colors.join(", ")}
              </li>
              <li>
                <span className="font-semibold text-violet-800">Lucky Days:</span> {luckyProfile.days.join(", ")}
              </li>
              <li>
                <span className="font-semibold text-violet-800">Gemstone:</span> {luckyProfile.gemstone}
              </li>
              <li>
                <span className="font-semibold text-violet-800">Wearing Instruction:</span>{" "}
                {luckyProfile.instruction}
              </li>
              <li>
                <span className="font-semibold text-violet-800">Rudraksha:</span> {luckyProfile.rudraksha}
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
            <SectionTitle>Remedies &amp; Upay</SectionTitle>
            <div className="space-y-4">
              {remedyPlanets.map((planet) => {
                const remedy = PLANET_REMEDIES[planet.name];
                if (!remedy) return null;
                return (
                  <div key={planet.name} className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                    <p className="text-sm font-semibold text-violet-900">{planet.name} Remedies</p>
                    <p className="mt-1 text-sm text-slate-700">
                      <span className="font-medium">Mantra:</span> {remedy.mantra}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Daan:</span> {remedy.donation}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Fasting:</span> {remedy.fasting}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Temple Visit:</span> {remedy.temple}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Wear/Avoid Colors:</span> {remedy.colors}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-100/70 to-fuchsia-100/70 p-6 shadow-sm">
            <SectionTitle>Compatibility</SectionTitle>
            <p className="text-sm text-slate-700">
              Match your Kundli with your partner to check guna milan, dosha compatibility, and marriage timing.
            </p>
            <Link
              href="/kundli/match"
              className="mt-4 inline-flex rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800"
            >
              Match your Kundli with your partner
            </Link>
          </section>

          <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 text-center shadow-sm">
            <p className="text-sm text-slate-700">
              Need deeper personalized guidance beyond algorithmic predictions?
            </p>
            <Link
              href="/astrologers"
              className="mt-3 inline-flex rounded-lg bg-fuchsia-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
            >
              Consult an Astrologer
            </Link>
          </section>
        </div>
      ) : null}

      <footer className="border-t border-violet-100 bg-violet-950/5 py-8 text-center text-xs text-slate-500">
        DivineMarg — Vedic astrology for clarity &amp; confidence. Results are
        algorithmic; consult a qualified astrologer for life decisions.
      </footer>
    </div>
  );
}
