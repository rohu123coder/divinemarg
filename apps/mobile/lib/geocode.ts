export interface GeocodeResult {
  city: string;
  country: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://www.divinemarg.com/api/kundli/geocode?q=${encodeURIComponent(query.trim())}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];
    return results.filter(
      (r: GeocodeResult) =>
        typeof r.lat === "number" &&
        typeof r.lng === "number" &&
        !Number.isNaN(r.lat) &&
        !Number.isNaN(r.lng)
    );
  } catch {
    return [];
  }
}
