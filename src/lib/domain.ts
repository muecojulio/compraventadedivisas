export type CurrencyCode = "USD" | "JPY" | "CAD";

export type CurrencyQuote = {
  code: CurrencyCode;
  name: string;
  country: string;
  /** Pesos mexicanos por 1 unidad de la divisa. */
  mxn: number;
};

export type AztecaBoard = {
  usdCompra: number;
  usdVenta: number;
  asOf: string | null;
  source: string;
  sourceUrl: string;
};

export type RatesResponse = {
  fetchedAt: string;
  marketAsOf: string | null;
  marketSource: string;
  currencies: CurrencyQuote[];
  azteca: AztecaBoard | null;
  aztecaNote: string;
};

export type PlaceKind = "casa" | "azteca";

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  distanceM: number;
  address: string;
  hours: string | null;
  phone: string | null;
  website: string | null;
};

export type PlacesResponse = {
  places: Place[];
  radiusM: number;
  source: string;
  fetchedAt: string;
};

export type GeoHit = {
  label: string;
  lat: number;
  lon: number;
};

export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: "MX" | "US" | "JP" | "CA";
  lat: number;
  lon: number;
};

export const RADIUS_M = 5000;

export const CURRENCY_META: Record<CurrencyCode, { name: string; country: string }> = {
  USD: { name: "Dólar estadounidense", country: "Estados Unidos" },
  JPY: { name: "Yen japonés", country: "Japón" },
  CAD: { name: "Dólar canadiense", country: "Canadá" },
};

export const AIRPORTS: Airport[] = [
  { iata: "MEX", name: "AICM Benito Juárez", city: "Ciudad de México", country: "MX", lat: 19.4363, lon: -99.0721 },
  { iata: "NLU", name: "AIFA", city: "Zumpango", country: "MX", lat: 19.7472, lon: -99.0258 },
  { iata: "CUN", name: "Cancún", city: "Cancún", country: "MX", lat: 21.0365, lon: -86.8771 },
  { iata: "GDL", name: "Guadalajara", city: "Guadalajara", country: "MX", lat: 20.5218, lon: -103.3111 },
  { iata: "MTY", name: "Monterrey", city: "Apodaca", country: "MX", lat: 25.7785, lon: -100.1069 },
  { iata: "TIJ", name: "Tijuana", city: "Tijuana", country: "MX", lat: 32.5411, lon: -116.97 },
  { iata: "SJD", name: "Los Cabos", city: "San José del Cabo", country: "MX", lat: 23.1518, lon: -109.721 },
  { iata: "PVR", name: "Puerto Vallarta", city: "Puerto Vallarta", country: "MX", lat: 20.6801, lon: -105.2544 },
  { iata: "MID", name: "Mérida", city: "Mérida", country: "MX", lat: 20.937, lon: -89.6577 },
  { iata: "QRO", name: "Querétaro", city: "Querétaro", country: "MX", lat: 20.6173, lon: -100.1859 },
  { iata: "TLC", name: "Toluca", city: "Toluca", country: "MX", lat: 19.3371, lon: -99.566 },
  { iata: "LAX", name: "Los Ángeles", city: "Los Ángeles", country: "US", lat: 33.9416, lon: -118.4085 },
  { iata: "JFK", name: "John F. Kennedy", city: "Nueva York", country: "US", lat: 40.6413, lon: -73.7781 },
  { iata: "MIA", name: "Miami", city: "Miami", country: "US", lat: 25.7959, lon: -80.287 },
  { iata: "ORD", name: "O'Hare", city: "Chicago", country: "US", lat: 41.9742, lon: -87.9073 },
  { iata: "DFW", name: "Dallas-Fort Worth", city: "Dallas", country: "US", lat: 32.8998, lon: -97.0403 },
  { iata: "SFO", name: "San Francisco", city: "San Francisco", country: "US", lat: 37.6213, lon: -122.379 },
  { iata: "IAH", name: "George Bush", city: "Houston", country: "US", lat: 29.9902, lon: -95.3368 },
  { iata: "ATL", name: "Hartsfield-Jackson", city: "Atlanta", country: "US", lat: 33.6407, lon: -84.4277 },
  { iata: "SEA", name: "Seattle-Tacoma", city: "Seattle", country: "US", lat: 47.4502, lon: -122.3088 },
  { iata: "SAN", name: "San Diego", city: "San Diego", country: "US", lat: 32.7338, lon: -117.1933 },
  { iata: "NRT", name: "Narita", city: "Tokio", country: "JP", lat: 35.772, lon: 140.3929 },
  { iata: "HND", name: "Haneda", city: "Tokio", country: "JP", lat: 35.5494, lon: 139.7798 },
  { iata: "KIX", name: "Kansai", city: "Osaka", country: "JP", lat: 34.4347, lon: 135.244 },
  { iata: "ITM", name: "Itami", city: "Osaka", country: "JP", lat: 34.7855, lon: 135.4382 },
  { iata: "NGO", name: "Chubu", city: "Nagoya", country: "JP", lat: 34.8584, lon: 136.8054 },
  { iata: "FUK", name: "Fukuoka", city: "Fukuoka", country: "JP", lat: 33.5859, lon: 130.451 },
  { iata: "YYZ", name: "Pearson", city: "Toronto", country: "CA", lat: 43.6777, lon: -79.6248 },
  { iata: "YVR", name: "Vancouver", city: "Richmond", country: "CA", lat: 49.1947, lon: -123.1792 },
  { iata: "YUL", name: "Trudeau", city: "Montreal", country: "CA", lat: 45.4657, lon: -73.7455 },
  { iata: "YYC", name: "Calgary", city: "Calgary", country: "CA", lat: 51.1215, lon: -114.0076 },
  { iata: "YOW", name: "Ottawa", city: "Ottawa", country: "CA", lat: 45.3225, lon: -75.6692 },
  { iata: "YEG", name: "Edmonton", city: "Edmonton", country: "CA", lat: 53.3097, lon: -113.5797 },
];

export const DEFAULT_ORIGIN = { lat: 19.4326, lon: -99.1332, label: "Zócalo, Ciudad de México" };

export function formatMxn(value: number, digits = 2): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} km`;
}

export function aztecaPair(
  code: CurrencyCode,
  mid: number,
  usdMid: number,
  board: AztecaBoard | null,
): { compra: number; venta: number; published: boolean } | null {
  if (!board || !(mid > 0) || !(usdMid > 0)) return null;
  if (code === "USD") {
    return { compra: board.usdCompra, venta: board.usdVenta, published: true };
  }
  const compra = mid * (board.usdCompra / usdMid);
  const venta = mid * (board.usdVenta / usdMid);
  if (!(venta > compra) || !Number.isFinite(compra)) return null;
  return { compra, venta, published: false };
}
