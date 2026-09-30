import { z } from "zod";
import { RADIUS_M, type GeoHit, type Place, type PlaceKind, type PlacesResponse } from "@/lib/domain";
import { haversineM } from "@/lib/geo";

const UA = "CompraVentaDivisas/1.0 (buscador de casas de cambio; uso personal)";

type CacheEntry = { at: number; data: PlacesResponse };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<PlacesResponse>>();
const TTL_MS = 8 * 60_000;

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
  const distanceM = haversineM(originLat, originLon, lat, lon);
  if (distanceM > RADIUS_M) return null;
  const address = row.address ?? {};
  const street = [address.road, address.house_number].filter(Boolean).join(" ");
  const city = address.city || address.town || address.suburb || address.neighbourhood || "";
  const extra = row.extratags ?? {};
  const name =
    (row.name || "").trim() ||
    (kind === "azteca" ? "Banco Azteca" : (row.display_name || "Casa de cambio").split(",")[0] || "Casa de cambio");
  return {
    id: `osm-${row.place_id ?? `${lat.toFixed(5)},${lon.toFixed(5)}`}`,
    name,
    kind,
    lat,
    lon,
    distanceM,
    address: [street, city].filter(Boolean).join(", "),
    hours: extra.opening_hours ?? null,
    phone: extra.phone || extra["contact:phone"] || null,
    website: extra.website || extra["contact:website"] || null,
  };
}

async function nominatimSearch(q: string, lat: number, lon: number): Promise<NominatimRow[]> {
  const dLat = RADIUS_M / 111_000;
  const dLon = RADIUS_M / (111_000 * Math.cos((lat * Math.PI) / 180));
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "25");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("viewbox", `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`);
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": UA, "accept-language": "es" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const rows = (await res.json()) as NominatimRow[];
  return Array.isArray(rows) ? rows : [];
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
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = queryPlaces(parsed.lat, parsed.lon)
    .then((places) => {
      const data: PlacesResponse = {
        places,
        radiusM: RADIUS_M,
        source: "OpenStreetMap / Nominatim",
        fetchedAt: new Date().toISOString(),
      };
      cache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, job);
  return job;
}

const geoSchema = z.string().trim().min(2).max(120);

export async function geocode(raw: string): Promise<GeoHit[]> {
  const q = geoSchema.parse(raw).replace(/[^\p{L}\p{N}\s,.'#/-]/gu, "");
  if (q.length < 2) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": UA, "accept-language": "es" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const rows = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const lat = Number(row.lat);
      const lon = Number(row.lon);
      const label = (row.display_name ?? "").split(",").slice(0, 3).join(",").trim();
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !label) return null;
      return { label, lat, lon };
    })
    .filter((row): row is GeoHit => row != null);
}
