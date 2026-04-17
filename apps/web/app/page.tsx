"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";
import { rashis } from "@/lib/horoscope";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

type Astro = {
  id: string;
  name: string;
  avatar_url: string | null;
  profile_photo_url?: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  price_per_minute: number | null;
  is_available: boolean;
  is_online?: boolean;
  experience_years: number | null;
};

const topServices = [
  { icon: "🪐", name: "Kundli (Birth Chart)", href: "/kundli" },
  { icon: "💞", name: "Horoscope Matching", href: "/kundli/match" },
  { icon: "🔆", name: "Daily Rashifal", href: "/horoscope?period=today" },
  { icon: "📜", name: "Free Reports", href: "/reports" },
  { icon: "🔥", name: "Mangal Dosha", href: "/reports/mangal-dosha" },
  { icon: "🧿", name: "Sade Sati Report", href: "/reports/sade-sati" },
  { icon: "🔢", name: "Numerology", href: "/numerology" },
  { icon: "🃏", name: "Tarot Reading", href: "/tarot" },
  { icon: "🏠", name: "Vastu Tips", href: "/vastu" },
  { icon: "📈", name: "Career Report", href: "/reports/career" },
  { icon: "❤️", name: "Love Horoscope", href: "/horoscope?topic=love" },
  { icon: "👶", name: "Baby Names", href: "/baby-names" },
  { icon: "📕", name: "Lal Kitab", href: "/lal-kitab" },
  { icon: "💎", name: "Gemstones", href: "/gemstones" },
  { icon: "📚", name: "Learn Astrology", href: "/learn-astrology" },
  { icon: "📱", name: "Talk to Astrologer", href: "/astrologers" },
];

const paidServices = [
  {
    title: "Detailed Kundli Report",
    description: "Complete Janam Kundli with dosha and planetary analysis.",
    price: 199,
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    title: "Marriage Compatibility",
    description: "Guna Milan, Manglik check and practical relationship insights.",
    price: 299,
    gradient: "from-fuchsia-500 to-violet-600",
  },
  {
    title: "Career Report",
    description: "Career timing, opportunities and profession suitability.",
    price: 249,
    gradient: "from-indigo-500 to-violet-700",
  },
  {
    title: "Ask a Question",
    description: "Get an expert personalized answer for one important query.",
    price: 99,
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    title: "Finance Report",
    description: "Income, savings, investments and wealth planning guidance.",
    price: 249,
    gradient: "from-violet-600 to-blue-600",
  },
  {
    title: "Health Report",
    description: "Planetary health tendencies and preventive remedy guidance.",
    price: 199,
    gradient: "from-indigo-500 to-purple-600",
  },
];

const remedies = [
  "Gemstones",
  "Yantras",
  "Rudraksha",
  "Feng Shui",
  "Malas",
  "Puja Items",
];

const articles = [
  {
    title: "How Saturn Transit 2026 Will Impact Each Rashi",
    date: "12 Apr 2026",
    href: "/blog/saturn-transit-2026-rashifal",
  },
  {
    title: "Kundli Matching: Beyond Guna Milan",
    date: "08 Apr 2026",
    href: "/blog/kundli-matching-guide",
  },
  {
    title: "Simple Daily Remedies for Career Growth",
    date: "02 Apr 2026",
    href: "/blog/daily-remedies-career-growth",
  },
];

const tithiNames = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya",
];

const nakshatraNames = [
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
];

const yogaNames = [
  "Vishkumbha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];

const karanNames = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garija",
  "Vanija",
  "Vishti",
  "Shakuni",
  "Chatushpada",
  "Naga",
  "Kimstughna",
];

const rahukaalByDay = [
  "16:30 - 18:00",
  "07:30 - 09:00",
  "15:00 - 16:30",
  "12:00 - 13:30",
  "13:30 - 15:00",
  "10:30 - 12:00",
  "09:00 - 10:30",
];

function normalizeDegree(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getPanchang(date: Date) {
  const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const days = (utcDate - j2000) / 86400000;

  const sunLongitude = normalizeDegree(280.46 + 0.9856474 * days);
  const moonLongitude = normalizeDegree(218.316 + 13.176396 * days);
  const moonSunAngle = normalizeDegree(moonLongitude - sunLongitude);
  const tithiIndex = Math.floor(moonSunAngle / 12) % 30;
  const nakshatraIndex = Math.floor(moonLongitude / (360 / 27)) % 27;
  const yogaIndex = Math.floor(normalizeDegree(sunLongitude + moonLongitude) / (360 / 27)) % 27;
  const karanIndex = Math.floor(moonSunAngle / 6) % karanNames.length;

  return {
    tithi: tithiNames[tithiIndex],
    nakshatra: nakshatraNames[nakshatraIndex],
    yoga: yogaNames[yogaIndex],
    karan: karanNames[karanIndex],
    rahukaal: rahukaalByDay[date.getDay()],
  };
}

export default function HomePage() {
  const router = useRouter();
  const { token, isLoggedIn } = useAuthStore();
  const [featured, setFeatured] = useState<Astro[]>([]);
  const [liveAstrologers, setLiveAstrologers] = useState<Astro[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
  const [kundliForm, setKundliForm] = useState({
    name: "",
    gender: "male",
    date: "",
    time: "",
    place: "",
  });
  const [matchForm, setMatchForm] = useState({
    name: "",
    date: "",
    time: "",
    place: "",
  });
  const [activePeriod, setActivePeriod] = useState("Daily");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/astrologers`, { params: { limit: 6 } });
        const list = res.data?.data?.astrologers as Astro[] | undefined;
        if (!cancelled && list) {
          setFeatured(list);
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      setLiveLoading(true);
      try {
        const res = await api.get(`/api/astrologers`, {
          params: { online: true, limit: 10, page: 1 },
        });
        const list = res.data?.data?.astrologers as Astro[] | undefined;
        if (!cancelled) {
          setLiveAstrologers(list ?? []);
        }
      } catch {
        if (!cancelled) {
          setLiveAstrologers([]);
        }
      } finally {
        if (!cancelled) {
          setLiveLoading(false);
        }
      }
    };
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      return;
    }
    const socket: Socket = io(getSocketApiBase(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on(
      "astrologer_status_changed",
      async (payload: { astrologerId: string; is_online: boolean }) => {
        if (!payload.is_online) {
          setLiveAstrologers((prev) =>
            prev.filter((astro) => astro.id !== payload.astrologerId)
          );
          return;
        }
        try {
          const res = await api.get(`/api/astrologers`, {
            params: { online: true, limit: 10, page: 1 },
          });
          setLiveAstrologers((res.data?.data?.astrologers as Astro[] | undefined) ?? []);
        } catch {
          // no-op for live refresh errors
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [isLoggedIn, token]);

  const today = new Date();
  const todayLong = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const panchang = getPanchang(today);

  const handleKundliSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({
      name: kundliForm.name,
      gender: kundliForm.gender,
      date: kundliForm.date,
      time: kundliForm.time,
      place: kundliForm.place,
    });
    router.push(`/kundli?${params.toString()}`);
  };

  const handleMatchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({
      boyName: matchForm.name,
      date: matchForm.date,
      time: matchForm.time,
      place: matchForm.place,
    });
    router.push(`/kundli/match?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-100/70 via-indigo-50 to-white">
        <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">
            Premium Astrology Platform
          </p>
          <h1 className="mt-3 text-center text-3xl font-extrabold sm:text-5xl">
            Divine guidance for every day, every decision
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-center text-slate-600">
            Explore horoscope, get your free Kundli, match compatibility, and
            consult verified astrologers with modern tools in one place.
          </p>
          <div className="mt-8 rounded-3xl border border-violet-200 bg-white/90 p-5 shadow-sm sm:p-8">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-violet-100 pb-4 sm:flex-row sm:items-center">
              <h2 className="text-xl font-bold text-violet-900">Select Your Rashi</h2>
              <p className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
                {todayLong}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {rashis.map((rashi) => (
                <Link
                  key={rashi.id}
                  href={`/horoscope/${rashi.id}`}
                  className="rounded-xl border border-violet-100 bg-white p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                  <p className="text-2xl">{rashi.symbol}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm">
                    {rashi.english}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Daily", "Weekly", "Monthly", "Yearly"].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activePeriod === period
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                  }`}
                  onClick={() => setActivePeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!liveLoading && liveAstrologers.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Live Astrologers</h2>
            <Link href="/astrologers" className="text-sm font-semibold text-violet-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {liveAstrologers.map((astrologer) => (
              <article
                key={`live-${astrologer.id}`}
                className="min-w-[240px] rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {astrologer.profile_photo_url || astrologer.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={astrologer.profile_photo_url ?? astrologer.avatar_url ?? ""}
                        alt={astrologer.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                        {astrologer.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="animate-online-pulse absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {astrologer.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      ₹{astrologer.price_per_minute ?? 0}/min
                    </p>
                  </div>
                </div>
                <Link
                  href={`/astrologers/${astrologer.id}`}
                  className="mt-4 block rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-2 text-center text-sm font-semibold text-white"
                >
                  Chat Now
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <h3 className="text-lg font-bold text-violet-900">Kundli / Birth Chart</h3>
            <form className="mt-4 space-y-3" onSubmit={handleKundliSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={kundliForm.name}
                onChange={(e) => setKundliForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <select
                value={kundliForm.gender}
                onChange={(e) => setKundliForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Date (DD/MM/YYYY)"
                value={kundliForm.date}
                onChange={(e) => setKundliForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                type="text"
                placeholder="Time (HH:MM)"
                value={kundliForm.time}
                onChange={(e) => setKundliForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                type="text"
                placeholder="Place"
                value={kundliForm.place}
                onChange={(e) => setKundliForm((prev) => ({ ...prev, place: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Get Kundli
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <h3 className="text-lg font-bold text-violet-900">Kundli Matching</h3>
            <form className="mt-4 space-y-3" onSubmit={handleMatchSubmit}>
              <input
                type="text"
                placeholder="Boy's Name"
                value={matchForm.name}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                type="text"
                placeholder="Date (DD/MM/YYYY)"
                value={matchForm.date}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                type="text"
                placeholder="Time (HH:MM)"
                value={matchForm.time}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <input
                type="text"
                placeholder="Place"
                value={matchForm.place}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, place: e.target.value }))}
                className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Continue
              </button>
              <Link
                href="/kundli/match"
                className="block text-center text-sm font-medium text-violet-600 hover:underline"
              >
                Open full matching report
              </Link>
            </form>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <h3 className="text-lg font-bold text-violet-900">Today&apos;s Panchang</h3>
            <p className="mt-1 text-sm text-slate-600">{todayLong}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2">
                <span className="font-medium text-slate-700">Tithi</span>
                <span className="font-semibold text-violet-700">{panchang.tithi}</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2">
                <span className="font-medium text-slate-700">Nakshatra</span>
                <span className="font-semibold text-violet-700">{panchang.nakshatra}</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2">
                <span className="font-medium text-slate-700">Yoga</span>
                <span className="font-semibold text-violet-700">{panchang.yoga}</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2">
                <span className="font-medium text-slate-700">Karan</span>
                <span className="font-semibold text-violet-700">{panchang.karan}</span>
              </p>
              <p className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-700">
                Rahukaal (Delhi): <span className="font-semibold">{panchang.rahukaal}</span>
              </p>
            </div>
            <Link
              href="/panchang"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Today Panchang
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-violet-100 bg-violet-50/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Free Horoscope and Astrology Services
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {topServices.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="rounded-2xl border border-violet-100 bg-white p-4 text-center transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-md"
              >
                <p className="text-3xl">{service.icon}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{service.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Consult Astrologer on Call &amp; Chat</h2>
            <p className="mt-1 text-sm text-slate-600">
              Verified experts available now for instant call and chat sessions.
            </p>
          </div>
          <Link href="/astrologers" className="text-sm font-semibold text-violet-700 hover:underline">
            View all astrologers
          </Link>
        </div>
        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl bg-violet-100" />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
            {featured.map((astrologer) => (
              <article
                key={astrologer.id}
                className="min-w-[270px] snap-start rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:shadow-md md:min-w-[320px]"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {astrologer.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={astrologer.avatar_url}
                        alt={astrologer.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white">
                        {astrologer.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-900">{astrologer.name}</h3>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Verified
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {astrologer.experience_years ?? 0}+ years experience
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(astrologer.specializations ?? []).slice(0, 3).map((specialization) => (
                    <span
                      key={`${astrologer.id}-${specialization}`}
                      className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700"
                    >
                      {specialization}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="font-semibold text-violet-700">
                    ₹{astrologer.price_per_minute ?? 0}/min
                  </p>
                  <p className="text-amber-500">
                    {"★".repeat(Math.max(1, Math.round(astrologer.rating ?? 4)))}
                    <span className="text-slate-300">
                      {"★".repeat(5 - Math.max(1, Math.round(astrologer.rating ?? 4)))}
                    </span>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/astrologers/${astrologer.id}`}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Call
                  </Link>
                  <Link
                    href={`/astrologers/${astrologer.id}`}
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Chat
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Aaj Ka Rashifal</h2>
            <p className="mt-1 text-sm text-slate-600">{todayLong}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {rashis.map((rashi) => (
            <Link
              key={`today-${rashi.id}`}
              href={`/horoscope/${rashi.id}`}
              className="rounded-xl border border-violet-100 bg-white p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <p className="text-3xl">{rashi.symbol}</p>
              <p className="mt-1 text-sm font-semibold">{rashi.english}</p>
            </Link>
          ))}
        </div>
        <div className="mt-7 text-center">
          <Link
            href="/horoscope"
            className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            View All Horoscopes
          </Link>
        </div>
      </section>

      <section className="border-y border-violet-100 bg-violet-50/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Astrological services for accurate answers
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paidServices.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`h-24 rounded-xl bg-gradient-to-r ${service.gradient}`}
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{service.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-violet-700">₹{service.price}</p>
                  <Link
                    href="/reports"
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Buy Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Astrological Remedies</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {remedies.map((item, index) => (
            <article
              key={item}
              className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={`h-24 rounded-xl bg-gradient-to-r ${
                  index % 2 === 0 ? "from-violet-500 to-indigo-600" : "from-indigo-500 to-violet-700"
                }`}
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-bold text-slate-900">{item}</h3>
              <Link
                href="/shop"
                className="mt-3 inline-flex rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Check Now
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-violet-100 bg-violet-50/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">DivineMarg Magazine</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.title}
                className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  {article.date}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{article.title}</h3>
                <Link href={article.href} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
                  Read More
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 border-b border-slate-800 pb-8 md:flex-row">
            <div>
              <p className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                ✨ DivineMarg
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Accurate guidance, verified astrologers, and trusted reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {[
                ["About", "/about"],
                ["Privacy Policy", "/privacy"],
                ["Terms", "/terms"],
                ["Contact", "/contact"],
                ["Astrologer Registration", "/astrologer/login"],
                ["Blog", "/blog"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="transition hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              {[
                ["Facebook", "f"],
                ["Instagram", "ig"],
                ["YouTube", "yt"],
                ["X", "x"],
              ].map(([platform, text]) => (
                <span
                  key={platform}
                  title={platform}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-xs font-bold uppercase text-slate-300"
                >
                  {text}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              © {today.getFullYear()} DivineMarg. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
