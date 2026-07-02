import type Anthropic from "@anthropic-ai/sdk";

export const VASTU_DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "Center"] as const;
export const VASTU_PROPERTY_TYPES = ["residential", "apartment", "office", "shop"] as const;

export type VastuDirection = (typeof VASTU_DIRECTIONS)[number];
export type VastuPropertyType = (typeof VASTU_PROPERTY_TYPES)[number];
export type VastuSeverity = "critical" | "high" | "medium" | "low";

export type RemedySet = {
  easy: string;
  moderate: string;
  color: string;
  element: "fire" | "water" | "earth" | "metal" | "wood";
  plants: string;
  crystals: string;
};

export type VastuRule = {
  id: string;
  object: string;
  idealDirections: string[];
  avoidDirections: string[];
  room: string;
  severity: VastuSeverity;
  problem: string;
  scientificReason: string;
  traditionalReason: string;
  remedy: RemedySet;
  expectedImprovement: string;
  confidenceScore: number;
  propertyTypes?: VastuPropertyType[];
};

export type DetectedObject = {
  name: string;
  position: string;
  vastuNote: string;
};

export type DetectedRoom = {
  roomType: string;
  photoIndex: number;
  compassDirection: string;
  detectedObjects: DetectedObject[];
  colors: string[];
  naturalLight: "good" | "moderate" | "poor";
  ventilation: "good" | "moderate" | "poor";
  clutter: "none" | "moderate" | "high";
  structuralIssues: string[];
};

export type VastuAnalysis = {
  detectedRooms: DetectedRoom[];
};

export type AppliedRule = {
  rule: VastuRule;
  room: string;
  direction: string;
  isViolation: boolean;
  detectedObject?: string;
  matchConfidence: number;
};

export type ElementBalance = {
  fire: number;
  water: number;
  earth: number;
  metal: number;
  wood: number;
};

export type VastuScores = {
  overallScore: number;
  financialScore: number;
  healthScore: number;
  relationshipScore: number;
  careerScore: number;
  elementBalance: ElementBalance;
  positiveEnergyZones: string[];
  negativeEnergyZones: string[];
};

export type Issue = {
  id: string;
  object: string;
  room: string;
  direction: string;
  severity: string;
  problem: string;
  scientificReason: string;
  traditionalReason: string;
  remedy: RemedySet;
  expectedImprovement: string;
  priority: number;
  confidenceScore: number;
};

export type RoomAnalysis = {
  roomType: string;
  score: number;
  positives: string[];
  issues: Issue[];
};

export type PanchtattvaZone = {
  score: number;
  zones: string[];
  recommendation: string;
};

export type VastuReport = {
  overallScore: number;
  grade: string;
  summary: string;
  scores: VastuScores;
  roomAnalyses: RoomAnalysis[];
  issues: Issue[];
  topPriorityFixes: string[];
  elementBalance: ElementBalance;
  panchtattvaAnalysis: {
    agni: PanchtattvaZone;
    jal: PanchtattvaZone;
    prithvi: PanchtattvaZone;
    vayu: PanchtattvaZone;
    akash: PanchtattvaZone;
  };
  energyMap: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  remedySummary: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  auspiciousColors: string[];
  avoidColors: string[];
  luckyElements: string[];
  professionalNote: string;
};

type ObjectRuleTemplate = {
  object: string;
  aliases: string[];
  room: string;
  idealDirections: VastuDirection[];
  avoidDirections: VastuDirection[];
  severity: VastuSeverity;
  problem: string;
  scientificReason: string;
  traditionalReason: string;
  remedy: RemedySet;
  expectedImprovement: string;
  confidenceScore: number;
  propertyTypes?: VastuPropertyType[];
};

const VISION_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

const SEVERITY_DEDUCTION: Record<VastuSeverity, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
};

const SEVERITY_PRIORITY: Record<VastuSeverity, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

const FINANCIAL_OBJECTS = new Set([
  "entrance_main_door",
  "locker_safe",
  "dining_table",
  "cash_register",
  "office_desk",
]);

const HEALTH_OBJECTS = new Set([
  "gas_stove",
  "kitchen_sink",
  "master_bedroom_bed",
  "bathroom_toilet",
  "dustbin",
  "refrigerator",
]);

const RELATIONSHIP_OBJECTS = new Set([
  "master_bedroom_bed",
  "mirror",
  "sofa",
  "children_bed",
]);

const CAREER_OBJECTS = new Set([
  "study_table",
  "bookshelf",
  "computer_laptop",
  "entrance_main_door",
  "office_desk",
]);

const ELEMENT_MAP: Record<string, keyof ElementBalance> = {
  gas_stove: "fire",
  temple_puja_room: "fire",
  kitchen_sink: "water",
  bathroom_toilet: "water",
  aquarium: "water",
  underground_water_tank: "water",
  overhead_water_tank: "water",
  water_filter_purifier: "water",
  washing_machine: "water",
  plants_indoor: "wood",
  garden: "wood",
  bookshelf: "wood",
  study_table: "wood",
  locker_safe: "metal",
  refrigerator: "metal",
  clock: "metal",
  wardrobe_almirah: "earth",
  master_bedroom_bed: "earth",
  sofa: "earth",
  dining_table: "earth",
};

const DIRECTION_BONUS = 3;

const OBJECT_TEMPLATES: ObjectRuleTemplate[] = [
  {
    object: "entrance_main_door",
    aliases: ["main door", "entrance", "front door", "entry door"],
    room: "entrance",
    idealDirections: ["N", "NE", "E"],
    avoidDirections: ["SW", "S", "W"],
    severity: "critical",
    problem: "Main entrance in inauspicious zone blocks prosperity flow",
    scientificReason:
      "Poor entrance orientation reduces natural light, ventilation, and creates psychological resistance for occupants and visitors.",
    traditionalReason:
      "Vastu Shastra places Ishanya (NE) and North as gateways for wealth; SW entrance is Pitru zone and drains positive energy.",
    remedy: {
      easy: "Place a Swastik or Om symbol on the inner side of the door; keep entrance well-lit and clutter-free",
      moderate: "Install a brass threshold plate and place a Vastu pyramid near the door frame",
      color: "White, light yellow, or soft green at entrance",
      element: "earth",
      plants: "Money plant or tulsi near entrance (not blocking door swing)",
      crystals: "Clear quartz or citrine near entrance",
    },
    expectedImprovement: "Improves financial flow and welcome energy",
    confidenceScore: 92,
  },
  {
    object: "gas_stove",
    aliases: ["gas stove", "stove", "cooktop", "hob", "burner"],
    room: "kitchen",
    idealDirections: ["SE", "S"],
    avoidDirections: ["NE", "N", "NW"],
    severity: "critical",
    problem: "Fire element misplaced in kitchen disrupts health and finances",
    scientificReason:
      "Fire near water zones increases humidity damage and safety hazards; NE placement conflicts with morning light patterns for cooking.",
    traditionalReason:
      "Agni (fire) belongs in Agneya (SE); fire in NE (Ishanya) extinguishes divine blessings and causes health issues.",
    remedy: {
      easy: "Keep stove clean; place a small red mat under the stove; cook facing east when possible",
      moderate: "Install a copper strip under the stove area; use red/orange backsplash tiles",
      color: "Red, orange, or brown in SE kitchen zone",
      element: "fire",
      plants: "Avoid plants directly above stove; small herb pot in SE window ok",
      crystals: "Carnelian or red jasper near cooking area (not on hot surface)",
    },
    expectedImprovement: "Improves health, digestion harmony, and household stability",
    confidenceScore: 95,
  },
  {
    object: "kitchen_sink",
    aliases: ["kitchen sink", "sink", "wash basin in kitchen"],
    room: "kitchen",
    idealDirections: ["NE", "N", "E"],
    avoidDirections: ["SE", "S", "SW"],
    severity: "high",
    problem: "Water element conflicting with fire zone causes domestic friction",
    scientificReason:
      "Sink in SE near stove creates cross-contamination risk and inefficient kitchen workflow.",
    traditionalReason:
      "Jal (water) in Agneya (SE) clashes with Agni, causing arguments and financial leakage.",
    remedy: {
      easy: "Keep sink always clean and dry when not in use; place a small green plant between sink and stove",
      moderate: "Use blue/green accents near sink area; install water filter to symbolize purified energy",
      color: "Blue, green, or white near water zones",
      element: "water",
      plants: "Money plant or bamboo near sink (not in direct water splash)",
      crystals: "Aquamarine or blue lace agate near sink area",
    },
    expectedImprovement: "Reduces conflicts and improves kitchen harmony",
    confidenceScore: 90,
    },
  {
    object: "temple_puja_room",
    aliases: ["temple", "puja room", "prayer room", "mandir", "altar"],
    room: "puja",
    idealDirections: ["NE", "E", "N"],
    avoidDirections: ["SW", "S", "NW", "Center"],
    severity: "critical",
    problem: "Sacred space in wrong zone diminishes spiritual benefits",
    scientificReason:
      "Prayer space in bedroom or SW creates mental restlessness and poor separation of sacred vs mundane zones.",
    traditionalReason:
      "Ishanya (NE) is the most sacred direction; puja in SW or bedroom invites negative influences.",
    remedy: {
      easy: "Face east or north while praying; keep mandir clean with daily diya",
      moderate: "Create a dedicated NE corner mandir with wooden platform; use copper diya",
      color: "White, yellow, or light saffron in puja area",
      element: "fire",
      plants: "Tulsi plant in NE (if space permits)",
      crystals: "Clear quartz or selenite on altar",
    },
    expectedImprovement: "Enhances peace, clarity, and spiritual protection",
    confidenceScore: 94,
  },
  {
    object: "master_bedroom_bed",
    aliases: ["master bed", "bed", "double bed", "king bed", "queen bed"],
    room: "bedroom",
    idealDirections: ["SW", "S", "W"],
    avoidDirections: ["NE", "E", "N", "Center"],
    severity: "high",
    problem: "Bed placement in wrong direction affects rest and relationships",
    scientificReason:
      "Head toward north may affect sleep quality per some geomagnetic studies; NE bed placement lacks privacy and grounding.",
    traditionalReason:
      "Southwest is stability zone for head of family; NE bed placement drains vitality and marital harmony.",
    remedy: {
      easy: "Sleep with head toward south or west; use earthy bedsheets",
      moderate: "Place heavy wardrobe in SW; use wooden bed frame with solid headboard",
      color: "Light pink, peach, or cream in master bedroom",
      element: "earth",
      plants: "Avoid plants in bedroom; small peace lily acceptable in corner",
      crystals: "Rose quartz under pillow or on nightstand",
    },
    expectedImprovement: "Improves sleep quality and relationship stability",
    confidenceScore: 88,
  },
  {
    object: "children_bed",
    aliases: ["children bed", "kids bed", "child bed", "bunk bed"],
    room: "children_bedroom",
    idealDirections: ["W", "SW", "S"],
    avoidDirections: ["NE", "SE", "Center"],
    severity: "medium",
    problem: "Children's bed in wrong zone affects focus and growth",
    scientificReason:
      "Poor bed orientation and clutter near study-sleep zone reduces concentration and sleep cycles.",
    traditionalReason:
      "West zone supports creativity for children; NE bed for child drains academic focus.",
    remedy: {
      easy: "Head toward south or west; keep study and sleep zones visually separated",
      moderate: "Use green accents for growth; place bookshelf in NE of room (not bed in NE)",
      color: "Light green, blue, or yellow in children's room",
      element: "wood",
      plants: "Small indoor plant on study desk",
      crystals: "Amethyst for calm sleep",
    },
    expectedImprovement: "Supports academic focus and healthy development",
    confidenceScore: 82,
  },
  {
    object: "mirror",
    aliases: ["mirror", "dressing mirror", "wall mirror", "full mirror"],
    room: "any",
    idealDirections: ["N", "E", "NE"],
    avoidDirections: ["S", "SW", "Center"],
    severity: "high",
    problem: "Mirror reflecting bed or in south zone causes restlessness",
    scientificReason:
      "Mirrors reflecting sleeping person disrupt sleep through subconscious visual stimulation and light reflection.",
    traditionalReason:
      "Mirrors double energy; in bedroom they invite third-party interference and in SW reflect instability.",
    remedy: {
      easy: "Cover bedroom mirrors at night with cloth; ensure mirror does not reflect bed",
      moderate: "Relocate mirror to north or east wall; use frosted or decorative partial mirror",
      color: "Frame mirror in gold or wooden tones",
      element: "metal",
      plants: "No plants reflected in mirrors",
      crystals: "Avoid crystals directly facing large mirrors",
    },
    expectedImprovement: "Improves sleep and reduces relationship friction",
    confidenceScore: 91,
    propertyTypes: ["residential", "apartment"],
  },
  {
    object: "tv",
    aliases: ["tv", "television", "smart tv", "entertainment unit"],
    room: "living_room",
    idealDirections: ["SE", "E", "N"],
    avoidDirections: ["NE", "SW", "Center"],
    severity: "medium",
    problem: "TV in NE or SW disrupts family harmony and focus",
    scientificReason:
      "Screen in NE distracts from morning calm; TV in SW bedroom zone reduces intimacy and rest quality.",
    traditionalReason:
      "Fire element of electronics in Ishanya (NE) burns spiritual energy; SW TV affects family head stability.",
    remedy: {
      easy: "Cover TV when not in use; limit TV in bedroom entirely",
      moderate: "Place TV in SE cabinet with doors; add plants to balance EMF visually",
      color: "Neutral tones around entertainment unit",
      element: "fire",
      plants: "Snake plant near TV to absorb visual clutter energy",
      crystals: "Black tourmaline near electronics",
    },
    expectedImprovement: "Improves family communication and mental clarity",
    confidenceScore: 78,
  },
  {
    object: "sofa",
    aliases: ["sofa", "couch", "settee", "sectional"],
    room: "living_room",
    idealDirections: ["SW", "S", "W"],
    avoidDirections: ["NE", "N", "Center"],
    severity: "medium",
    problem: "Seating in wrong zone affects social harmony and authority",
    scientificReason:
      "Main seating facing wrong direction reduces conversational flow and natural light comfort.",
    traditionalReason:
      "Head of family should sit in SW facing NE; sofa in NE blocks divine energy entry.",
    remedy: {
      easy: "Arrange main sofa against south or west wall facing north/east",
      moderate: "Use heavy SW sofa with lighter NE open space; add earthy cushions",
      color: "Beige, brown, or warm earth tones",
      element: "earth",
      plants: "Large plant in NE corner of living room",
      crystals: "Citrine in wealth corner (NE)",
    },
    expectedImprovement: "Strengthens family bonding and guest welcome",
    confidenceScore: 80,
  },
  {
    object: "dining_table",
    aliases: ["dining table", "dinner table", "table"],
    room: "dining",
    idealDirections: ["W", "NW", "E"],
    avoidDirections: ["NE", "SW", "S"],
    severity: "medium",
    problem: "Dining placement affects family unity and prosperity",
    scientificReason:
      "Dining away from kitchen increases friction; NE dining mixes sacred and eating zones.",
    traditionalReason:
      "West zone dining supports family togetherness; NE dining disrespects Ishanya sacred energy.",
    remedy: {
      easy: "Family eats together facing east or north; keep table uncluttered",
      moderate: "Use wooden round or oval table; place fresh flowers at center during meals",
      color: "Warm yellows and greens in dining area",
      element: "earth",
      plants: "Fresh flowers or small centerpiece herbs",
      crystals: "Green aventurine on dining table",
    },
    expectedImprovement: "Improves family harmony and abundance mindset",
    confidenceScore: 79,
  },
  {
    object: "wardrobe_almirah",
    aliases: ["wardrobe", "almirah", "closet", "cupboard"],
    room: "bedroom",
    idealDirections: ["SW", "S", "W"],
    avoidDirections: ["NE", "E", "Center"],
    severity: "medium",
    problem: "Heavy storage in light zones blocks energy circulation",
    scientificReason:
      "Heavy furniture in NE reduces usable space and blocks morning light essential for circadian rhythm.",
    traditionalReason:
      "Heavy items belong in SW/Nairutya for stability; NE wardrobe blocks prosperity flow.",
    remedy: {
      easy: "Keep wardrobe organized; avoid clutter overflow",
      moderate: "Move heavy wardrobe to SW wall; use lighter colors on NE walls",
      color: "Light wood or white wardrobe in non-SW zones if immovable",
      element: "earth",
      plants: "None inside wardrobe; keep NE open",
      crystals: "Camphor or cedar blocks for freshness",
    },
    expectedImprovement: "Improves stability and reduces mental clutter",
    confidenceScore: 76,
  },
  {
    object: "locker_safe",
    aliases: ["locker", "safe", "cash box", "tijori", "vault"],
    room: "any",
    idealDirections: ["N", "NE", "E"],
    avoidDirections: ["S", "SW", "NW", "Center"],
    severity: "critical",
    problem: "Wealth storage in drain zones causes financial instability",
    scientificReason:
      "Safe in visible or south zone increases security anxiety; poor placement away from owner sight reduces monitoring.",
    traditionalReason:
      "Kuber direction is North; safe in SW or south opens Nairiti (SW) drain for wealth.",
    remedy: {
      easy: "Open safe facing north; keep one currency note as Lakshmi symbol inside",
      moderate: "Place safe in north wall concealed cabinet; add mirror reflecting abundance (not safe itself)",
      color: "Gold, yellow accents near wealth zone",
      element: "metal",
      plants: "Money plant near wealth corner (not inside safe)",
      crystals: "Pyrite or citrine in wealth corner",
    },
    expectedImprovement: "Improves financial security and savings discipline",
    confidenceScore: 93,
  },
  {
    object: "refrigerator",
    aliases: ["refrigerator", "fridge", "freezer"],
    room: "kitchen",
    idealDirections: ["SW", "W", "NW", "SE"],
    avoidDirections: ["NE", "N", "Center"],
    severity: "medium",
    problem: "Heavy cooling appliance in sacred zone affects nourishment energy",
    scientificReason:
      "Fridge in NE blocks morning kitchen workflow; heat exchange near stove if wrongly placed increases energy bills.",
    traditionalReason:
      "Heavy metal/cold in Ishanya (NE) suppresses growth energy and affects food vitality.",
    remedy: {
      easy: "Keep fridge clean and organized; do not place above stove level in SE",
      moderate: "Move fridge to SW or west kitchen wall; add yellow sticker on door for abundance",
      color: "White or silver acceptable; avoid red on fridge in NE",
      element: "metal",
      plants: "Herbs on kitchen window, not on fridge top if cluttered",
      crystals: "Clear quartz in fridge door shelf for food energy (symbolic)",
    },
    expectedImprovement: "Improves household nourishment and budget control",
    confidenceScore: 77,
  },
  {
    object: "washing_machine",
    aliases: ["washing machine", "washer", "laundry machine"],
    room: "utility",
    idealDirections: ["NW", "W", "SE"],
    avoidDirections: ["NE", "N", "SW", "Center"],
    severity: "medium",
    problem: "Water appliance in wrong zone causes churning of domestic peace",
    scientificReason:
      "Vibration and moisture in NE or SW bedrooms affects structural integrity and sleep.",
    traditionalReason:
      "Constant water movement in NE disturbs Ishanya; in SW disturbs family head stability.",
    remedy: {
      easy: "Run washer during day not late night; keep area dry",
      moderate: "Relocate to NW or bathroom utility; use exhaust fan",
      color: "White or light blue in laundry zone",
      element: "water",
      plants: "Avoid plants in laundry area",
      crystals: "Selenite for cleansing energy after wash cycles",
    },
    expectedImprovement: "Reduces domestic stress and maintenance issues",
    confidenceScore: 74,
  },
  {
    object: "dustbin",
    aliases: ["dustbin", "trash can", "garbage bin", "waste bin"],
    room: "any",
    idealDirections: ["SW", "W", "NW"],
    avoidDirections: ["NE", "N", "E", "Center"],
    severity: "high",
    problem: "Waste in prosperity or sacred zones attracts negative energy",
    scientificReason:
      "Waste in NE creates hygiene issues and odor affecting kitchen and prayer areas.",
    traditionalReason:
      "Garbage in Ishanya (NE) destroys divine blessings and wealth entry.",
    remedy: {
      easy: "Use covered bins; empty daily; never keep bin in NE or puja area",
      moderate: "Place bin in SW utility with lid; use two-bin segregation system",
      color: "Dark covered bins, not bright in living areas",
      element: "earth",
      plants: "Compost only in designated SW garden area",
      crystals: "Himalayan salt near bin area to absorb odors (replace regularly)",
    },
    expectedImprovement: "Clears stagnant energy and improves hygiene luck",
    confidenceScore: 89,
  },
  {
    object: "water_filter_purifier",
    aliases: ["water filter", "ro purifier", "purifier", "water purifier"],
    room: "kitchen",
    idealDirections: ["NE", "N", "E"],
    avoidDirections: ["SE", "SW", "S"],
    severity: "medium",
    problem: "Purified water source in fire zone creates elemental conflict",
    scientificReason:
      "Water unit near stove increases electrical hazard and maintenance near heat.",
    traditionalReason:
      "Pure jal belongs in Ishanya or North; water in SE extinguishes Agni prosperity.",
    remedy: {
      easy: "Keep purifier clean; service filters on schedule",
      moderate: "Move RO to NE kitchen zone; add copper vessel for stored water",
      color: "Blue or white unit placement area",
      element: "water",
      plants: "Bamboo near water storage",
      crystals: "Aquamarine near water storage area",
    },
    expectedImprovement: "Improves health and purified thought clarity",
    confidenceScore: 81,
  },
  {
    object: "plants_indoor",
    aliases: ["indoor plant", "potted plant", "houseplant", "planter"],
    room: "any",
    idealDirections: ["NE", "E", "N"],
    avoidDirections: ["SW", "Center", "SW"],
    severity: "low",
    problem: "Plants in stability zone or thorny plants in NE cause growth blocks",
    scientificReason:
      "Large plants in SW reduce usable space; thorny plants in bedroom affect air quality at night.",
    traditionalReason:
      "NE plants enhance growth; SW large plants disturb Nairutya stability; cactus in home invites prickly relations.",
    remedy: {
      easy: "Use money plant, tulsi, or bamboo in NE; remove cactus from indoors",
      moderate: "Create NE green corner with moderate-sized plants; avoid bonsai in SW",
      color: "Green planters with earth-tone pots",
      element: "wood",
      plants: "Tulsi, money plant, bamboo, peace lily",
      crystals: "Moss agate with plant pots",
    },
    expectedImprovement: "Enhances vitality and fresh energy circulation",
    confidenceScore: 72,
  },
  {
    object: "study_table",
    aliases: ["study table", "desk", "work desk", "office desk", "study desk"],
    room: "study",
    idealDirections: ["E", "NE", "N"],
    avoidDirections: ["SW", "S", "W"],
    severity: "high",
    problem: "Study desk in stability or drain zone reduces concentration",
    scientificReason:
      "Desk facing wall in SW lacks creative stimulation; poor light in S-facing desk increases eye strain.",
    traditionalReason:
      "East facing study captures Surya energy for knowledge; SW desk makes mind lazy and resistant to learning.",
    remedy: {
      easy: "Face east or north while studying; keep desk clutter-free",
      moderate: "Place desk in NE/E with good window light; use yellow lamp",
      color: "Green or yellow study area accents",
      element: "wood",
      plants: "Small bamboo or jade plant on desk",
      crystals: "Fluorite or clear quartz for focus",
    },
    expectedImprovement: "Improves career growth and exam success",
    confidenceScore: 86,
    propertyTypes: ["residential", "apartment", "office"],
  },
  {
    object: "bookshelf",
    aliases: ["bookshelf", "book rack", "bookcase", "library shelf"],
    room: "study",
    idealDirections: ["NE", "E", "N"],
    avoidDirections: ["SW", "Center"],
    severity: "medium",
    problem: "Knowledge storage in wrong zone blocks learning absorption",
    scientificReason:
      "Bookshelf blocking NE window reduces natural reading light.",
    traditionalReason:
      "Gyan (knowledge) flows from NE and East; SW bookshelf makes knowledge heavy and unusable.",
    remedy: {
      easy: "Organize books by subject; dust regularly",
      moderate: "Place bookshelf on NE or east wall below window level",
      color: "Light wood bookshelf tones",
      element: "wood",
      plants: "Small plant on top shelf of bookshelf",
      crystals: "Sodalite for wisdom",
    },
    expectedImprovement: "Enhances learning retention and intellectual growth",
    confidenceScore: 75,
  },
  {
    object: "computer_laptop",
    aliases: ["computer", "laptop", "pc", "monitor", "workstation"],
    room: "study",
    idealDirections: ["E", "NE", "N", "SE"],
    avoidDirections: ["SW", "Center", "NW"],
    severity: "medium",
    problem: "Electronics in SW bedroom zone disrupts rest and authority balance",
    scientificReason:
      "Screen exposure in bedroom affects melatonin; SW work zone blurs work-life boundary.",
    traditionalReason:
      "Fire of electronics in SW disturbs family head rest; NE computer ok for work but not if it replaces puja.",
    remedy: {
      easy: "Do not use laptop on bed; shut down before sleep",
      moderate: "Dedicated NE/E work corner; use anti-glare screen facing east",
      color: "Neutral desk setup with green plant",
      element: "fire",
      plants: "Snake plant near workstation",
      crystals: "Black tourmaline for EMF grounding",
    },
    expectedImprovement: "Boosts productivity and reduces digital fatigue",
    confidenceScore: 80,
    propertyTypes: ["residential", "apartment", "office"],
  },
  {
    object: "aquarium",
    aliases: ["aquarium", "fish tank", "fish bowl"],
    room: "living_room",
    idealDirections: ["NE", "N", "E"],
    avoidDirections: ["SW", "S", "SE", "Center"],
    severity: "high",
    problem: "Moving water in stability or fire zones creates elemental chaos",
    scientificReason:
      "Aquarium in bedroom increases humidity; in SE conflicts with kitchen fire element.",
    traditionalReason:
      "Fish aquarium in NE attracts wealth if maintained; in SW/S causes emotional turbulence and losses.",
    remedy: {
      easy: "Keep aquarium clean with healthy fish; never in bedroom",
      moderate: "Place in NE living area with active filtration; odd number of goldfish",
      color: "Blue aquarium lighting in NE zone",
      element: "water",
      plants: "Aquatic plants inside tank only",
      crystals: "Not inside tank; place blue stones near base outside",
    },
    expectedImprovement: "Attracts wealth flow and calms mind when placed correctly",
    confidenceScore: 83,
  },
  {
    object: "clock",
    aliases: ["clock", "wall clock", "timepiece"],
    room: "any",
    idealDirections: ["E", "N", "NE"],
    avoidDirections: ["S", "SW", "Center"],
    severity: "low",
    problem: "Clock in south or stopped clock symbolizes stagnant progress",
    scientificReason:
      "Visible clock in bedroom increases time anxiety affecting sleep.",
    traditionalReason:
      "Stopped or south-facing clock indicates blocked destiny; east clock supports timely success.",
    remedy: {
      easy: "Ensure all clocks work; remove bedroom wall clocks",
      moderate: "Place east-facing clock in living or office area",
      color: "Gold or wooden clock frames",
      element: "metal",
      plants: "None on clock wall",
      crystals: "None required",
    },
    expectedImprovement: "Supports punctuality and progressive life flow",
    confidenceScore: 70,
  },
  {
    object: "shoes_rack",
    aliases: ["shoe rack", "shoes stand", "footwear rack", "shoe cabinet"],
    room: "entrance",
    idealDirections: ["SW", "W", "NW"],
    avoidDirections: ["NE", "N", "E", "Center"],
    severity: "medium",
    problem: "Footwear in prosperity entry zone blocks positive arrivals",
    scientificReason:
      "Shoes at NE entrance track dirt into sacred zone and create odor at entry.",
    traditionalReason:
      "Shoes carry outside rajas energy; NE shoe rack insults Ishanya and blocks Lakshmi entry.",
    remedy: {
      easy: "Closed shoe cabinet away from main door line of sight",
      moderate: "Place shoe rack in SW or west of entrance foyer",
      color: "Closed wooden cabinet preferred",
      element: "earth",
      plants: "None at shoe rack",
      crystals: "Camphor balls for freshness",
    },
    expectedImprovement: "Improves first impression energy and guest fortune",
    confidenceScore: 78,
  },
  {
    object: "bathroom_toilet",
    aliases: ["bathroom", "toilet", "wc", "restroom", "washroom"],
    room: "bathroom",
    idealDirections: ["NW", "W", "SE"],
    avoidDirections: ["NE", "N", "E", "Center", "SW"],
    severity: "critical",
    problem: "Toilet in sacred or stability zones severely affects health and wealth",
    scientificReason:
      "Plumbing in NE causes structural seepage in many buildings; SW toilet affects master bedroom hygiene psychology.",
    traditionalReason:
      "NE toilet destroys Ishanya divine corner — among worst Vastu defects; SW toilet disturbs family head health.",
    remedy: {
      easy: "Keep toilet lid closed; use exhaust fan; maintain cleanliness",
      moderate: "Use sea salt bowl in toilet; Vastu strips on floor; keep NE toilet door always closed",
      color: "Light blue or white bathroom tones",
      element: "water",
      plants: "Avoid plants in toilet; bamboo outside door ok",
      crystals: "Himalayan salt lamp outside bathroom door",
    },
    expectedImprovement: "Major improvement in health, finances, and spiritual peace",
    confidenceScore: 96,
  },
  {
    object: "staircase",
    aliases: ["staircase", "stairs", "stairway", "steps"],
    room: "any",
    idealDirections: ["S", "SW", "W", "SE"],
    avoidDirections: ["NE", "Center", "N"],
    severity: "high",
    problem: "Stairs in center or NE drain energy and cause accidents",
    scientificReason:
      "Central staircase breaks open floor plan flow and reduces structural efficiency in earthquake zones.",
    traditionalReason:
      "Brahmasthan (center) stairs pierce house energy heart; NE stairs drain all prosperity upward and out.",
    remedy: {
      easy: "Keep stairs well-lit with anti-slip edges",
      moderate: "Use light colors on risers; place family photos on south wall of stairs (not NE)",
      color: "Light yellow or white stair walls",
      element: "earth",
      plants: "Small plant at stair landing only if not in NE",
      crystals: "Tiger eye on stair landing for grounding",
    },
    expectedImprovement: "Improves safety and upward mobility in life",
    confidenceScore: 87,
  },
  {
    object: "balcony",
    aliases: ["balcony", "terrace extension", "open balcony"],
    room: "any",
    idealDirections: ["N", "NE", "E"],
    avoidDirections: ["SW"],
    severity: "low",
    problem: "SW balcony without protection drains family stability",
    scientificReason:
      "SW open balcony exposes home to harsh afternoon sun increasing cooling costs.",
    traditionalReason:
      "SW open space without weight creates Nairiti instability for family head.",
    remedy: {
      easy: "Keep balcony clean; add heavy pots in SW balcony",
      moderate: "Use SW balcony for storage/ heavy items; keep NE balcony open and green",
      color: "Green NE balcony with plants",
      element: "wood",
      plants: "Tulsi and money plant on NE balcony",
      crystals: "Wind chimes with crystals on NE balcony",
    },
    expectedImprovement: "Balances openness with stability",
    confidenceScore: 68,
    propertyTypes: ["residential", "apartment"],
  },
  {
    object: "overhead_water_tank",
    aliases: ["overhead tank", "water tank", "roof tank"],
    room: "exterior",
    idealDirections: ["SW", "W", "NW"],
    avoidDirections: ["NE", "N", "E", "Center"],
    severity: "high",
    problem: "Heavy water overhead in light zones suppresses growth",
    scientificReason:
      "NE overhead tank increases structural load on wrong wall; leakage damages NE most critically.",
    traditionalReason:
      "Heavy jal overhead in Ishanya crushes divine blessings and children's prospects.",
    remedy: {
      easy: "Regular tank maintenance to prevent leakage",
      moderate: "Relocate tank to SW/W roof section if possible",
      color: "Paint tank to match SW wall, not bright on NE side",
      element: "water",
      plants: "No plants under leaking tank areas",
      crystals: "Not applicable structurally",
    },
    expectedImprovement: "Protects NE energy and structural integrity",
    confidenceScore: 85,
    propertyTypes: ["residential", "apartment", "shop"],
  },
  {
    object: "underground_water_tank",
    aliases: ["underground tank", "sump", "borewell", "water sump"],
    room: "exterior",
    idealDirections: ["NE", "N", "E"],
    avoidDirections: ["SW", "S", "Center"],
    severity: "critical",
    problem: "Water storage in SW creates major wealth and health drain",
    scientificReason:
      "SW underground water causes rising damp and foundation issues in many soil types.",
    traditionalReason:
      "SW jal is most severe defect — wealth flows away like water; affects generations.",
    remedy: {
      easy: "Keep sump cover sealed and clean",
      moderate: "Vastu correction pyramid in SW if relocation impossible; increase SW floor weight",
      color: "Cover with light stone in NE if tank must stay (consult expert)",
      element: "water",
      plants: "Heavy SW plants to balance if sump immovable",
      crystals: "Bury Vastu pyramid in SW corner (symbolic correction)",
    },
    expectedImprovement: "Critical for stopping wealth leakage",
    confidenceScore: 97,
    propertyTypes: ["residential", "apartment", "shop"],
  },
  {
    object: "parking",
    aliases: ["parking", "car parking", "garage", "vehicle parking"],
    room: "exterior",
    idealDirections: ["NW", "SE", "W"],
    avoidDirections: ["NE", "N", "Center"],
    severity: "medium",
    problem: "Vehicle weight in NE blocks divine entry and morning light",
    scientificReason:
      "NE parking reduces garden/green space and increases pollution at entry.",
    traditionalReason:
      "Heavy vehicles in Ishanya block Lakshmi; prefer NW (Vayavya) for air element transport.",
    remedy: {
      easy: "Park in designated NW/SE; keep NE clear",
      moderate: "NE should be garden or open; use NW garage",
      color: "Light NE area unpaved or green",
      element: "metal",
      plants: "NE garden instead of parking",
      crystals: "Not applicable",
    },
    expectedImprovement: "Improves mobility luck and entry prosperity",
    confidenceScore: 73,
    propertyTypes: ["residential", "apartment", "office", "shop"],
  },
  {
    object: "garden",
    aliases: ["garden", "lawn", "yard", "landscaping"],
    room: "exterior",
    idealDirections: ["NE", "E", "N"],
    avoidDirections: ["SW"],
    severity: "low",
    problem: "Neglected or thorny SW garden disturbs stability",
    scientificReason:
      "NE garden improves microclimate and air quality; SW thorny plants increase injury risk.",
    traditionalReason:
      "NE garden is Kuber's blessing; SW should have heavy trees not thorny bushes.",
    remedy: {
      easy: "Maintain NE garden with flowering plants",
      moderate: "SW heavy mango or ashoka tree; NE tulsi and flowering plants",
      color: "Colorful flowers in NE",
      element: "wood",
      plants: "Tulsi, marigold, jasmine in NE",
      crystals: "Decorative garden stones in NE",
    },
    expectedImprovement: "Enhances natural positivity and environmental harmony",
    confidenceScore: 71,
    propertyTypes: ["residential", "apartment", "shop"],
  },
  {
    object: "beams",
    aliases: ["beam", "exposed beam", "ceiling beam", "roof beam"],
    room: "any",
    idealDirections: [],
    avoidDirections: ["Center", "NE"],
    severity: "high",
    problem: "Exposed beam over bed or seating creates oppressive energy",
    scientificReason:
      "Low beams reduce ceiling height causing claustrophobia and poor acoustic comfort.",
    traditionalReason:
      "Beam over bed causes health issues and split energy; center beam pierces Brahmasthan.",
    remedy: {
      easy: "Do not sleep or sit directly under exposed beam",
      moderate: "Conceal beam with false ceiling; wrap beam in white cloth with Vastu symbols",
      color: "Paint beam same as ceiling to visually dissolve",
      element: "earth",
      plants: "Hanging plants to soften beam edges (not over bed)",
      crystals: "Not on beam directly",
    },
    expectedImprovement: "Relieves mental pressure and improves health",
    confidenceScore: 84,
  },
  {
    object: "pillars",
    aliases: ["pillar", "column", "structural column"],
    room: "any",
    idealDirections: ["SW", "S", "W"],
    avoidDirections: ["NE", "Center", "N"],
    severity: "high",
    problem: "Pillar in center or NE obstructs energy flow",
    scientificReason:
      "Central pillar breaks floor plan circulation and feng shui/vastu flow patterns.",
    traditionalReason:
      "Center pillar in Brahmasthan is severe defect; NE pillar blocks Ishanya growth.",
    remedy: {
      easy: "Keep pillar clean; do not lean against NE pillar",
      moderate: "Conceal with mirror (not reflecting door) or integrate into wall design",
      color: "Light color pillar matching walls",
      element: "earth",
      plants: "Wrap NE pillar with vertical garden if immovable",
      crystals: "Vastu pyramid at pillar base",
    },
    expectedImprovement: "Restores circulation of prana in home",
    confidenceScore: 86,
  },
  {
    object: "windows",
    aliases: ["window", "skylight", "ventilator"],
    room: "any",
    idealDirections: ["N", "NE", "E"],
    avoidDirections: ["SW"],
    severity: "low",
    problem: "Blocked or wrong-size windows affect light and energy entry",
    scientificReason:
      "NE windows maximize morning light for circadian health; SW large windows increase heat gain.",
    traditionalReason:
      "NE windows invite divine light; blocked NE windows shut prosperity; SW windows should be small.",
    remedy: {
      easy: "Keep NE windows clean and unobstructed",
      moderate: "Add larger NE/E windows if possible; use curtains on SW windows",
      color: "Light sheer curtains on NE",
      element: "wood",
      plants: "Window boxes on NE/E only",
      crystals: "Crystal sun catcher on NE window",
    },
    expectedImprovement: "Improves vitality and natural energy intake",
    confidenceScore: 69,
  },
  {
    object: "curtains",
    aliases: ["curtain", "drapes", "blinds", "window treatment"],
    room: "any",
    idealDirections: ["E", "N", "NE"],
    avoidDirections: ["NE", "Center", "SW"],
    severity: "low",
    problem: "Dark heavy curtains in NE block morning prosperity light",
    scientificReason:
      "Heavy dark curtains in NE reduce vitamin D exposure and mood elevation from morning sun.",
    traditionalReason:
      "NE should receive maximum light; red/black heavy curtains in bedroom SW ok but not NE.",
    remedy: {
      easy: "Use light sheer curtains on NE/E windows",
      moderate: "Room-wise colors: green NE, pink SW bedroom, yellow kitchen",
      color: "NE: white/sheer; SW bedroom: earthy tones",
      element: "wood",
      plants: "Prints with botanical motifs on curtains",
      crystals: "Not applicable",
    },
    expectedImprovement: "Balances privacy with light energy flow",
    confidenceScore: 65,
  },
];

const ROOM_COLOR_TEMPLATES: Array<{
  room: string;
  avoidColors: string[];
  idealColors: string[];
  avoidDirections: VastuDirection[];
  severity: VastuSeverity;
}> = [
  { room: "kitchen", avoidColors: ["black", "dark blue"], idealColors: ["orange", "yellow", "brown"], avoidDirections: ["NE"], severity: "medium" },
  { room: "bedroom", avoidColors: ["red", "black"], idealColors: ["pink", "peach", "cream"], avoidDirections: ["NE"], severity: "medium" },
  { room: "living_room", avoidColors: ["dark grey", "black"], idealColors: ["white", "beige", "green"], avoidDirections: ["SW"], severity: "low" },
  { room: "puja", avoidColors: ["black", "dark brown"], idealColors: ["white", "yellow", "saffron"], avoidDirections: ["SW", "S"], severity: "high" },
  { room: "bathroom", avoidColors: ["red", "black"], idealColors: ["white", "light blue", "cream"], avoidDirections: ["NE"], severity: "high" },
  { room: "study", avoidColors: ["dark red", "black"], idealColors: ["green", "yellow", "light blue"], avoidDirections: ["SW"], severity: "medium" },
  { room: "office", avoidColors: ["all black", "dark red"], idealColors: ["white", "green", "light grey"], avoidDirections: ["SW"], severity: "medium" },
  { room: "shop", avoidColors: ["dull grey"], idealColors: ["yellow", "green", "white"], avoidDirections: ["SW"], severity: "medium" },
  { room: "entrance", avoidColors: ["black", "dark red"], idealColors: ["white", "yellow", "green"], avoidDirections: ["SW"], severity: "high" },
];

const PROPERTY_MODIFIER_RULES: ObjectRuleTemplate[] = [
  {
    object: "cash_register",
    aliases: ["cash register", "billing counter", "checkout counter"],
    room: "shop",
    idealDirections: ["N", "NE", "E"],
    avoidDirections: ["SW", "S", "NW"],
    severity: "critical",
    problem: "Billing counter in drain zone causes business losses",
    scientificReason: "Counter away from entry reduces customer flow monitoring and cash visibility.",
    traditionalReason: "Shopkeeper should face east or north; SW counter opens Nairiti drain for business.",
    remedy: {
      easy: "Face north/east while billing; keep counter clean",
      moderate: "Place citrine cluster near register; green plant in NE of shop",
      color: "Yellow or green shop front accents",
      element: "metal",
      plants: "Money plant in shop NE",
      crystals: "Citrine and pyrite near register",
    },
    expectedImprovement: "Improves sales flow and customer retention",
    confidenceScore: 90,
    propertyTypes: ["shop"],
  },
  {
    object: "office_desk",
    aliases: ["office desk", "executive desk", "reception desk"],
    room: "office",
    idealDirections: ["E", "NE", "N"],
    avoidDirections: ["SW", "S"],
    severity: "high",
    problem: "Executive desk in SW office reduces leadership authority projection",
    scientificReason: "Desk with back to door increases stress; SW facing reduces natural light on workspace.",
    traditionalReason: "Office head should sit in SW facing NE for control; reversed placement weakens command.",
    remedy: {
      easy: "Sit facing east or north with solid wall behind",
      moderate: "SW seat for owner facing NE; staff in NW/E zones",
      color: "Green and white office palette",
      element: "wood",
      plants: "Bamboo in office NE",
      crystals: "Clear quartz on desk",
    },
    expectedImprovement: "Enhances leadership presence and team productivity",
    confidenceScore: 88,
    propertyTypes: ["office"],
  },
  {
    object: "entrance_main_door",
    aliases: ["shop entrance", "store front"],
    room: "entrance",
    idealDirections: ["N", "E", "NE"],
    avoidDirections: ["SW", "S"],
    severity: "critical",
    problem: "Shop entrance in south reduces footfall energy",
    scientificReason: "South-facing shopfront gets harsh sun deterring window shopping in hot climates.",
    traditionalReason: "North/East shop entrance attracts Lakshmi and customer prosperity.",
    remedy: {
      easy: "Bright signage; open glass front on NE side",
      moderate: "Yellow entrance lighting; display best products in NE corner",
      color: "Yellow, white, green storefront",
      element: "earth",
      plants: "Fresh flowers at shop entrance daily",
      crystals: "Citrine at cash and entrance",
    },
    expectedImprovement: "Increases customer attraction and revenue",
    confidenceScore: 91,
    propertyTypes: ["shop"],
  },
];

function expandTemplateToRules(template: ObjectRuleTemplate): VastuRule[] {
  const rules: VastuRule[] = [];

  for (const direction of template.avoidDirections) {
    rules.push({
      id: `${template.object}_avoid_${direction.toLowerCase()}`,
      object: template.object,
      idealDirections: [],
      avoidDirections: [direction],
      room: template.room,
      severity: template.severity,
      problem: `${template.problem} (${direction} placement)`,
      scientificReason: template.scientificReason,
      traditionalReason: `${template.traditionalReason} Placement in ${direction} zone intensifies this effect.`,
      remedy: template.remedy,
      expectedImprovement: template.expectedImprovement,
      confidenceScore: template.confidenceScore,
      propertyTypes: template.propertyTypes,
    });
  }

  for (const direction of template.idealDirections) {
    rules.push({
      id: `${template.object}_ideal_${direction.toLowerCase()}`,
      object: template.object,
      idealDirections: [direction],
      avoidDirections: [],
      room: template.room,
      severity: "low",
      problem: "",
      scientificReason: `Optimal ${template.object.replace(/_/g, " ")} placement supports spatial harmony in ${direction}.`,
      traditionalReason: `${direction} is auspicious for ${template.object.replace(/_/g, " ")} per Vastu Shastra principles.`,
      remedy: template.remedy,
      expectedImprovement: template.expectedImprovement,
      confidenceScore: Math.max(60, template.confidenceScore - 10),
      propertyTypes: template.propertyTypes,
    });
  }

  return rules;
}

function generateColorRules(): VastuRule[] {
  const rules: VastuRule[] = [];

  for (const colorTemplate of ROOM_COLOR_TEMPLATES) {
    for (const direction of colorTemplate.avoidDirections) {
      for (const avoidColor of colorTemplate.avoidColors) {
        rules.push({
          id: `colors_${colorTemplate.room}_avoid_${avoidColor.replace(/\s/g, "_")}_${direction.toLowerCase()}`,
          object: "colors",
          idealDirections: [],
          avoidDirections: [direction],
          room: colorTemplate.room,
          severity: colorTemplate.severity,
          problem: `${avoidColor} dominant colors in ${colorTemplate.room} (${direction}) create energy imbalance`,
          scientificReason: `${avoidColor} in ${colorTemplate.room} affects mood, light reflection, and perceived space quality.`,
          traditionalReason: `Room colors in ${direction} ${colorTemplate.room} should align with governing element; ${avoidColor} creates dosha.`,
          remedy: {
            easy: `Introduce ${colorTemplate.idealColors[0]} accents via cushions, curtains, or decor`,
            moderate: `Repaint one accent wall to ${colorTemplate.idealColors.join(" or ")}`,
            color: colorTemplate.idealColors.join(", "),
            element: "earth",
            plants: "Green plants to balance harsh colors",
            crystals: "Color-matched crystals on shelf",
          },
          expectedImprovement: `Harmonizes ${colorTemplate.room} energy and occupant mood`,
          confidenceScore: 68,
        });
      }
    }

    for (const idealColor of colorTemplate.idealColors) {
      rules.push({
        id: `colors_${colorTemplate.room}_ideal_${idealColor.replace(/\s/g, "_")}`,
        object: "colors",
        idealDirections: ["NE", "E", "N"],
        avoidDirections: [],
        room: colorTemplate.room,
        severity: "low",
        problem: "",
        scientificReason: `${idealColor} supports positive psychology in ${colorTemplate.room}.`,
        traditionalReason: `${idealColor} aligns with ${colorTemplate.room} element in Vastu color therapy.`,
        remedy: {
          easy: `Maintain ${idealColor} accents in ${colorTemplate.room}`,
          moderate: `Use ${idealColor} in textiles and wall art`,
          color: idealColor,
          element: "earth",
          plants: "Complementary green plants",
          crystals: "Matching colored crystals",
        },
        expectedImprovement: `Enhances comfort and positive ambiance in ${colorTemplate.room}`,
        confidenceScore: 62,
      });
    }
  }

  return rules;
}

function buildVastuRulesDatabase(): VastuRule[] {
  const allTemplates = [...OBJECT_TEMPLATES, ...PROPERTY_MODIFIER_RULES];
  const rules = allTemplates.flatMap(expandTemplateToRules);
  rules.push(...generateColorRules());
  return rules;
}

export const VASTU_RULES: VastuRule[] = buildVastuRulesDatabase();

export const VASTU_OBJECTS_COVERED = [
  ...new Set(VASTU_RULES.map((r) => r.object)),
];

let anthropicClient: Anthropic | null = null;

async function getAnthropicClient(): Promise<Anthropic | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[Vastu] ANTHROPIC_API_KEY not set — using fallback analysis");
    return null;
  }
  if (!anthropicClient) {
    const { default: AnthropicSdk } = await import("@anthropic-ai/sdk");
    anthropicClient = new AnthropicSdk({ apiKey });
  }
  return anthropicClient;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractTextFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export function degreesToDirection(degrees: number, northDirection: number): string {
  const adjusted = ((degrees - northDirection) % 360 + 360) % 360;
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(adjusted / 45) % 8;
  return labels[index] ?? "N";
}

export function parseDirectionFromText(text: string): string | null {
  const normalized = text.toUpperCase();
  const order = ["NE", "NW", "SE", "SW", "N", "E", "S", "W", "CENTER"];
  for (const dir of order) {
    if (normalized.includes(dir)) return dir === "CENTER" ? "Center" : dir;
  }
  return null;
}

function normalizeObjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function matchObjectToRuleObject(detectedName: string): string | null {
  const normalized = detectedName.toLowerCase();
  for (const template of [...OBJECT_TEMPLATES, ...PROPERTY_MODIFIER_RULES]) {
    if (template.aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return template.object;
    }
    if (normalized.includes(template.object.replace(/_/g, " "))) {
      return template.object;
    }
  }
  const norm = normalizeObjectName(detectedName);
  if (VASTU_OBJECTS_COVERED.includes(norm)) return norm;
  return null;
}

function ruleAppliesToProperty(rule: VastuRule, propertyType: string): boolean {
  if (!rule.propertyTypes || rule.propertyTypes.length === 0) return true;
  return rule.propertyTypes.includes(propertyType as VastuPropertyType);
}

export function applyVastuRules(
  analysis: VastuAnalysis,
  propertyType: string
): AppliedRule[] {
  const applied: AppliedRule[] = [];
  const seen = new Set<string>();

  for (const room of analysis.detectedRooms) {
    const roomDirection = room.compassDirection || "Center";
    const roomType = room.roomType.toLowerCase();

    for (const obj of room.detectedObjects) {
      const ruleObject = matchObjectToRuleObject(obj.name);
      const objDirection = parseDirectionFromText(obj.position) ?? roomDirection;

      if (ruleObject) {
        const relevantRules = VASTU_RULES.filter(
          (r) =>
            r.object === ruleObject &&
            ruleAppliesToProperty(r, propertyType) &&
            (r.room === "any" || roomType.includes(r.room) || r.room.includes(roomType.split(" ")[0] ?? ""))
        );

        for (const rule of relevantRules) {
          const isViolation = rule.avoidDirections.includes(objDirection);
          const isIdeal = rule.idealDirections.includes(objDirection) && rule.avoidDirections.length === 0;

          if (!isViolation && !isIdeal) continue;

          const key = `${rule.id}:${room.roomType}:${objDirection}:${obj.name}`;
          if (seen.has(key)) continue;
          seen.add(key);

          applied.push({
            rule,
            room: room.roomType,
            direction: objDirection,
            isViolation,
            detectedObject: obj.name,
            matchConfidence: isViolation ? rule.confidenceScore : rule.confidenceScore - 5,
          });
        }
      }
    }

    for (const issue of room.structuralIssues) {
      const lower = issue.toLowerCase();
      const structuralObject = lower.includes("beam")
        ? "beams"
        : lower.includes("pillar") || lower.includes("column")
          ? "pillars"
          : null;

      if (structuralObject) {
        const rules = VASTU_RULES.filter((r) => r.object === structuralObject && r.avoidDirections.length > 0);
        for (const rule of rules.slice(0, 2)) {
          applied.push({
            rule,
            room: room.roomType,
            direction: roomDirection,
            isViolation: true,
            detectedObject: issue,
            matchConfidence: rule.confidenceScore - 8,
          });
        }
      }
    }

    for (const color of room.colors) {
      const colorRules = VASTU_RULES.filter(
        (r) =>
          r.object === "colors" &&
          r.avoidDirections.includes(roomDirection) &&
          r.problem.toLowerCase().includes(color.toLowerCase())
      );
      for (const rule of colorRules) {
        applied.push({
          rule,
          room: room.roomType,
          direction: roomDirection,
          isViolation: true,
          detectedObject: `${color} wall/furniture`,
          matchConfidence: rule.confidenceScore,
        });
      }
    }

    if (room.clutter === "high") {
      applied.push({
        rule: {
          id: "clutter_high",
          object: "clutter",
          idealDirections: [],
          avoidDirections: [roomDirection],
          room: room.roomType,
          severity: "medium",
          problem: "High clutter blocks prana circulation",
          scientificReason: "Clutter increases cortisol and reduces functional space efficiency.",
          traditionalReason: "Blocked spaces trap stale energy and prevent Lakshmi circulation.",
          remedy: {
            easy: "Declutter one zone today; donate unused items",
            moderate: "Organize storage; implement daily 10-minute tidy routine",
            color: "Light colors to visually expand space",
            element: "earth",
            plants: "One healthy plant after decluttering",
            crystals: "Clear quartz in cleared corner",
          },
          expectedImprovement: "Improves mental clarity and energy flow",
          confidenceScore: 75,
        },
        room: room.roomType,
        direction: roomDirection,
        isViolation: true,
        detectedObject: "clutter",
        matchConfidence: 75,
      });
    }
  }

  return applied;
}

function clampScore(score: number): number {
  return Math.max(10, Math.min(100, Math.round(score)));
}

export function calculateVastuScore(
  analysis: VastuAnalysis,
  appliedRules: AppliedRule[]
): VastuScores {
  let overallScore = 100;
  let financialScore = 100;
  let healthScore = 100;
  let relationshipScore = 100;
  let careerScore = 100;

  const elementBalance: ElementBalance = {
    fire: 70,
    water: 70,
    earth: 70,
    metal: 70,
    wood: 70,
  };

  const positiveEnergyZones: string[] = [];
  const negativeEnergyZones: string[] = [];

  for (const applied of appliedRules) {
    const { rule, direction, isViolation, room } = applied;
    const element = rule.remedy.element;

    if (isViolation) {
      const deduction = SEVERITY_DEDUCTION[rule.severity];
      overallScore -= deduction;
      if (elementBalance[element] !== undefined) {
        elementBalance[element] -= Math.min(12, deduction);
      }

      if (FINANCIAL_OBJECTS.has(rule.object)) financialScore -= deduction;
      if (HEALTH_OBJECTS.has(rule.object)) healthScore -= deduction;
      if (RELATIONSHIP_OBJECTS.has(rule.object)) relationshipScore -= deduction;
      if (CAREER_OBJECTS.has(rule.object)) careerScore -= deduction;

      negativeEnergyZones.push(`${room} (${direction}): ${rule.object.replace(/_/g, " ")}`);
    } else {
      overallScore += DIRECTION_BONUS;
      if (elementBalance[element] !== undefined) {
        elementBalance[element] += 2;
      }

      if (FINANCIAL_OBJECTS.has(rule.object)) financialScore += DIRECTION_BONUS;
      if (HEALTH_OBJECTS.has(rule.object)) healthScore += DIRECTION_BONUS;
      if (RELATIONSHIP_OBJECTS.has(rule.object)) relationshipScore += DIRECTION_BONUS;
      if (CAREER_OBJECTS.has(rule.object)) careerScore += DIRECTION_BONUS;

      positiveEnergyZones.push(`${room} (${direction}): ${rule.object.replace(/_/g, " ")}`);
    }
  }

  for (const room of analysis.detectedRooms) {
    if (room.naturalLight === "good") overallScore += 1;
    if (room.naturalLight === "poor") overallScore -= 2;
    if (room.ventilation === "good") overallScore += 1;
    if (room.ventilation === "poor") healthScore -= 3;
  }

  for (const key of Object.keys(elementBalance) as (keyof ElementBalance)[]) {
    elementBalance[key] = clampScore(elementBalance[key]);
  }

  return {
    overallScore: clampScore(overallScore),
    financialScore: clampScore(financialScore),
    healthScore: clampScore(healthScore),
    relationshipScore: clampScore(relationshipScore),
    careerScore: clampScore(careerScore),
    elementBalance,
    positiveEnergyZones: [...new Set(positiveEnergyZones)],
    negativeEnergyZones: [...new Set(negativeEnergyZones)],
  };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B+";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function buildIssues(appliedRules: AppliedRule[]): Issue[] {
  return appliedRules
    .filter((a) => a.isViolation && a.rule.problem)
    .map((a) => ({
      id: a.rule.id,
      object: a.rule.object,
      room: a.room,
      direction: a.direction,
      severity: a.rule.severity,
      problem: a.rule.problem,
      scientificReason: a.rule.scientificReason,
      traditionalReason: a.rule.traditionalReason,
      remedy: a.rule.remedy,
      expectedImprovement: a.rule.expectedImprovement,
      priority: SEVERITY_PRIORITY[a.rule.severity],
      confidenceScore: a.matchConfidence,
    }))
    .sort((a, b) => a.priority - b.priority || b.confidenceScore - a.confidenceScore);
}

function buildRoomAnalyses(
  analysis: VastuAnalysis,
  appliedRules: AppliedRule[]
): RoomAnalysis[] {
  return analysis.detectedRooms.map((room) => {
    const roomApplied = appliedRules.filter((a) => a.room === room.roomType);
    let score = 100;
    const positives: string[] = [];

    for (const a of roomApplied) {
      if (a.isViolation) {
        score -= SEVERITY_DEDUCTION[a.rule.severity];
      } else {
        score += DIRECTION_BONUS;
        positives.push(
          `${a.detectedObject ?? a.rule.object.replace(/_/g, " ")} well placed in ${a.direction}`
        );
      }
    }

    if (room.naturalLight === "good") {
      score += 2;
      positives.push("Good natural light supports positive energy");
    }
    if (room.ventilation === "good") positives.push("Adequate ventilation maintains fresh prana");

    return {
      roomType: room.roomType,
      score: clampScore(score),
      positives,
      issues: buildIssues(roomApplied),
    };
  });
}

function buildPanchtattvaAnalysis(
  scores: VastuScores,
  appliedRules: AppliedRule[]
): VastuReport["panchtattvaAnalysis"] {
  const mapElement = (element: keyof ElementBalance, name: string, zones: string[]): PanchtattvaZone => ({
    score: scores.elementBalance[element],
    zones,
    recommendation:
      scores.elementBalance[element] >= 75
        ? `${name} element is balanced — maintain current arrangement`
        : `Strengthen ${name} element using ${element}-aligned remedies from the report`,
  });

  const fireZones = appliedRules
    .filter((a) => a.rule.remedy.element === "fire")
    .map((a) => `${a.room} (${a.direction})`);
  const waterZones = appliedRules
    .filter((a) => a.rule.remedy.element === "water")
    .map((a) => `${a.room} (${a.direction})`);

  return {
    agni: mapElement("fire", "Agni", fireZones),
    jal: mapElement("water", "Jal", waterZones),
    prithvi: mapElement("earth", "Prithvi", scores.positiveEnergyZones.slice(0, 3)),
    vayu: {
      score: clampScore((scores.elementBalance.wood + scores.overallScore) / 2),
      zones: analysisVentilationZones(appliedRules),
      recommendation: "Ensure cross-ventilation and avoid blocking NE windows for Vayu flow",
    },
    akash: {
      score: clampScore(scores.overallScore - (appliedRules.filter((a) => a.rule.object === "beams").length * 5)),
      zones: ["Center", "NE open sky/light zones"],
      recommendation: "Keep Brahmasthan (center) light and open; avoid heavy objects in core",
    },
  };
}

function analysisVentilationZones(appliedRules: AppliedRule[]): string[] {
  return appliedRules
    .filter((a) => a.rule.object === "windows" || a.rule.object === "balcony")
    .map((a) => `${a.room} (${a.direction})`);
}

function buildRemedySummary(issues: Issue[]): VastuReport["remedySummary"] {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  for (const issue of issues.slice(0, 10)) {
    immediate.push(issue.remedy.easy);
    shortTerm.push(issue.remedy.moderate);
    if (issue.severity === "critical" || issue.severity === "high") {
      longTerm.push(
        `Plan structural correction for ${issue.object.replace(/_/g, " ")} in ${issue.room} (${issue.direction})`
      );
    }
  }

  return {
    immediate: [...new Set(immediate)].slice(0, 5),
    shortTerm: [...new Set(shortTerm)].slice(0, 5),
    longTerm: [...new Set(longTerm)].slice(0, 5),
  };
}

const PROPERTY_COLOR_GUIDANCE: Record<string, { auspicious: string[]; avoid: string[]; elements: string[] }> = {
  residential: {
    auspicious: ["white", "light yellow", "green", "pink", "cream"],
    avoid: ["all black rooms", "excessive dark red in NE"],
    elements: ["earth", "water", "wood"],
  },
  apartment: {
    auspicious: ["white", "beige", "light blue", "soft green"],
    avoid: ["black walls", "dark grey in small rooms"],
    elements: ["earth", "metal", "wood"],
  },
  office: {
    auspicious: ["white", "green", "light grey", "blue accents"],
    avoid: ["all red office", " cluttered dark spaces"],
    elements: ["wood", "metal", "earth"],
  },
  shop: {
    auspicious: ["yellow", "green", "white", "gold accents"],
    avoid: ["dull brown storefront", "dark closed feeling"],
    elements: ["earth", "fire", "metal"],
  },
};

export function buildVastuReport(
  scores: VastuScores,
  appliedRules: AppliedRule[],
  analysis: VastuAnalysis,
  propertyType: string
): VastuReport {
  const issues = buildIssues(appliedRules);
  const roomAnalyses = buildRoomAnalyses(analysis, appliedRules);
  const colorGuide = PROPERTY_COLOR_GUIDANCE[propertyType] ?? PROPERTY_COLOR_GUIDANCE.residential;

  const topPriorityFixes = issues
    .slice(0, 5)
    .map(
      (i) =>
        `[${i.severity.toUpperCase()}] ${i.object.replace(/_/g, " ")} in ${i.room} (${i.direction}): ${i.remedy.easy}`
    );

  const summaryLines = [
    `Your ${propertyType} property scores ${scores.overallScore}/100 (${scoreToGrade(scores.overallScore)}) on Vastu compliance.`,
    `${issues.length} placement concern${issues.length === 1 ? "" : "s"} identified across ${analysis.detectedRooms.length} analyzed room${analysis.detectedRooms.length === 1 ? "" : "s"}.`,
    `Strongest area: ${scores.positiveEnergyZones[0] ?? "general layout"}. Priority attention: ${scores.negativeEnergyZones[0] ?? "entrance and NE zone"}.`,
    "Implementing top remedies can improve harmony within 21–40 days per traditional Vastu cycles.",
  ];

  const neutralZones = VASTU_DIRECTIONS.filter(
    (d) =>
      !scores.positiveEnergyZones.some((z) => z.includes(`(${d})`)) &&
      !scores.negativeEnergyZones.some((z) => z.includes(`(${d})`))
  ).map((d) => `${d} zone — neutral, maintain cleanliness`);

  return {
    overallScore: scores.overallScore,
    grade: scoreToGrade(scores.overallScore),
    summary: summaryLines.join(" "),
    scores,
    roomAnalyses,
    issues,
    topPriorityFixes,
    elementBalance: scores.elementBalance,
    panchtattvaAnalysis: buildPanchtattvaAnalysis(scores, appliedRules),
    energyMap: {
      positive: scores.positiveEnergyZones,
      negative: scores.negativeEnergyZones,
      neutral: neutralZones,
    },
    remedySummary: buildRemedySummary(issues),
    auspiciousColors: colorGuide.auspicious,
    avoidColors: colorGuide.avoid,
    luckyElements: colorGuide.elements,
    professionalNote:
      "This AI Vastu analysis combines traditional Vastu Shastra principles with spatial science observations from your photos. " +
      "For structural changes (toilet in NE, central pillar, underground tank in SW), consult a certified Vastu expert before demolition. " +
      "Remedies marked 'easy' are safe to implement immediately. Wishing you harmony, prosperity, and positive energy. — DivineMarg Vastu Expert Team",
  };
}

const FALLBACK_ANALYSIS: VastuAnalysis = {
  detectedRooms: [],
};

function parseVastuAnalysisJson(text: string): VastuAnalysis {
  try {
    const parsed = JSON.parse(stripJsonFences(text)) as VastuAnalysis;
    if (parsed?.detectedRooms && Array.isArray(parsed.detectedRooms)) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return { ...FALLBACK_ANALYSIS };
}

export async function analyzeVastuPhotos(
  photos: Array<{ url: string; roomLabel: string; compassDirection: number }>,
  propertyType: string,
  northDirection: number
): Promise<VastuAnalysis> {
  const client = await getAnthropicClient();
  if (!client || photos.length === 0) {
    return { ...FALLBACK_ANALYSIS };
  }

  const photoContext = photos
    .map(
      (p, i) =>
        `Photo ${i}: roomLabel="${p.roomLabel}", camera compass bearing=${p.compassDirection}°, mapped Vastu direction=${degreesToDirection(p.compassDirection, northDirection)}`
    )
    .join("\n");

  const imageBlocks: Anthropic.ContentBlockParam[] = photos.flatMap((photo, index) => [
    {
      type: "text" as const,
      text: `--- Photo index ${index} (${photo.roomLabel}, compass ${photo.compassDirection}°) ---`,
    },
    {
      type: "image" as const,
      source: { type: "url" as const, url: photo.url },
    },
  ]);

  try {
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: MAX_TOKENS,
      system: `You are a professional Vastu spatial analyst for ${propertyType} properties. Analyze interior/exterior photos for Vastu compliance.
Detect ALL visible objects: furniture, appliances, structural elements, colors, plants, mirrors, doors, windows, beams, clutter.
Map positions to Vastu directions using: property north reference=${northDirection}° (0°=North in Vastu map).
Identify room types from visual cues (kitchen tiles/stove, bed=bedroom, desk=study, etc.).
Assess natural light, ventilation, clutter, structural issues.
For each object note Vastu implication briefly.
Return ONLY valid JSON (no markdown) matching this schema:
{
  "detectedRooms": [{
    "roomType": string,
    "photoIndex": number,
    "compassDirection": "N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW"|"Center",
    "detectedObjects": [{ "name": string, "position": string, "vastuNote": string }],
    "colors": string[],
    "naturalLight": "good"|"moderate"|"poor",
    "ventilation": "good"|"moderate"|"poor",
    "clutter": "none"|"moderate"|"high",
    "structuralIssues": string[]
  }]
}`,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Analyze all ${photos.length} photos in one assessment.\n${photoContext}\nReturn comprehensive JSON only.`,
            },
          ],
        },
      ],
    });

    const text = extractTextFromMessage(message);
    return parseVastuAnalysisJson(text);
  } catch (e) {
    console.error("[Vastu] Vision analysis error:", e);
    return { ...FALLBACK_ANALYSIS };
  }
}

export function getVastuRulesCount(): number {
  return VASTU_RULES.length;
}

export function isValidPropertyType(value: string): value is VastuPropertyType {
  return (VASTU_PROPERTY_TYPES as readonly string[]).includes(value);
}
