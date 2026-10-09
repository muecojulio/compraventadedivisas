/**
 * Controles de la app (no del andamiaje de la plataforma).
 *
 * Cubre los huecos reales del cotizador: enlaces que llegan de OpenStreetMap,
 * consumo de recursos de las APIs públicas y peticiones del servidor que solo
 * pueden ir a una lista cerrada de sitios. No sustituye un perímetro de red.
 */

export const ALLOWED_UPSTREAM_HOSTS = new Set([
  "query1.finance.yahoo.com",
  "open.er-api.com",
  "cdn.jsdelivr.net",
  "dolarenmexico.com",
  "nominatim.openstreetmap.org",
]);

const MAX_URL_LENGTH = 300;

export class BusyError extends Error {
  readonly status = 503;
  constructor() {
    super("busy");
    this.name = "BusyError";
  }
}

export class UpstreamError extends Error {
  constructor(message = "upstream") {
    super(message);
    this.name = "UpstreamError";
  }
}

function isUnsafeText(code: number): boolean {
  if (code <= 0x1f || code === 0x7f || code === 0xfeff) return true;
  if (code >= 0x200b && code <= 0x200f) return true;
  if (code >= 0x202a && code <= 0x202e) return true;
  return code >= 0x2066 && code <= 0x2069;
}

/** Texto visible: sin controles, sin marcas bidireccionales, con tope. */
export function sanitizeDisplayText(value: unknown, max = 180): string {
  if (typeof value !== "string") return "";
  let cleaned = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    cleaned += isUnsafeText(code) ? " " : char;
  }
  const compact = cleaned.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.length > max ? compact.slice(0, max).trim() : compact;
}

/** Consulta de lugar: letras, números y unos pocos signos. */
export function sanitizeSearchQuery(value: unknown, max = 120): string {
  const base = sanitizeDisplayText(value, max);
  return base
    .replace(/[^\p{L}\p{N}\s,.'#/-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = sanitizeDisplayText(value, 32).replace(/[^\d+().\-\s]/g, "").replace(/\s+/g, " ").trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  if ((cleaned.match(/\+/g) ?? []).length > 1) return null;
  if (cleaned.includes("+") && !cleaned.startsWith("+")) return null;
  return cleaned;
}

export function safeTelHref(value: unknown): string | null {
  const phone = sanitizePhone(value);
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function hasControlOrSpace(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0" || host === "::" || host === "::1") return true;
  if (/^\d+$/.test(host)) return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (host.includes(":")) {
    if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
  }
  return false;
}

/**
 * Solo http(s) públicos, sin credenciales y sin devolver la cadena original.
 * Así un `javascript:` o un `data:` de OpenStreetMap no llega al enlace.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > MAX_URL_LENGTH) return null;
  if (hasControlOrSpace(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (isBlockedHostname(url.hostname)) return null;
  return url.href;
}

export function safeHostname(value: unknown): string | null {
  const href = safeHttpUrl(value);
  if (!href) return null;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Destino fijo de Google Maps. Las coordenadas no se interpolan en crudo. */
export function mapsDirectionsUrl(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const destination = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/** El navegador marca las peticiones hechas desde otro sitio. Las relativas no. */
export function isCrossSiteRequest(request: { headers: { get(name: string): string | null } }): boolean {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

const IP_KEY = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{2,64}$/i;

/**
 * Clave de límite, no una identidad. Si el proxy no pone la IP, todas las
 * visitas anónimas comparten cubo: el límite global sigue aplicando.
 */
export function clientAddress(request: { headers: { get(name: string): string | null } }): string {
  const candidates = [
    request.headers.get("x-real-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-forwarded-for"),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim() ?? "";
    if (first.length >= 3 && first.length <= 64 && IP_KEY.test(first)) return first;
  }
  return "anon";
}

export class TokenBucket {
  private tokens: number;
  private updated: number;
  private capacity: number;
  private refillPerSec: number;

  constructor(capacity: number, refillPerSec: number, now = Date.now()) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity;
    this.updated = now;
  }

  allow(cost = 1, now = Date.now()): boolean {
    const elapsed = Math.max(0, (now - this.updated) / 1000);
    this.updated = now;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec);
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    return true;
  }
}

export class KeyedLimiter {
  private buckets = new Map<string, TokenBucket>();
  private capacity: number;
  private refillPerSec: number;
  private maxKeys: number;

  constructor(capacity: number, refillPerSec: number, maxKeys = 2000) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.maxKeys = maxKeys;
  }

  allow(key: string, now = Date.now()): boolean {
    const id = key.slice(0, 80) || "anon";
    let bucket = this.buckets.get(id);
    if (!bucket) {
      if (this.buckets.size >= this.maxKeys) {
        const oldest = this.buckets.keys().next().value;
        if (oldest) this.buckets.delete(oldest);
      }
      bucket = new TokenBucket(this.capacity, this.refillPerSec, now);
      this.buckets.set(id, bucket);
    }
    return bucket.allow(1, now);
  }
}

export class LruTtlCache<T> {
  private map = new Map<string, { at: number; data: T }>();
  private max: number;
  private ttlMs: number;

  constructor(max: number, ttlMs: number) {
    this.max = max;
    this.ttlMs = ttlMs;
  }

  get(key: string, now = Date.now()): T | null {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (now - hit.at > this.ttlMs) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.data;
  }

  set(key: string, data: T, now = Date.now()): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { at: now, data });
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }
}

/** Cola con hueco mínimo entre llamadas. Si se llena, rechaza en vez de crecer. */
export class RequestPacer {
  private chain: Promise<unknown> = Promise.resolve();
  private nextAt = 0;
  private queued = 0;
  private gapMs: number;
  private maxQueue: number;

  constructor(gapMs: number, maxQueue: number) {
    this.gapMs = gapMs;
    this.maxQueue = maxQueue;
  }

  run<T>(job: () => Promise<T>): Promise<T> {
    if (this.queued >= this.maxQueue) return Promise.reject(new BusyError());
    this.queued += 1;
    const task = this.chain.then(async () => {
      const wait = this.nextAt - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.nextAt = Date.now() + this.gapMs;
      return job();
    });
    this.chain = task.then(
      () => undefined,
      () => undefined,
    );
    return task.finally(() => {
      this.queued -= 1;
    });
  }
}

/** https, puerto 443 y anfitrión de la lista. No se sigue un redirect a otro sitio. */
export function assertAllowlistedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  if (!ALLOWED_UPSTREAM_HOSTS.has(url.hostname)) return null;
  return url.toString();
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel();
    throw new UpstreamError("too-large");
  }
  if (!res.body) {
    const text = await res.text();
    if (text.length > maxBytes) throw new UpstreamError("too-large");
    return text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new UpstreamError("too-large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(out);
}

export async function fetchAllowlisted(
  rawUrl: string,
  init: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxBytes?: number;
  } = {},
): Promise<string> {
  const maxBytes = init.maxBytes ?? 1_500_000;
  let current = assertAllowlistedUrl(rawUrl);
  if (!current) throw new UpstreamError("host");

  for (let hop = 0; hop < 3; hop += 1) {
    const res = await fetch(current, {
      headers: init.headers,
      redirect: "manual",
      signal: AbortSignal.timeout(init.timeoutMs ?? 12_000),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) throw new UpstreamError("redirect");
      const next = assertAllowlistedUrl(new URL(location, current).toString());
      if (!next) throw new UpstreamError("redirect-host");
      current = next;
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      throw new UpstreamError(`HTTP ${res.status}`);
    }
    return readCapped(res, maxBytes);
  }
  throw new UpstreamError("redirects");
}
