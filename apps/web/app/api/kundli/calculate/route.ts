import { NextResponse } from "next/server";
import { z } from "zod";
import { computeKundli } from "@/lib/kundli/computeKundli";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://divinemarg.onrender.com";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1, "name is required"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD"),
  tob: z
    .union([
      z.string().regex(/^\d{1,2}:\d{2}$/, "tob must be HH:MM (24h)"),
      z.null(),
    ])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  pob: z.string().min(1, "pob is required"),
  lat: z.number().gte(-90, "lat must be >= -90").lte(90, "lat must be <= 90"),
  lng: z
    .number()
    .gte(-180, "lng must be >= -180")
    .lte(180, "lng must be <= 180"),
  gender: z.enum(["male", "female"]),
  utcOffset: z.number().finite().optional().default(5.5),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const body = parsed.data;

  try {
    // Try backend Swiss Ephemeris first
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/kundali/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dob: body.dob,
          tob: body.tob ?? null,
          lat: body.lat,
          lng: body.lng,
          utcOffset: body.utcOffset ?? 5.5,
        }),
      });
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData.success && backendData.data) {
          // Merge with local kundli for predictions/yogas/dasha
          const localKundli = computeKundli({
            name: body.name ?? "",
            dob: body.dob,
            tob: body.tob ?? null,
            pob: body.pob ?? "",
            lat: body.lat,
            lng: body.lng,
            gender: body.gender ?? "male",
            utcOffset: body.utcOffset ?? 5.5,
          });
          
          // Override with accurate Swiss Ephemeris data
          const bd = backendData.data;
          localKundli.basicInfo.ascendant = {
            rashi: bd.ascendant.rashi,
            degree: bd.ascendant.degree,
          };
          localKundli.basicInfo.moonSign = {
            rashi: bd.moonSign.rashi,
            degree: bd.moonSign.degree,
          };
          localKundli.basicInfo.sunSign = {
            rashi: bd.sunSign.rashi,
            degree: bd.sunSign.degree,
            minutes: 0,
          };
          localKundli.basicInfo.nakshatra = {
            name: bd.nakshatra.name,
            lord: bd.nakshatra.lord,
            pada: bd.nakshatra.pada,
          };
          
          return NextResponse.json(localKundli);
        }
      }
    } catch (backendError) {
      console.error("Backend kundali error, falling back to local:", backendError);
    }

    const result = computeKundli(body);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
