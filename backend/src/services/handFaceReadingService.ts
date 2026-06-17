import type Anthropic from "@anthropic-ai/sdk";

/** Matches apps/mobile/app/chat/problem-area.tsx PROBLEM_AREAS `value` fields exactly. */
export const HAND_FACE_CATEGORIES = [
  "Career and Business",
  "Love and Relationship",
  "Marriage",
  "Financial Problems",
  "Family Issues",
  "Health",
  "Education",
  "Other",
] as const;

export type HandFaceCategory = (typeof HAND_FACE_CATEGORIES)[number];

export type PalmObservation = {
  lines?: string;
  mounts?: string;
  shape?: string;
  notable_features?: string;
};

export type FaceObservation = {
  forehead?: string;
  eyes?: string;
  jawline?: string;
  notable_features?: string;
};

export type VisionObservations = {
  palmObservations?: string;
  faceObservations?: string;
};

export type ReportSections = {
  overview: string;
  samagri: string;
  vidhi: string;
};

type TemplateContext = {
  category: string;
  palm?: PalmObservation;
  face?: FaceObservation;
  hasPalm: boolean;
  hasFace: boolean;
};

type CategoryTemplates = {
  overview: (ctx: TemplateContext) => string;
  samagri: (ctx: TemplateContext) => string;
  vidhi: (ctx: TemplateContext) => string;
};

const VISION_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

const PALM_FALLBACK: PalmObservation = {
  lines: "Could not analyze clearly",
  mounts: "Could not analyze clearly",
  shape: "Could not analyze clearly",
  notable_features: "Could not analyze clearly",
};

const FACE_FALLBACK: FaceObservation = {
  forehead: "Could not analyze clearly",
  eyes: "Could not analyze clearly",
  jawline: "Could not analyze clearly",
  notable_features: "Could not analyze clearly",
};

let anthropicClient: Anthropic | null = null;

async function getAnthropicClient(): Promise<Anthropic | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[HandFaceReading] ANTHROPIC_API_KEY not set — using fallback observations");
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

function parsePalmJson(text: string): PalmObservation {
  try {
    const parsed = JSON.parse(stripJsonFences(text)) as PalmObservation;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return { ...PALM_FALLBACK };
}

function parseFaceJson(text: string): FaceObservation {
  try {
    const parsed = JSON.parse(stripJsonFences(text)) as FaceObservation;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return { ...FACE_FALLBACK };
}

function pickField(obj: Record<string, string | undefined>, key: string, fallback: string): string {
  const value = obj[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function palmPhrase(palm: PalmObservation | undefined, hasPalm: boolean): string {
  if (!hasPalm || !palm) {
    return "";
  }
  const lines = pickField(palm, "lines", "balanced life lines");
  const mounts = pickField(palm, "mounts", "steady mounts");
  const shape = pickField(palm, "shape", "well-formed palm");
  const notable = pickField(palm, "notable_features", "distinct markings");
  return `Aapki hatheli par ${lines} dikhai deti hain, ${mounts} active lag rahe hain, aur ${shape} structure balance dikhata hai — ${notable} bhi khaas hai.`;
}

function facePhrase(face: FaceObservation | undefined, hasFace: boolean): string {
  if (!hasFace || !face) {
    return "";
  }
  const forehead = pickField(face, "forehead", "balanced forehead");
  const eyes = pickField(face, "eyes", "expressive eyes");
  const jawline = pickField(face, "jawline", "defined jawline");
  const notable = pickField(face, "notable_features", "distinct facial features");
  return `Chehre par ${forehead}, ${eyes}, aur ${jawline} — ${notable} aapki energy ko reflect karte hain.`;
}

const CATEGORY_TEMPLATES: Record<HandFaceCategory, CategoryTemplates> = {
  "Career and Business": {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Aapki photos se positive professional energy dikhai deti hai.";
      return `${visual} ${ctx.category} ke context mein, yeh combination suggest karti hai ki aap mehnat aur patience se growth pa sakte ho. Abhi ka phase decisions ko clearly soch kar lena beneficial hoga — naye opportunities ke liye darwaza khula hai, bas focus maintain rakho.`;
    },
    samagri: () =>
      "1 piece Citrine ya Yellow Sapphire (as per budget), 1 small brass diya, desi ghee, 5 yellow flowers, 1 yellow cloth, aur ek copper coin. In sab ko ek chhote thali mein rakho.",
    vidhi: () =>
      "Har Thursday subah 6–8 baje ke beech, pehle haath-dho kar yellow cloth par baith jao. Citrine ko right haath mein pakad kar 11 baar 'Om Gurave Namah' bolo. Phir diya jalao aur 5 minute tak career growth ka sankalp lo. 21 din tak repeat karo — best results ke liye same time follow karo.",
  },
  "Love and Relationship": {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Aapki images se warm, open-hearted energy feel hoti hai.";
      return `${visual} ${ctx.category} ke liye yeh signs batate hain ki emotional honesty aur patience dono important hain. Agar aap dil se communicate karte ho, toh connection deepen ho sakta hai — thoda time do, par apne values se mat hato.`;
    },
    samagri: () =>
      "Gulab ki 5 pankhudiyan, 1 chhoti Rose Quartz mala ya stone, shakkar, 1 white cloth, aur ek chhota silver bowl (steel bhi chalega). Paani thoda sa alag rakho.",
    vidhi: () =>
      "Har Friday shaam ko, white cloth par baith kar gulab ki pankhudiyan bowl mein rakho. Rose Quartz ko dil ke paas rakh kar 11 baar 'Om Kamadevaya Namah' whisper karo. Phir thoda paani aur shakkar mila kar apne aas-paas chhida do (ya plant ko de do). 11 din tak karo — is duration mein negative thoughts ko feed mat karo.",
  },
  Marriage: {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Photos se stable, family-oriented vibes aa rahi hain.";
      return `${visual} ${ctx.category} ke sandarbh mein, yeh combination harmony aur commitment dono ko support karti hai. Agar aap patience aur respect se approach karte ho, toh long-term bond strong ho sakta hai — family blessings aur clear communication key hain.`;
    },
    samagri: () =>
      "2 laal chunri ya laal kapda ke tukde, 1 mangalsutra-style thread (simple red-yellow thread bhi chalega), chhoti mithai, 1 diya, desi ghee, aur haldi powder thoda sa.",
    vidhi: () =>
      "Har Tuesday ya Friday ko shaam 6 baje ke baad, laal kapde par baith kar diya jalao. Thread ko dono haathon mein lapet kar 11 baar 'Om Gauri Shankaraya Namah' bolo. Mithai ka ek tukda apne saamne rakh kar marriage harmony ka sankalp lo. 21 din tak — specially jhagda wale din skip mat karo, bas calmly karo.",
  },
  "Financial Problems": {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Images se resilience aur recovery ki energy dikhti hai.";
      return `${visual} ${ctx.category} ke context mein, yeh signs batate hain ki disciplined savings aur smart choices se situation improve ho sakti hai. Abhi impulsive spending avoid karo — chhote consistent steps se stability wapas aa sakti hai.`;
    },
    samagri: () =>
      "1 Kuber Yantra (chhota print bhi chalega), 1 green cloth, 11 rice grains, 1 copper coin, aur thoda ilaichi powder. Ek chhota kalash ya bowl rakho.",
    vidhi: () =>
      "Har Wednesday subah, green cloth par Kuber Yantra rakho. 11 rice grains aur coin saath mein rakh kar 11 baar 'Om Shreem Mahalakshmiyei Namah' bolo. Us din ek unnecessary expense consciously avoid karo. 21 din tak repeat — har hafte apne accounts ek baar review karo.",
  },
  "Family Issues": {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Photos se caring, protective family energy feel hoti hai.";
      return `${visual} ${ctx.category} ke liye yeh combination suggest karti hai ki patience aur soft communication se misunderstandings clear ho sakti hain. Gussa kam karke sunna — yeh sabse powerful upay hai. Family harmony dheere-dheere improve hogi.`;
    },
    samagri: () =>
      "1 chhoti family photo (print), 1 white cloth, chandan powder, 1 diya, desi ghee, aur 5 tulsi ya neem patte (tulsi na ho toh koi bhi green patte).",
    vidhi: () =>
      "Har Sunday subah, family photo ko white cloth par rakho. Chandan ka chhota tilak photo par lagao (ya photo ke saamne lagao). Diya jalakar 11 baar 'Om Namah Shivaya' bolo aur family peace ka sankalp lo. 11 din tak — is duration mein ghar mein intentionally ek positive baat share karo har din.",
  },
  Health: {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Images se overall vitality aur self-care ki need dono reflect hote hain.";
      return `${visual} ${ctx.category} ke context mein, yeh signs batate hain ki rest, routine aur positive mindset recovery ko support karenge. Yeh report medical advice nahi hai — par daily discipline aur stress management se energy balance ho sakti hai.`;
    },
    samagri: () =>
      "1 amethyst ya clear quartz (chhota), 1 blue cloth, paani ka glass, thoda sendha namak, aur ek fresh fruit (seasonal — apple ya banana chalega).",
    vidhi: () =>
      "Har subah khali pet paani mein thoda sendha namak mila kar peene se pehle, blue cloth par baith kar stone ko pakad kar 11 baar 'Om Dhanvantre Namah' bolo. Us din ek fresh fruit khud ko gift karo. 21 din tak — sath mein 20 minute walk ya light stretch add karo agar doctor allow kare.",
  },
  Education: {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Photos se sharp, learning-oriented energy dikhai deti hai.";
      return `${visual} ${ctx.category} ke liye yeh combination focus aur perseverance ko highlight karti hai. Consistent study routine aur distractions kam karne se results improve ho sakte hain — confidence badhao, comparison kam karo.`;
    },
    samagri: () =>
      "1 yellow notebook ya study diary, 1 pen, 1 Saraswati yantra (chhota print), yellow flowers 3, aur ek chhota misri ka tukda.",
    vidhi: () =>
      "Har subah padhai se pehle, diary aur pen saamne rakho. 11 baar 'Om Saraswatyai Namah' bolo aur aaj ka ek clear study goal likho. Misri muh mein rakh kar padhai shuru karo. 21 din tak — har raat 5 minute revise karo jo seekha. Exam ke din extra calm rehna.",
  },
  Other: {
    overview: (ctx) => {
      const palm = palmPhrase(ctx.palm, ctx.hasPalm);
      const face = facePhrase(ctx.face, ctx.hasFace);
      const parts = [palm, face].filter(Boolean);
      const visual =
        parts.length > 0
          ? parts.join(" ")
          : "Aapki photos se balanced, hopeful energy feel hoti hai.";
      return `${visual} Jo bhi ${ctx.category} concern ho, yeh signs batate hain ki clarity aur positive action se situation shift ho sakti hai. Khud par bharosa rakho — universe aapke saath hai jab aap consistent effort karte ho.`;
    },
    samagri: () =>
      "1 white candle ya diya, 1 multi-colour thread (7 colours wala rakhi thread bhi chalega), chhoti mithai, aur ek chhota notebook.",
    vidhi: () =>
      "Har Monday ko subah, notebook mein apna concern ek line mein likho. Thread ko wrist par 3 baar lapet kar 11 baar 'Om Namah Shivaya' bolo. Diya/candle jalao aur 5 minute shant baitho. 11 din tak — har din ek chhota positive action lo jo concern se related ho.",
  },
};

async function analyzePalmImage(imageUrl: string): Promise<string> {
  const client = await getAnthropicClient();
  if (!client) {
    return JSON.stringify(PALM_FALLBACK);
  }

  try {
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are a neutral visual observer describing palm photographs. You are NOT an astrologer and must NOT make predictions, fortune-telling, or medical claims. Respond with ONLY a valid JSON object (no markdown) with keys: lines, mounts, shape, notable_features. Each value is a brief factual visual description in English.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Describe this palm photo visually. Return ONLY JSON: { \"lines\": \"...\", \"mounts\": \"...\", \"shape\": \"...\", \"notable_features\": \"...\" }",
            },
          ],
        },
      ],
    });

    const text = extractTextFromMessage(message);
    const parsed = parsePalmJson(text);
    return JSON.stringify(parsed);
  } catch (e) {
    console.error("[HandFaceReading] Palm vision error:", e);
    return JSON.stringify(PALM_FALLBACK);
  }
}

async function analyzeFaceImage(imageUrl: string): Promise<string> {
  const client = await getAnthropicClient();
  if (!client) {
    return JSON.stringify(FACE_FALLBACK);
  }

  try {
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are a neutral visual observer describing face photographs. You are NOT an astrologer and must NOT make predictions, fortune-telling, or medical claims. Respond with ONLY a valid JSON object (no markdown) with keys: forehead, eyes, jawline, notable_features. Each value is a brief factual visual description in English.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Describe this face photo visually. Return ONLY JSON: { \"forehead\": \"...\", \"eyes\": \"...\", \"jawline\": \"...\", \"notable_features\": \"...\" }",
            },
          ],
        },
      ],
    });

    const text = extractTextFromMessage(message);
    const parsed = parseFaceJson(text);
    return JSON.stringify(parsed);
  } catch (e) {
    console.error("[HandFaceReading] Face vision error:", e);
    return JSON.stringify(FACE_FALLBACK);
  }
}

export async function getVisionObservations(images: {
  palmUrl?: string;
  faceUrl?: string;
}): Promise<VisionObservations> {
  const result: VisionObservations = {};

  if (images.palmUrl) {
    result.palmObservations = await analyzePalmImage(images.palmUrl);
  }
  if (images.faceUrl) {
    result.faceObservations = await analyzeFaceImage(images.faceUrl);
  }

  return result;
}

function parseObservationString<T extends Record<string, string | undefined>>(
  raw: string | undefined,
  fallback: T
): T | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function buildReport(
  category: string,
  observations: VisionObservations
): ReportSections {
  const templateKey = HAND_FACE_CATEGORIES.includes(category as HandFaceCategory)
    ? (category as HandFaceCategory)
    : "Other";

  const templates = CATEGORY_TEMPLATES[templateKey];
  const palm = parseObservationString(observations.palmObservations, PALM_FALLBACK);
  const face = parseObservationString(observations.faceObservations, FACE_FALLBACK);

  const ctx: TemplateContext = {
    category,
    palm,
    face,
    hasPalm: Boolean(observations.palmObservations),
    hasFace: Boolean(observations.faceObservations),
  };

  return {
    overview: templates.overview(ctx),
    samagri: templates.samagri(ctx),
    vidhi: templates.vidhi(ctx),
  };
}

export function isValidHandFaceCategory(value: string): value is HandFaceCategory {
  return (HAND_FACE_CATEGORIES as readonly string[]).includes(value);
}
