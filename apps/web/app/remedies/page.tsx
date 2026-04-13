import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Planetary Remedies & Gemstones | DivineMarg",
  description:
    "Explore Vedic planetary remedies including mantra, daan, yantra, and gemstone recommendations.",
};

const remedies = [
  {
    planet: "Sun",
    mantra: "Om Suryaya Namah",
    daan: "Wheat, jaggery, copper items on Sunday",
    yantra: "Surya Yantra",
  },
  {
    planet: "Moon",
    mantra: "Om Chandraya Namah",
    daan: "Rice, milk, white cloth on Monday",
    yantra: "Chandra Yantra",
  },
  {
    planet: "Mars",
    mantra: "Om Mangalaya Namah",
    daan: "Masoor dal, red cloth on Tuesday",
    yantra: "Mangal Yantra",
  },
  {
    planet: "Mercury",
    mantra: "Om Budhaya Namah",
    daan: "Green moong, green clothes on Wednesday",
    yantra: "Budh Yantra",
  },
  {
    planet: "Jupiter",
    mantra: "Om Gurave Namah",
    daan: "Chana dal, turmeric on Thursday",
    yantra: "Guru Yantra",
  },
  {
    planet: "Venus",
    mantra: "Om Shukraya Namah",
    daan: "White sweets, curd on Friday",
    yantra: "Shukra Yantra",
  },
  {
    planet: "Saturn",
    mantra: "Om Sham Shanicharaya Namah",
    daan: "Black sesame, mustard oil on Saturday",
    yantra: "Shani Yantra",
  },
];

const gemstones = [
  ["Sun", "Ruby", "Ring finger, Sunday morning"],
  ["Moon", "Pearl", "Little finger, Monday morning"],
  ["Mars", "Red Coral", "Ring finger, Tuesday"],
  ["Mercury", "Emerald", "Little finger, Wednesday"],
  ["Jupiter", "Yellow Sapphire", "Index finger, Thursday"],
  ["Venus", "Diamond", "Middle finger, Friday"],
  ["Saturn", "Blue Sapphire", "Middle finger, Saturday"],
];

export default function RemediesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Planetary Remedies
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Traditional remedies for balancing planetary influences through mantra,
          daan, and yantra practices.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {remedies.map((item) => (
            <article
              key={item.planet}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-bold text-violet-700">{item.planet}</h2>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Mantra:</span> {item.mantra}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Daan:</span> {item.daan}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Yantra:</span> {item.yantra}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Gemstone Recommendations
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-violet-100 text-violet-800">
                <tr>
                  <th className="px-3 py-2">Planet</th>
                  <th className="px-3 py-2">Gemstone</th>
                  <th className="px-3 py-2">Suggested Wearing</th>
                </tr>
              </thead>
              <tbody>
                {gemstones.map((row) => (
                  <tr key={row[0]} className="border-b border-violet-50">
                    <td className="px-3 py-2">{row[0]}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{row[1]}</td>
                    <td className="px-3 py-2 text-slate-700">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
