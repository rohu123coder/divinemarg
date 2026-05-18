import { INDIAN_STATES, type IndianState } from "../data/indianStates";

export interface PincodeData {
  pincode: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  source: "india_post" | "state_fallback";
}

function normalizeStateName(apiState: string): string {
  const t = apiState.trim();
  if (/^orissa$/i.test(t)) return "Odisha";
  return t;
}

/** Compare API state string with selected IndianState name. */
export function pincodeStateMatchesSelection(
  apiState: string,
  selected: IndianState
): boolean {
  const a = normalizeStateName(apiState).toLowerCase();
  const b = selected.name.toLowerCase();
  if (a === b) return true;
  const rowA = findStateForApiName(apiState);
  if (rowA && rowA.code === selected.code) return true;
  return false;
}

function findStateForApiName(apiState: string) {
  const norm = normalizeStateName(apiState).toLowerCase();
  if (norm.includes("delhi") && norm.includes("nct")) {
    return INDIAN_STATES.find((s) => s.code === "DL");
  }
  return INDIAN_STATES.find((s) => s.name.toLowerCase() === norm);
}

/**
 * Fetch location data from India Post API (FREE, no API key needed)
 * https://api.postalpincode.in/pincode/{pincode}
 */
export async function fetchPincodeData(
  pincode: string
): Promise<PincodeData | null> {
  try {
    if (!/^\d{6}$/.test(pincode)) {
      return null;
    }

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data: unknown = await response.json();
    const root = Array.isArray(data) ? data[0] : null;
    if (
      !root ||
      typeof root !== "object" ||
      !("Status" in root) ||
      !("PostOffice" in root)
    ) {
      return null;
    }
    const status = (root as { Status?: string }).Status;
    const offices = (root as { PostOffice?: unknown[] }).PostOffice;
    if (status !== "Success" || !offices?.length) {
      return null;
    }

    const office = offices[0] as {
      District?: string;
      State?: string;
    };
    const district = String(office.District ?? "").trim();
    const stateRaw = String(office.State ?? "").trim();
    const state = stateRaw;
    const matched = findStateForApiName(stateRaw);

    return {
      pincode,
      district,
      state,
      lat: matched?.centerLat ?? 20.5937,
      lng: matched?.centerLng ?? 78.9629,
      source: "india_post",
    };
  } catch (error) {
    console.error("Pincode API error:", error);
    return null;
  }
}

export function getStateCoordinates(
  stateName: string
): { lat: number; lng: number } | null {
  const state = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === stateName.trim().toLowerCase()
  );
  return state ? { lat: state.centerLat, lng: state.centerLng } : null;
}
