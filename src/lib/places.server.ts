import { z } from "zod";
import { RADIUS_M, type GeoHit, type Place, type PlaceKind, type PlacesResponse } from "@/lib/domain";
import { haversineM } from "@/lib/geo";
import {
  BusyError,
  LruTtlCache,
  RequestPacer,
  fetchAllowlisted,
  safeHttpUrl,
  sanitizeDisplayText,
  sanitizePhone,
  sanitizeSearchQuery,
} from "@/lib/security";

const UA = "CompraVentaDivisas/1.0 (buscador de casas de cambio; uso personal)";
const TTL_MS = 8 * 60_000;
const cache = new LruTtlCache<PlacesResponse>(180, TTL_MS);
const inflight = new Map<string, Promise<PlacesResponse>>();
const nominatim = new RequestPacer(1100, 8);

const querySchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

type NominatimRow = {
  place_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
};

function rowToPlace(row: NominatimRow, originLat: number, originLon: number, kind: PlaceKind): Place | null {
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const distanceM = haversineM(originLat, originLon, lat, lon);
  if (distanceM > RADIUS_M) return null;
  const address = row.address ?? {};
  const street = [sanitizeDisplayText(address.road, 80), sanitizeDisplayText(address.house_number, 16)]
    .filter(Boolean)
    .join(" ");
  const city = sanitizeDisplayText(
    address.city || address.town || address.suburb || address.neighbourhood || "",
    80,
  );
  const extra = row.extratags ?? {};
  const fallback = kind === "azteca" ? "Banco Azteca" : "Casa de cambio";
  const name =
    sanitizeDisplayText(row.name, 80) ||
    sanitizeDisplayText((row.display_name || "").split(",")[0], 80) ||
    fallback;
  return {
    id: `osm-${row.place_id ?? `${lat.toFixed(5)},${lon.toFixed(5)}`}`,
    name,
    kind,
    lat,
    lon,
    distanceM,
    address: [street, city].filter(Boolean).join(", "),
    hours: sanitizeDisplayText(extra.opening_hours, 120) || null,
    phone: sanitizePhone(extra.phone || extra["contact:phone"] || ""),
    website: safeHttpUrl(extra.website || extra["contact:website"] || ""),
  };
}

async function nominatimSearch(q: string, lat: number, lon: number): Promise<NominatimRow[]> {
  const dLat = RADIUS_M / 111_000;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLon = RADIUS_M / (111_000 * (Math.abs(cos) < 0.2 ? 0.2 : cos));
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "25");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("viewbox", `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`);
  const text = await nominatim.run(() =>
    fetchAllowlisted(url.toString(), {
      headers: { accept: "application/json", "user-agent": UA, "accept-language": "es" },
      maxBytes: 1_500_000,
    }),
  );
  const rows = JSON.parse(text) as unknown;
  return Array.isArray(rows) ? (rows as NominatimRow[]) : [];
}

async function queryPlaces(lat: number, lon: number): Promise<Place[]> {
  const casas = await nominatimSearch("bureau de change", lat, lon);
  const bancos = await nominatimSearch("Banco Azteca", lat, lon);
  const seen = new Set<string>();
  const places: Place[] = [];
  const push = (row: NominatimRow, kind: PlaceKind) => {
    const place = rowToPlace(row, lat, lon, kind);
    if (!place) return;
    const key = `${place.name.toLowerCase()}@${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
    if (seen.has(key)) return;
    seen.add(key);
    places.push(place);
  };
  for (const row of casas) {
    const blob = `${row.name ?? ""} ${row.type ?? ""}`.toLowerCase();
    push(row, blob.includes("azteca") ? "azteca" : "casa");
  }
  for (const row of bancos) push(row, "azteca");
  places.sort((a, b) => a.distanceM - b.distanceM);
  return places.slice(0, 40);
}

export async function getPlaces(lat: number, lon: number): Promise<PlacesResponse> {
  const parsed = querySchema.parse({ lat, lon });
  const key = cacheKey(parsed.lat, parsed.lon);
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;
  if (inflight.size > 32) throw new BusyError();
  const job = queryPlaces(parsed.lat, parsed.lon)
    .then((places) => {
      const data: PlacesResponse = {
        places,
        radiusM: RADIUS_M,
        source: "OpenStreetMap / Nominatim",
        fetchedAt: new Date().toISOString(),
      };
      cache.set(key, data);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, job);
  return job;
}

export async function geocode(raw: string): Promise<GeoHit[]> {
  const q = sanitizeSearchQuery(raw);
  if (q.length < 2) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  const text = await nominatim.run(() =>
    fetchAllowlisted(url.toString(), {
      headers: { accept: "application/json", "user-agent": UA, "accept-language": "es" },
      maxBytes: 600_000,
    }),
  );
  const rows = JSON.parse(text) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as { display_name?: string; lat?: string; lon?: string };
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      const label = sanitizeDisplayText(String(item.display_name ?? "").split(",").slice(0, 3).join(","), 140);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !label) return null;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
      return { label, lat, lon };
    })
    .filter((row): row is GeoHit => row != null);
}
