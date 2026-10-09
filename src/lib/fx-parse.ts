import type { CurrencyCode } from "./domain.ts";

export const RATE_BANDS: Record<CurrencyCode, readonly [number, number]> = {
  USD: [8, 60],
  CAD: [6, 50],
  JPY: [0.03, 0.8],
};

export function inRateBand(code: CurrencyCode, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const [lo, hi] = RATE_BANDS[code];
  return value >= lo && value <= hi;
}

export function downsample(values: number[], max: number): number[] {
  if (values.length <= max) return values.slice();
  const out: number[] = [];
  const step = (values.length - 1) / (max - 1);
  for (let i = 0; i < max; i += 1) {
    const value = values[Math.round(i * step)];
    if (value !== undefined) out.push(value);
  }
  return out;
}

export function dayChangePct(closes: number[]): number | null {
  const first = closes[0];
  const last = closes[closes.length - 1];
  if (first == null || last == null || !(first > 0)) return null;
  const pct = ((last - first) / first) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) > 40) return null;
  return Math.round(pct * 100) / 100;
}

export type YahooPoint = { price: number; time: number; closes: number[] };

function closesNearSpot(raw: unknown, spot: number): number[] {
  if (!Array.isArray(raw)) return [];
  const lo = spot * 0.55;
  const hi = spot * 1.45;
  const clean: number[] = [];
  for (const value of raw) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (value < lo || value > hi) continue;
    clean.push(value);
  }
  return downsample(clean, 28);
}

/** Lee el chart de Yahoo y descarta precios imposibles o series fuera de banda. */
export function parseYahooChart(payload: unknown): YahooPoint | null {
  if (!payload || typeof payload !== "object") return null;
  const result = (payload as { chart?: { result?: unknown[] } }).chart?.result?.[0];
  if (!result || typeof result !== "object") return null;
  const meta = (result as { meta?: Record<string, unknown> }).meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0 || price > 1000) return null;
  const time = meta.regularMarketTime;
  const quote = (result as { indicators?: { quote?: Array<{ close?: unknown }> } }).indicators?.quote?.[0];
  return {
    price,
    time: typeof time === "number" && Number.isFinite(time) ? time : Date.now() / 1000,
    closes: closesNearSpot(quote?.close, price),
  };
}

export function parseAztecaMoney(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 8 || n > 60) return null;
  return n;
}
