import { securityHeaders } from "../../scripts/security-headers.mjs";
import { BusyError, clientAddress, isCrossSiteRequest, KeyedLimiter, TokenBucket } from "@/lib/security";

const perIp = {
  rates: new KeyedLimiter(30, 30 / 60),
  places: new KeyedLimiter(10, 10 / 60),
  geocode: new KeyedLimiter(8, 8 / 60),
};

const global = {
  rates: new TokenBucket(90, 90 / 60),
  places: new TokenBucket(24, 24 / 60),
  geocode: new TokenBucket(16, 16 / 60),
};

export type GuardKind = keyof typeof perIp;

function withSecurity(headers: Headers): Headers {
  const dev = process.env.NODE_ENV !== "production";
  for (const [key, value] of Object.entries(securityHeaders({ dev }))) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return headers;
}

export function apiJson(body: unknown, status = 200, cacheControl = "no-store"): Response {
  const headers = withSecurity(new Headers());
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", cacheControl);
  if (status === 429 || status === 503) headers.set("retry-after", "15");
  return new Response(JSON.stringify(body), { status, headers });
}

export function rejectIfCrossSite(request: Request): Response | null {
  if (!isCrossSiteRequest(request)) return null;
  return apiJson({ error: "Esta consulta solo se atiende desde la propia aplicación." }, 403, "no-store");
}

export function enforceLimit(request: Request, kind: GuardKind): Response | null {
  const ip = clientAddress(request);
  if (!global[kind].allow() || !perIp[kind].allow(ip)) {
    return apiJson({ error: "Demasiadas consultas. Espera un momento y vuelve a intentar." }, 429, "no-store");
  }
  return null;
}

export function upstreamFailure(error: unknown, fallback: string): Response {
  if (error instanceof BusyError) {
    return apiJson(
      { error: "Hay muchas búsquedas en este momento. Intenta de nuevo en unos segundos." },
      503,
      "no-store",
    );
  }
  return apiJson({ error: fallback }, 502, "no-store");
}
