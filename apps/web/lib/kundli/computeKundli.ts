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

const SIGN_SHORT_NAMES = [
  "Mesh",
  "Vrishabh",
  "Mithun",
  "Kark",
  "Singh",
  "Kanya",
  "Tula",
  "Vrishchik",
  "Dhanu",
  "Makar",
  "Kumbh",
  "Meen",
] as const;

const PERSONALITY_PREDICTIONS: Record<number, string> = {
  0: "Mesh Lagna makes you bold, energetic, and naturally ready to lead from the front. You move fast, trust your instincts, and can sometimes act before fully thinking things through. Your willpower is strong, and competition often brings out your best performance. Physically, you may carry an athletic or active aura with noticeable dynamism. Mars rulership gives courage, directness, and passionate drive in every major life area.",
  1: "Vrishabh Lagna gives patience, reliability, and a strong appreciation for comfort and quality. You are steady in decisions, though once committed you can become quite stubborn. Your taste in art, food, and music is usually refined and naturally attractive to others. Venus rulership brings romance, sensuality, and a desire for emotional as well as material harmony. Financial security and long-term stability become key priorities throughout life.",
  2: "Mithun Lagna makes you curious, witty, and naturally gifted at communication. You adapt quickly to changing situations, though your dual nature can create occasional inconsistency. Learning, networking, and exchanging ideas keep your mind active and motivated. Mercury rulership gives sharp intellect, humor, and strong language ability. You often maintain a youthful style and energetic social presence even as you mature.",
  3: "Kark Lagna gives emotional depth, intuition, and a nurturing personality. Home, family, and emotional security hold great importance in your life choices. You usually have excellent memory, empathy, and sensitivity toward others' needs. Moon rulership can create mood fluctuations, yet also grants profound inner resilience and caring strength. You are often seen as a natural protector, counselor, or caretaker.",
  4: "Singh Lagna gives charisma, confidence, and a natural flair for visibility. You carry leadership energy with a dignified or royal style of presence. Warm-hearted generosity is one of your key strengths, especially toward loved ones. Sun rulership creates a need for recognition, respect, and meaningful appreciation. Creative expression, performance, and influence become major themes in personal and professional life.",
  5: "Kanya Lagna makes you analytical, precise, and oriented toward service and improvement. You notice details others miss and prefer systems that are practical and efficient. Mercury rulership gives intelligence, problem-solving ability, and sharp critical thinking. You are often health-conscious, disciplined, and focused on self-betterment. At times, high standards can turn into self-criticism, so balance and compassion are essential.",
  6: "Tula Lagna gives diplomacy, charm, and a strong instinct for harmony. You are naturally drawn to beauty, aesthetics, and balanced human relationships. Venus rulership supports romance, artistic taste, and social grace in public settings. You can become indecisive when weighing many options, yet fairness remains your core principle. Networking and partnership often open important doors in life.",
  7: "Vrishchik Lagna gives intensity, depth, and powerful emotional perception. You may appear private or mysterious, but your inner will is exceptionally strong. Mars-Ketu style energy supports transformation, research, investigation, and crisis-handling strength. In relationships you are deeply passionate and fiercely loyal once trust is formed. You remember key experiences strongly and rarely give up before reaching your goal.",
  8: "Dhanu Lagna gives optimism, philosophy, and a love for freedom and expansion. Jupiter rulership makes you naturally drawn to teaching, mentoring, and sharing wisdom. Travel, higher learning, and spiritual inquiry strongly shape your worldview. You are honest and straightforward, though occasional bluntness may need refinement. Life path often includes a quest for meaning, ethics, and purposeful contribution.",
  9: "Makar Lagna gives ambition, discipline, and a realistic long-term mindset. Saturn rulership makes success gradual but enduring through consistent effort. You are patient, strategic, and often willing to work harder than most people around you. Outer demeanor can appear serious, yet loyalty and responsibility run very deep. Financial planning and practical management abilities tend to be naturally strong.",
  10: "Kumbh Lagna gives innovation, independence, and a broad humanitarian outlook. Saturn-Rahu style influence makes you think ahead of current trends and systems. You are friendly and socially aware, yet can stay emotionally detached when needed. Technology, reform, and social impact themes repeatedly attract your attention. Your originality and unconventional decisions become key signatures of your life path.",
  11: "Meen Lagna gives compassion, intuition, and a deeply spiritual temperament. Jupiter-Ketu style influence supports empathy, imagination, and subtle healing abilities. You often feel others' emotions strongly and need healthy emotional boundaries. Creative and mystical pursuits can become major channels of expression and purpose. At times, escapist patterns may arise, so grounding routines are important for balance.",
};

const CAREER_PREDICTIONS_10TH: Record<number, string> = {
  0: "With Mesh in the 10th house, careers linked to leadership, defense, sports, engineering, surgery, and entrepreneurship become strong possibilities. You perform best in fast-paced and competitive environments where initiative is rewarded. Authority roles suit you because you are comfortable taking responsibility under pressure. Mars influence gives courage, ambition, and a desire to build something independently. Career momentum usually improves notably after age 28 as discipline stabilizes raw drive.",
  1: "Vrishabh in the 10th house supports careers in banking, luxury products, hospitality, music, food, design, and stable business ventures. You prefer steady growth over risky jumps and can create lasting professional value. Public image often benefits from calm reliability and refined taste. Venus influence supports client relations, branding, and value creation. Long-term wealth is often built through consistency, quality, and strategic asset accumulation.",
  2: "Mithun in the 10th house favors communication-driven careers such as media, sales, writing, teaching, marketing, consulting, and technology interfaces. Multi-tasking and adaptability become key strengths in professional life. You may handle dual roles or frequent career shifts before settling into a niche. Mercury influence gives networking ability and intellectual agility in changing markets. Success rises when you combine communication skill with one specialized domain.",
  3: "Kark in the 10th house supports careers connected with caregiving, education, hospitality, psychology, real estate, public service, and people management. You work best where emotional intelligence and trust-building matter. Public recognition often comes through supportive leadership rather than aggressive competition. Moon influence can create periodic career fluctuations, but intuition guides major turns well. Stability improves when you align work with service, protection, and meaningful connection.",
  4: "Singh in the 10th house supports careers in administration, government, entertainment, leadership, politics, branding, and visible authority positions. You are naturally noticed and often drawn toward roles with recognition and influence. Confidence and creative expression become professional assets. Sun influence favors status, responsibility, and work that carries public impact. Career growth accelerates when ego is balanced with humility and team mentorship.",
  5: "Kanya in the 10th house supports careers in analytics, healthcare, data, accounting, operations, quality control, law support, and technical services. You excel in systems, process refinement, and precision-based responsibilities. Mercury influence gives practical intelligence and problem-solving ability for complex workflows. Professional success comes from detail orientation and credibility. You progress steadily when perfectionism is managed and delegation improves execution speed.",
  6: "Tula in the 10th house supports careers in law, diplomacy, HR, design, beauty, consulting, partnerships, and negotiation-heavy roles. You handle stakeholders gracefully and perform well in collaborative environments. Venus influence supports public relations, aesthetics, and value-driven branding. Career rise often comes through strategic alliances rather than solo struggle. Strong ethical balance and fair decision-making become your long-term reputation assets.",
  7: "Vrishchik in the 10th house favors careers in research, investigation, medicine, surgery, defense strategy, intelligence, psychology, crisis management, and deep analytics. You perform best in high-stakes roles that demand focus and confidentiality. Mars-Ketu style intensity gives stamina for difficult transformations. Career path can include sudden shifts followed by powerful reinvention. Success grows when emotional intensity is channeled into disciplined strategic execution.",
  8: "Dhanu in the 10th house supports careers in education, law, publishing, coaching, travel, consulting, religion, and global business. You need meaningful work that aligns with principles and long-term vision. Jupiter influence brings guidance ability and public respect as a mentor or advisor. Foreign links or multicultural exposure often boost career expansion. Success rises when idealism is paired with operational discipline and practical timelines.",
  9: "Makar in the 10th house strongly supports administration, management, engineering, governance, infrastructure, compliance, and long-cycle enterprises. You are built for structure, persistence, and difficult responsibilities. Saturn influence gives delayed but durable success through hard work and credibility. Career progress may feel slow in early years, then compound significantly over time. Leadership becomes strongest when patience, ethics, and strategic planning stay consistent.",
  10: "Kumbh in the 10th house supports careers in technology, innovation, social impact, policy reform, analytics, large networks, and futuristic domains. You prefer work that improves systems rather than just maintaining them. Saturn-Rahu style influence supports unconventional solutions and independent thought. Professional identity can be unique, sometimes ahead of market timing. Success comes when visionary ideas are backed by disciplined execution and collaborative scaling.",
  11: "Meen in the 10th house supports careers in healing arts, counseling, spirituality, cinema, design, writing, maritime sectors, and charitable institutions. You thrive in roles requiring empathy, imagination, and subtle perception. Jupiter-Ketu style influence can create non-linear career paths with meaningful turning points. Work linked to service, creativity, or inspiration brings deeper satisfaction. Financial and professional stability increase when vision is paired with routine and structure.",
};

const MARRIAGE_PREDICTIONS_7TH: Record<number, string> = {
  0: "Mesh in the 7th house indicates a dynamic, independent, and assertive spouse energy. Relationships may start quickly and require patience to avoid ego clashes. Compatibility is strongest with partners who respect individuality and direct communication. Marriage timing often improves after emotional maturity and career grounding develop. Shared goals and physical activity can keep the bond vibrant.",
  1: "Vrishabh in the 7th house suggests a loyal, practical, and comfort-loving spouse. Marriage tends to value stability, family routines, and long-term financial security. Compatibility improves with partners who appreciate commitment and calm communication. Timing is generally favorable when finances and home stability are in place. Sensuality, trust, and consistency become pillars of relationship success.",
  2: "Mithun in the 7th house indicates an intelligent, social, and communicative spouse nature. Mental compatibility and conversation are essential for relationship longevity. You may attract partners with youthful energy or dual interests. Marriage timing can involve phases of indecision before clarity emerges. Shared learning, travel, and flexibility strengthen compatibility over time.",
  3: "Kark in the 7th house gives an emotional, caring, and family-oriented spouse pattern. Partnership thrives on emotional safety, nurturing behavior, and shared domestic priorities. Sensitivity can create mood-based misunderstandings if communication is not clear. Marriage timing is favorable when both families align and emotional readiness is strong. A warm home environment becomes central to marital harmony.",
  4: "Singh in the 7th house indicates a proud, expressive, and dignified spouse energy. Partnership needs appreciation, respect, and visible affection to stay balanced. Compatibility is high with partners who support each other's ambitions. Marriage timing often improves after confidence and social standing stabilize. Celebration, creativity, and shared public goals strengthen the relationship.",
  5: "Kanya in the 7th house suggests a practical, detail-oriented, and health-conscious spouse. Marriage works best with clear routines, mutual service, and realistic expectations. Over-analysis or criticism can affect emotional warmth if unchecked. Timing tends to favor periods when life structure and daily habits are settled. Respect for small efforts and practical teamwork builds long-term compatibility.",
  6: "Tula in the 7th house is naturally favorable for marriage and partnership dynamics. Spouse nature is likely charming, diplomatic, and fairness-oriented. Relationship success depends on balance, aesthetics, and respectful communication. Timing often aligns with social or professional networking phases. Shared values, grace, and compromise create strong compatibility.",
  7: "Vrishchik in the 7th house indicates intense attraction, deep loyalty, and transformative partnership experiences. Spouse nature may be passionate, private, and emotionally powerful. Trust and transparency are critical, as secrecy can create friction. Marriage timing may involve karmic lessons before stable commitment forms. Emotional depth, devotion, and shared resilience define compatibility.",
  8: "Dhanu in the 7th house suggests a philosophical, optimistic, and freedom-loving spouse. Partnership thrives on honesty, growth, and shared exploration. Compatibility is strongest when both partners respect personal space and life purpose. Marriage timing often improves through travel, higher studies, or spiritual connection. Shared ethics and long-term vision sustain marital harmony.",
  9: "Makar in the 7th house indicates a mature, responsible, and practical spouse nature. Marriage may arrive slightly later but with stronger long-term commitment. Compatibility improves with partners who value duty, stability, and measurable progress. Timing is favorable after career foundations become stable. Patience, loyalty, and disciplined partnership building create durable bonds.",
  10: "Kumbh in the 7th house suggests a unique, intellectual, and independent spouse profile. Marriage may begin through friendship, networks, or unconventional circumstances. Emotional expression can seem detached at times, so conscious intimacy building is useful. Timing may be non-traditional but meaningful when shared ideals align. Compatibility grows through mutual respect, social purpose, and freedom.",
  11: "Meen in the 7th house indicates a gentle, empathetic, and spiritually inclined spouse nature. Relationship bonds are emotional, intuitive, and often idealistic. Boundaries and practical clarity are important to avoid confusion or over-sacrifice. Marriage timing can align with spiritual growth phases or family blessings. Compassion, forgiveness, and shared faith strengthen compatibility deeply.",
};

const HEALTH_PREDICTIONS_LAGNA: Record<number, string> = {
  0: "Mesh Lagna highlights head, brain, eyes, and blood heat sensitivity. Watch for headaches, fever tendencies, inflammation, and blood pressure spikes. Manage stress through cooling foods, hydration, and regular sleep discipline. Strength training is favorable but avoid overexertion and impulsive routines. Preventive eye care and periodic blood pressure checks are beneficial.",
  1: "Vrishabh Lagna brings focus to throat, neck, vocal cords, and thyroid balance. You should monitor recurrent throat irritation, stiffness in neck-shoulder region, and metabolism rhythm. Avoid excessive cold foods and maintain regular movement to reduce sluggishness. Gentle voice care and posture correction help long-term wellness. Thyroid profile checks at intervals are useful.",
  2: "Mithun Lagna governs lungs, shoulders, arms, and nervous system regulation. Watch for anxiety-driven fatigue, respiratory sensitivity, and irregular sleep patterns. Breathing exercises and consistent movement improve vitality significantly. Avoid overthinking and information overload that drains mental energy. Nervous system calming routines and magnesium-rich nutrition can help.",
  3: "Kark Lagna rules chest, breasts, stomach fluids, and emotional digestion. Stress often reflects quickly in digestion, acidity, or appetite fluctuations. Warm, satvic meals and stable meal timing support resilience. Emotional boundaries and moon-cycle aligned rest improve hormonal balance. Chest and gastric care should remain a preventive focus.",
  4: "Singh Lagna emphasizes heart, spine, circulation, and upper back vitality. Monitor cardiac strain, posture issues, and heat-related fatigue during high stress. Structured exercise, sunlight balance, and disciplined recovery improve stamina. Ego pressure can somatize as chest tightness, so relaxation practices are essential. Routine heart and lipid screening supports long-term health.",
  5: "Kanya Lagna rules intestines, gut absorption, skin sensitivity, and digestive detail. Watch for acidity, constipation, gut inflammation, and food intolerance patterns. Hygiene, routine, and clean nutrition are especially important for you. Overwork and worry can disturb digestion quickly, so mindfulness is therapeutic. Periodic gut and micronutrient evaluations can be useful.",
  6: "Tula Lagna governs kidneys, lower back, skin balance, and sugar regulation. Hydration, mineral balance, and blood sugar discipline deserve attention. Avoid excessive processed food and sedentary patterns that burden renal function. Gentle yoga and spine care maintain long-term comfort. Periodic kidney profile and glucose monitoring are recommended.",
  7: "Vrishchik Lagna highlights reproductive organs, elimination system, and hidden inflammatory conditions. You may need to watch hormonal balance, urinary health, and stress toxins. Detox-friendly routines, hydration, and emotional release practices are beneficial. Suppressed emotions can affect physical vitality over time. Preventive reproductive and urinary checkups support stability.",
  8: "Dhanu Lagna governs hips, thighs, liver metabolism, and sciatic channel. Watch for liver overload, weight fluctuations, and hip-thigh strain. Moderate exercise with flexibility work keeps movement channels healthy. Excess optimism around diet can cause overindulgence, so moderation is key. Liver function and vitamin profiling can help preventive care.",
  9: "Makar Lagna focuses on bones, knees, joints, teeth, and chronic stiffness. Joint lubrication, calcium metabolism, and posture maintenance are key priorities. Overwork can create fatigue accumulation and musculoskeletal tightness. Strength plus mobility training supports longevity best. Bone density and vitamin D evaluation become valuable over time.",
  10: "Kumbh Lagna governs calves, ankles, circulation, and nervous conductivity in lower limbs. Watch for varicose tendencies, cramps, circulation irregularity, and sudden energy drops. Walking, stretching, and hydration help maintain smooth flow. Irregular schedules may disturb health rhythms, so routine is medicine for you. Vascular and electrolyte monitoring can be supportive.",
  11: "Meen Lagna rules feet, lymphatic fluids, immunity, and psychosomatic sensitivity. You absorb stress and emotions quickly, which can affect sleep and immunity. Gentle movement, spiritual grounding, and salt-water routines help recharge. Avoid escapist habits that weaken vitality over time. Foot care, immunity support, and emotional hygiene are essential.",
};

const MAHADASHA_PREDICTIONS: Record<VimPlanet, string> = {
  Ketu: "Ketu Mahadasha activates detachment, karmic clearing, and deep inner introspection. Material priorities may shift as spiritual and psychological themes become stronger. Sudden endings or relocations can occur to redirect life toward authenticity. This period favors meditation, occult study, healing work, and simplifying distractions. Relationships and career paths that lack soul alignment often transform rapidly. Grounding routines and mentorship are important to avoid confusion or isolation.",
  Venus: "Venus Mahadasha brings focus on relationships, comfort, creativity, and financial refinement. This 20-year period often supports marriage prospects, artistic pursuits, and improved lifestyle quality. Business in beauty, design, hospitality, luxury, branding, and client-facing roles can flourish. Emotional fulfillment increases when values and partnerships are balanced. Overindulgence in pleasure or spending should be managed with discipline. Harmony, diplomacy, and aesthetic intelligence become major success factors.",
  Sun: "Sun Mahadasha amplifies authority, confidence, visibility, and leadership responsibilities. You are pushed to define identity clearly and take ownership of your path. Career can bring recognition, promotions, or public-facing opportunities when ego is balanced with service. Father figures, government matters, and reputation themes become prominent. Health focus is needed for heart, eyes, and burnout prevention through routine. Strong integrity and purpose-driven action produce the best outcomes.",
  Moon: "Moon Mahadasha emphasizes emotions, family life, nourishment, and inner security. Home transitions, caregiving roles, and mental wellness become central during this 10-year cycle. Intuition increases, making this period favorable for counseling, hospitality, education, and public connection roles. Mood swings may rise if sleep and boundaries are weak. Financial flow can fluctuate, so budgeting and emotional balance are essential. Practices that stabilize mind and hydration improve overall outcomes.",
  Mars: "Mars Mahadasha brings high action, courage, competition, and execution power. You may feel driven toward entrepreneurship, technical fields, property actions, or leadership under pressure. This period rewards discipline, physical fitness, and decisive planning. Anger, haste, and conflict need conscious management to protect relationships and health. Surgeries, machinery, defense, sports, and engineering themes can become active. Structured strategy channels Mars energy into major achievements.",
  Rahu: "Rahu Mahadasha creates rapid ambition, unconventional opportunities, and foreign or technological influence. Life can move quickly with sudden leaps in career, network, and social visibility. This period favors innovation, digital fields, mass communication, and global expansion. Confusion, obsession, or risky decisions may arise if ethics are ignored. Grounding through spiritual practice and mentorship keeps growth aligned. When handled wisely, Rahu grants bold breakthroughs and market relevance.",
  Jupiter: "Jupiter Mahadasha brings wisdom, expansion, and spiritual growth. This 16-year period is excellent for education, teaching, and financial growth. Marriage and children are often blessed, especially when natal Jupiter is well placed. Opportunities in law, finance, consulting, and education arise steadily. Foreign travel, higher studies, or settlement possibilities increase during major sub-periods. Health remains generally supportive, though liver function and sugar balance should be monitored.",
  Saturn: "Saturn Mahadasha is a karmic period of discipline, responsibility, and durable achievement. Progress may seem slow initially, but results become long-lasting and structurally strong. Career often shifts toward serious roles, management, compliance, engineering, or governance. This cycle tests patience, ethics, and consistency in relationships and finances. Health attention is needed for bones, joints, nerves, and chronic stress load. With humility and sustained effort, Saturn grants respected status and maturity.",
  Mercury: "Mercury Mahadasha activates intellect, communication, commerce, and skill development. This period favors business, analytics, writing, education, consulting, technology, and negotiation-heavy roles. You may handle multiple projects, contracts, or learning tracks at once. Financial gains improve through networking, adaptability, and smart information management. Nervous strain and overthinking should be balanced with rest and focused routines. Precision in speech and documentation becomes a key advantage.",
};

function cleanRashiName(value: string): string {
  return value.split(" ")[0] ?? value;
}

function joinPlanets(planets: string[]): string {
  return planets.length > 0 ? planets.join(", ") : "none";
}

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

  const tenth = houses[9];
  const seventh = houses[6];
  const sixth = houses[5];
  const second = houses[1];
  const eleventh = houses[10];

  const tenthSign = rashiFromDegree(normalizeLon(ascDeg + 9 * 30));
  const seventhSign = rashiFromDegree(normalizeLon(ascDeg + 6 * 30));
  const secondSign = rashiFromDegree(normalizeLon(ascDeg + 30));
  const eleventhSign = rashiFromDegree(normalizeLon(ascDeg + 10 * 30));
  const secondLord = signLordPlanetKey(secondSign);
  const eleventhLord = signLordPlanetKey(eleventhSign);

  const secondLordHouse = houseOf(raw[secondLord].longitude);
  const eleventhLordHouse = houseOf(raw[eleventhLord].longitude);
  const wealthStrength =
    (second.planets.length > 0 ? 1 : 0) +
    (eleventh.planets.length > 0 ? 1 : 0) +
    (secondLordHouse === 2 || secondLordHouse === 11 ? 1 : 0) +
    (eleventhLordHouse === 2 || eleventhLordHouse === 11 ? 1 : 0);
  const wealthBand =
    wealthStrength >= 3
      ? "strong wealth-building cycles"
      : wealthStrength === 2
        ? "steady but effort-dependent growth"
        : "fluctuating gains that improve with disciplined planning";

  const predictions = {
    personality: PERSONALITY_PREDICTIONS[ascRashi],
    career: `${CAREER_PREDICTIONS_10TH[tenthSign]} The 10th house holds ${joinPlanets(tenth.planets)} and lord ${tenth.lord} is a key career trigger in your chart.`,
    marriage: `${MARRIAGE_PREDICTIONS_7TH[seventhSign]} Your 7th house contains ${joinPlanets(seventh.planets)}, adding practical clues about spouse behavior and relationship timing.`,
    health: `${HEALTH_PREDICTIONS_LAGNA[ascRashi]} Your 6th house sign is ${cleanRashiName(sixth.rashi)}, so preventive care through routine, digestion balance, and stress control gives the best long-term results.`,
    finance: `Income patterns depend strongly on the 2nd house ${cleanRashiName(second.rashi)} and 11th house ${cleanRashiName(eleventh.rashi)}. Wealth can arise through ${SIGN_SHORT_NAMES[secondSign]} style assets, networking, and the gains channels of ${SIGN_SHORT_NAMES[eleventhSign]}. The 2nd lord ${secondLord} in house ${secondLordHouse} and 11th lord ${eleventhLord} in house ${eleventhLordHouse} indicate ${wealthBand}. Planets in wealth houses are 2nd: ${joinPlanets(second.planets)} and 11th: ${joinPlanets(eleventh.planets)}. Favor long-horizon investing, disciplined savings, and timing major moves during supportive Jupiter or Venus periods.`,
    currentPeriod: `${MAHADASHA_PREDICTIONS[dasha.mahadasha.planet]} Current sub-period of ${dasha.antardasha.planet} refines the experience with short-term events tied to that planet's house placement and strength.`,
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
