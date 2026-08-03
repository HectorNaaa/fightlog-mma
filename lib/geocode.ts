/**
 * Free, keyless geocoding for postal codes using the OpenStreetMap Nominatim
 * public API. Best-effort only: failures return null and never throw, so
 * profile updates always succeed even if geocoding is unavailable.
 *
 * Nominatim usage policy requires a descriptive User-Agent and no more than
 * ~1 request/second — acceptable here since geocoding only runs when a user
 * changes their postal code (a rare, user-initiated action).
 */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function geocodePostalCode(
  postalCode: string,
  countryCode?: string
): Promise<GeocodeResult | null> {
  const trimmed = postalCode.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    postalcode: trimmed,
    format: "json",
    limit: "1",
  });
  if (countryCode) params.set("countrycodes", countryCode.toLowerCase());

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "FightLogApp/1.0 (https://fightlogapp.vercel.app)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(results) || results.length === 0) return null;

    const lat = Number(results[0].lat);
    const lon = Number(results[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch (error) {
    console.warn("[geocode] Failed to resolve postal code", error);
    return null;
  }
}
