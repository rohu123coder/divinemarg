import { NextResponse } from "next/server";
import NodeGeocoder from "node-geocoder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const geocoder = NodeGeocoder({
  provider: "openstreetmap",
  fetch: globalThis.fetch.bind(globalThis),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter q" },
      { status: 400 }
    );
  }

  try {
    const raw = await geocoder.geocode(q);
    const results = (Array.isArray(raw) ? raw : []).map((r) => ({
      city: r.city ?? r.administrativeLevels?.level2long ?? "",
      country: r.country ?? "",
      lat: r.latitude,
      lng: r.longitude,
      formattedAddress: r.formattedAddress ?? "",
    }));
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Geocoding failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
