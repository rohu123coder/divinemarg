import { NextResponse } from "next/server";

import { createHoroscope, type Period } from "@/lib/horoscope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const periods: Period[] = ["today", "tomorrow", "weekly", "monthly"];

export function GET(req: Request) {
  const url = new URL(req.url);
  const rashiParam = url.searchParams.get("rashi");
  const periodParam = (url.searchParams.get("period") ?? "today").toLowerCase();

  if (!rashiParam) {
    return NextResponse.json(
      { error: "Missing required query param: rashi" },
      { status: 400 }
    );
  }

  const period = periods.includes(periodParam as Period)
    ? (periodParam as Period)
    : "today";
  const horoscope = createHoroscope(rashiParam, period);

  if (!horoscope) {
    return NextResponse.json(
      { error: "Invalid rashi. Use a valid zodiac id or alias." },
      { status: 404 }
    );
  }

  return NextResponse.json(horoscope);
}
