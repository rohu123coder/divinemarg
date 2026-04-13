export type Period = "today" | "tomorrow" | "weekly" | "monthly";

export type Rashi = {
  id: string;
  hindi: string;
  english: string;
  symbol: string;
  dateRange: string;
  lord: string;
  color: string;
  aliases: string[];
};

export const rashis: Rashi[] = [
  {
    id: "aries",
    hindi: "मेष",
    english: "Aries",
    symbol: "♈",
    dateRange: "Mar 21 - Apr 19",
    lord: "Mars",
    color: "#FF6B6B",
    aliases: ["aries", "mesh", "mesha"],
  },
  {
    id: "taurus",
    hindi: "वृषभ",
    english: "Taurus",
    symbol: "♉",
    dateRange: "Apr 20 - May 20",
    lord: "Venus",
    color: "#4ECDC4",
    aliases: ["taurus", "vrishabh", "vrishabha"],
  },
  {
    id: "gemini",
    hindi: "मिथुन",
    english: "Gemini",
    symbol: "♊",
    dateRange: "May 21 - Jun 20",
    lord: "Mercury",
    color: "#45B7D1",
    aliases: ["gemini", "mithun", "mithuna"],
  },
  {
    id: "cancer",
    hindi: "कर्क",
    english: "Cancer",
    symbol: "♋",
    dateRange: "Jun 21 - Jul 22",
    lord: "Moon",
    color: "#96CEB4",
    aliases: ["cancer", "kark", "karka"],
  },
  {
    id: "leo",
    hindi: "सिंह",
    english: "Leo",
    symbol: "♌",
    dateRange: "Jul 23 - Aug 22",
    lord: "Sun",
    color: "#FFEAA7",
    aliases: ["leo", "singh", "simha"],
  },
  {
    id: "virgo",
    hindi: "कन्या",
    english: "Virgo",
    symbol: "♍",
    dateRange: "Aug 23 - Sep 22",
    lord: "Mercury",
    color: "#DDA0DD",
    aliases: ["virgo", "kanya"],
  },
  {
    id: "libra",
    hindi: "तुला",
    english: "Libra",
    symbol: "♎",
    dateRange: "Sep 23 - Oct 22",
    lord: "Venus",
    color: "#98D8C8",
    aliases: ["libra", "tula"],
  },
  {
    id: "scorpio",
    hindi: "वृश्चिक",
    english: "Scorpio",
    symbol: "♏",
    dateRange: "Oct 23 - Nov 21",
    lord: "Mars",
    color: "#FF7675",
    aliases: ["scorpio", "vrishchik", "vrischik"],
  },
  {
    id: "sagittarius",
    hindi: "धनु",
    english: "Sagittarius",
    symbol: "♐",
    dateRange: "Nov 22 - Dec 21",
    lord: "Jupiter",
    color: "#74B9FF",
    aliases: ["sagittarius", "dhanu"],
  },
  {
    id: "capricorn",
    hindi: "मकर",
    english: "Capricorn",
    symbol: "♑",
    dateRange: "Dec 22 - Jan 19",
    lord: "Saturn",
    color: "#A29BFE",
    aliases: ["capricorn", "makar"],
  },
  {
    id: "aquarius",
    hindi: "कुम्भ",
    english: "Aquarius",
    symbol: "♒",
    dateRange: "Jan 20 - Feb 18",
    lord: "Saturn",
    color: "#FD79A8",
    aliases: ["aquarius", "kumbh", "kumbha"],
  },
  {
    id: "pisces",
    hindi: "मीन",
    english: "Pisces",
    symbol: "♓",
    dateRange: "Feb 19 - Mar 20",
    lord: "Jupiter",
    color: "#55EFC4",
    aliases: ["pisces", "meen", "mina"],
  },
];

const loveTemplates = [
  "Venus blesses your love life today. Singles may meet someone special through a friend or social gathering. Couples should express their feelings openly - your partner needs reassurance. Small romantic gestures will go a long way today.",
  "Your charm is at its peak today. A long-standing misunderstanding in your relationship can be resolved with honest communication. Be patient and listen more than you speak. Love is in the air for singles - keep your heart open.",
  "Emotional connections deepen today. If you have been thinking about someone special, reach out - the stars are favorable. Existing relationships benefit from quality time together. Avoid arguments over trivial matters.",
  "The Moon's influence brings romantic energy. Unexpected encounters could spark new connections for singles. Couples should plan something special - even a simple home-cooked meal can strengthen bonds today.",
  "Mercury's influence sharpens communication in relationships. Express your feelings clearly today. A heart-to-heart conversation with your partner will resolve lingering doubts. Singles should not shy away from making the first move.",
];

const careerTemplates = [
  "Jupiter's blessings bring career opportunities today. A senior colleague or mentor may offer valuable guidance - listen carefully. Your hard work from the past weeks is about to pay off. New projects or assignments may come your way.",
  "Focus and discipline are your strengths today. Tackle the most challenging tasks in the morning when your energy is highest. A creative solution you present will impress your superiors. Avoid office politics and stay focused on your goals.",
  "Networking is favored today. Reach out to old contacts or attend professional events if possible. A conversation could open unexpected doors. For business owners, new clients or partnerships are on the horizon.",
  "Mercury boosts your communication skills at work. Presentations, meetings, and negotiations go smoothly today. Your ideas will be well-received by colleagues and management. Document everything important in writing.",
  "Saturn's influence rewards patience and persistence. The results you seek may not come today but you are building a strong foundation. Stay consistent, avoid shortcuts, and trust the process. Recognition comes to those who persist.",
];

const healthTemplates = [
  "Your energy levels are high today - make use of this vitality. Exercise or yoga in the morning will set a positive tone. Watch your diet - avoid overly spicy or oily food. Stay hydrated throughout the day.",
  "Listen to your body's signals today. If you feel tired, rest is the best medicine. Meditation for even 10 minutes can reduce stress significantly. Avoid skipping meals - your metabolism needs regular fuel.",
  "Mental health deserves attention today. Stress from work or relationships may affect your physical wellbeing. Take short breaks, breathe deeply, and spend time in nature if possible. Sleep 7-8 hours tonight.",
  "Good health is favored today but don't take it for granted. Old ailments may show improvement. Avoid cold drinks and exposure to extreme weather. A brisk 30-minute walk will boost your immunity.",
  "Mars gives you physical strength today. This is a good day for gym, sports, or any physical activity. However, be careful of injuries - warm up properly. Avoid arguments as stress can trigger headaches.",
];

const financeTemplates = [
  "Financial matters look promising today. An investment you made earlier may show positive returns. Avoid impulsive purchases - think twice before spending on luxury items. A small financial windfall is possible through unexpected sources.",
  "Saturn advises caution with money today. This is not the best day for major financial decisions or large investments. Focus on savings and clearing pending dues. Read all documents carefully before signing.",
  "Multiple income opportunities present themselves today. Keep your eyes open for part-time work or side income possibilities. A loan or financial assistance you applied for may get approved. Manage your budget wisely.",
  "Jupiter brings financial wisdom today. Seek advice from a financial expert if you have been contemplating an investment. Avoid lending money to friends or family - it may create complications. Focus on long-term financial goals.",
  "Expenses may exceed your budget today - be careful with spending. Avoid gambling or speculative investments. However, money spent on education or health is well-invested. Start a small savings plan if you haven't already.",
];

const familyTemplates = [
  "Family harmony is highlighted today. A meaningful conversation with elders can bring clarity to a pending matter. Spend quality time at home and appreciate small moments together. Your calm words can resolve a long-standing tension.",
  "Domestic responsibilities may feel higher today, but your efforts will be noticed. A sibling or cousin could reach out for support. Keep patience with younger family members. Sharing a meal together will strengthen emotional bonds.",
  "The stars favor reconciliation in family matters. If there has been distance with a loved one, take the first step. Respect each person's perspective instead of forcing your view. Evening hours are ideal for peaceful discussions.",
  "You may receive good news from a relative today. Family plans related to celebrations or travel can progress smoothly. Avoid overreacting to minor misunderstandings. Warmth and humor will keep the home atmosphere positive.",
  "Your role as a mediator becomes important today. Two family members may need your balanced advice. Do not carry everyone else's stress alone - set healthy boundaries. Blessings from elders bring emotional stability.",
];

const travelTemplates = [
  "Short-distance travel is favored today. Plan your schedule carefully to avoid unnecessary delays. Keep important documents and essentials organized. A spontaneous trip may bring refreshing opportunities.",
  "Travel plans may require flexibility today. Double-check timings and bookings before leaving. If possible, avoid rushing and start early. Journeys connected to work can bring useful contacts.",
  "A spiritually uplifting journey is indicated. Visiting a temple or peaceful place can calm your mind. Drive safely and remain alert in crowded areas. Light packing will make your day smoother.",
  "Long-distance travel looks positive if planned well. Weather or traffic changes may require a backup plan. Stay hydrated and avoid heavy food during travel. New places can inspire fresh ideas.",
  "Travel energy is mixed today - go prepared. Keep a buffer in your budget for unexpected expenses. Trips with family or close friends bring joy and emotional healing. Trust your intuition while choosing routes and timings.",
];

const luckyNumbers = [3, 5, 7, 8, 9];
const luckyColors = ["Crimson", "Emerald Green", "Royal Blue", "Saffron", "Lavender"];
const luckyTimes = [
  "06:30 AM - 08:00 AM",
  "09:15 AM - 10:45 AM",
  "12:00 PM - 01:30 PM",
  "04:15 PM - 05:45 PM",
  "07:00 PM - 08:30 PM",
];
const mantras = [
  "Om Namah Shivaya",
  "Om Shreem Mahalakshmyai Namah",
  "Om Gam Ganapataye Namah",
  "Om Hreem Suryaaya Namah",
  "Om Aim Saraswatyai Namah",
];
const daanSuggestions = [
  "Donate yellow lentils to someone in need.",
  "Offer white sweets at a nearby temple.",
  "Donate fruits to children or elders.",
  "Feed birds with mixed grains.",
  "Offer green vegetables to a cow shelter.",
];

const periodOffsets: Record<Period, number> = {
  today: 0,
  tomorrow: 1,
  weekly: 7,
  monthly: 30,
};

export type HoroscopeResponse = {
  rashi: Rashi;
  period: Period;
  periodLabel: string;
  generatedOn: string;
  todayOverview: string;
  lucky: {
    number: number;
    color: string;
    time: string;
  };
  ratings: {
    love: number;
    career: number;
    health: number;
    finance: number;
  };
  predictions: {
    love: string;
    career: string;
    health: string;
    finance: string;
    family: string;
    travel: string;
  };
  remedy: {
    mantra: string;
    daan: string;
  };
  compatibleRashis: Array<{
    id: string;
    hindi: string;
    english: string;
    symbol: string;
  }>;
};

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function pickTemplate(items: string[], seed: number, offset = 0) {
  return items[(seed + offset + items.length) % items.length];
}

function getSeed(date: Date, rashiIndex: number) {
  const dayOfYear = getDayOfYear(date);
  return (dayOfYear + rashiIndex * 7 + date.getFullYear()) % 5;
}

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function addDays(baseDate: Date, days: number) {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getRashiFromParam(input: string) {
  const value = normalize(input);
  return rashis.find((r) => r.aliases.includes(value) || r.id === value) ?? null;
}

export function createHoroscope(
  rashiInput: string,
  period: Period = "today"
): HoroscopeResponse | null {
  const rashi = getRashiFromParam(rashiInput);
  if (!rashi) {
    return null;
  }

  const normalizedPeriod = periodOffsets[period] !== undefined ? period : "today";
  const rashiIndex = rashis.findIndex((item) => item.id === rashi.id);
  const date = addDays(new Date(), periodOffsets[normalizedPeriod]);
  const seed = getSeed(date, rashiIndex);

  const compatible = [rashis[(rashiIndex + seed + 2) % 12], rashis[(rashiIndex + seed + 6) % 12]];

  return {
    rashi,
    period: normalizedPeriod,
    periodLabel:
      normalizedPeriod === "today"
        ? "Today"
        : normalizedPeriod === "tomorrow"
          ? "Tomorrow"
          : normalizedPeriod === "weekly"
            ? "Weekly"
            : "Monthly",
    generatedOn: date.toISOString(),
    todayOverview: `Today brings focused cosmic support for ${rashi.english} natives. ${pickTemplate(
      loveTemplates,
      seed
    ).split(". ")[0]}. ${pickTemplate(careerTemplates, seed, 1).split(". ")[0]}. Keep faith in your intuition and take steady steps through the day.`,
    lucky: {
      number: luckyNumbers[seed],
      color: luckyColors[(seed + rashiIndex) % luckyColors.length],
      time: luckyTimes[(seed + 1) % luckyTimes.length],
    },
    ratings: {
      love: ((seed + rashiIndex) % 5) + 1,
      career: ((seed + rashiIndex + 2) % 5) + 1,
      health: ((seed + rashiIndex + 3) % 5) + 1,
      finance: ((seed + rashiIndex + 1) % 5) + 1,
    },
    predictions: {
      love: pickTemplate(loveTemplates, seed),
      career: pickTemplate(careerTemplates, seed),
      health: pickTemplate(healthTemplates, seed),
      finance: pickTemplate(financeTemplates, seed),
      family: pickTemplate(familyTemplates, seed),
      travel: pickTemplate(travelTemplates, seed),
    },
    remedy: {
      mantra: mantras[(seed + rashiIndex) % mantras.length],
      daan: daanSuggestions[(seed + 2) % daanSuggestions.length],
    },
    compatibleRashis: compatible.map((item) => ({
      id: item.id,
      hindi: item.hindi,
      english: item.english,
      symbol: item.symbol,
    })),
  };
}
