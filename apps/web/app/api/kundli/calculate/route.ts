import { NextResponse } from "next/server";
import { z } from "zod";
import { computeKundli } from "@/lib/kundli/computeKundli";

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

  try {
    const result = computeKundli(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
