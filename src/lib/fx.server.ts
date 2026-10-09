import { CURRENCY_META, type AztecaBoard, type CurrencyCode, type RatesResponse } from "@/lib/domain";
import { dayChangePct, inRateBand, parseAztecaMoney, parseYahooChart } from "@/lib/fx-parse";
import { fetchAllowlisted } from "@/lib/security";

const UA = "CompraVentaDivisas/1.0 (cotizaciones en pesos; uso personal)";

type CacheEntry = { at: number; ttl: number; data: RatesResponse };
let cache: CacheEntry | null = null;
let inflight: Promise<RatesResponse> | null = null;

const FRESH_MS = 45_000;
const FALLBACK_MS = 3 * 60_000;
const JSON_CAP = 1_500_000;
const HTML_CAP = 800_000;

const YAHOO: Array<[CurrencyCode, string]> = [
  ["USD", "USDMXN=X"],
  ["JPY", "JPYMXN=X"],
  ["CAD", "CADMXN=X"],
];

type LiveQuote = { mxn: number; closes: number[] };

async function fetchJson(url: string): Promise<unknown> {
  const text = await fetchAllowlisted(url, {
    headers: { accept: "application/json", "user-agent": UA },
    maxBytes: JSON_CAP,
  });
  return JSON.parse(text) as unknown;
}

async function fromYahoo(): Promise<{ quotes: Partial<Record<CurrencyCode, LiveQuote>>; asOf: number }> {
  const rows = await Promise.all(
    YAHOO.map(async ([code, symbol]) => {
      try {
        const payload = await fetchJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`,
        );
        const parsed = parseYahooChart(payload);
        if (!parsed || !inRateBand(code, parsed.price)) return null;
        return [code, { mxn: parsed.price, closes: parsed.closes }, parsed.time] as const;
      } catch {
        return null;
      }
    }),
  );
  const quotes: Partial<Record<CurrencyCode, LiveQuote>> = {};
  let asOf = 0;
  for (const row of rows) {
    if (!row) continue;
    quotes[row[0]] = row[1];
    asOf = Math.max(asOf, row[2]);
  }
  return { quotes, asOf };
}

async function fromOpenEr(): Promise<Partial<Record<CurrencyCode, number>> | null> {
  try {
    const payload = (await fetchJson("https://open.er-api.com/v6/latest/MXN")) as {
      result?: string;
      rates?: Record<string, number>;
    };
    const rates = payload.rates;
    if (payload.result !== "success" || !rates) return null;
    const out: Partial<Record<CurrencyCode, number>> = {};
    for (const code of ["USD", "JPY", "CAD"] as const) {
      const perMxn = rates[code];
      if (typeof perMxn !== "number" || perMxn <= 0) return null;
      const mxn = 1 / perMxn;
      if (!inRateBand(code, mxn)) return null;
      out[code] = mxn;
    }
    return out;
  } catch {
    return null;
  }
}

async function fromCurrencyApi(): Promise<Partial<Record<CurrencyCode, number>> | null> {
  try {
    const payload = (await fetchJson(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/mxn.min.json",
    )) as { mxn?: Record<string, number> };
    const mxn = payload.mxn;
    if (!mxn) return null;
    const out: Partial<Record<CurrencyCode, number>> = {};
    for (const code of ["usd", "jpy", "cad"] as const) {
      const perMxn = mxn[code];
      if (typeof perMxn !== "number" || perMxn <= 0) return null;
      const upper = code.toUpperCase() as CurrencyCode;
      const value = 1 / perMxn;
      if (!inRateBand(upper, value)) return null;
      out[upper] = value;
    }
    return out;
  } catch {
    return null;
  }
}

async function fromAztecaPage(): Promise<AztecaBoard | null> {
  try {
    const html = await fetchAllowlisted("https://dolarenmexico.com/precio-dolar-banco-azteca", {
      headers: { accept: "text/html", "user-agent": UA },
      maxBytes: HTML_CAP,
    });
    const flat = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const compra =
      parseAztecaMoney(flat.match(/Compra:\s*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] ?? "") ??
      parseAztecaMoney(flat.match(/tipo de cambio de compra[^$]{0,40}\$\s*([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] ?? "");
    const venta =
      parseAztecaMoney(flat.match(/Venta:\s*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] ?? "") ??
      parseAztecaMoney(flat.match(/el de venta de\s*\$\s*([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] ?? "");
    if (compra == null || venta == null || !(venta > compra)) return null;
    const dated = flat.match(/\b(20[0-9]{2}-[0-9]{2}-[0-9]{2})\b/);
    return {
      usdCompra: compra,
      usdVenta: venta,
      asOf: dated?.[1] ?? null,
      source: "Ventanilla publicada de Banco Azteca, recopilada por Dólar en México",
      sourceUrl: "https://dolarenmexico.com/precio-dolar-banco-azteca",
    };
  } catch {
    return null;
  }
}

async function loadRates(): Promise<RatesResponse> {
  const yahoo = await fromYahoo();
  let backup: Partial<Record<CurrencyCode, number>> | null = null;
  const missing = (["USD", "JPY", "CAD"] as const).some((code) => yahoo.quotes[code] == null);
  if (missing) backup = (await fromOpenEr()) ?? (await fromCurrencyApi());

  const quotes = {} as Record<CurrencyCode, LiveQuote>;
  for (const code of ["USD", "JPY", "CAD"] as const) {
    const live = yahoo.quotes[code];
    const alt = backup?.[code];
    if (live) {
      quotes[code] = live;
      continue;
    }
    if (alt == null) throw new Error("sin cotización");
    quotes[code] = { mxn: alt, closes: [] };
  }

  const usedYahoo = (["USD", "JPY", "CAD"] as const).every((code) => yahoo.quotes[code] != null);
  const marketSource = usedYahoo
    ? "Yahoo Finance (USDMXN, JPYMXN, CADMXN)"
    : backup && Object.keys(yahoo.quotes).length > 0
      ? "Yahoo Finance y respaldo ExchangeRate-API"
      : backup
        ? "ExchangeRate-API abierta o currency-api, sin registro"
        : "Yahoo Finance";
  const marketAsOf =
    usedYahoo || yahoo.asOf > 0
      ? new Date((yahoo.asOf || Date.now() / 1000) * 1000).toISOString()
      : new Date().toISOString();

  const azteca = await fromAztecaPage();
  const currencies = (["USD", "JPY", "CAD"] as const).map((code) => ({
    code,
    name: CURRENCY_META[code].name,
    country: CURRENCY_META[code].country,
    mxn: quotes[code].mxn,
    dayCloses: quotes[code].closes,
    dayChangePct: dayChangePct(quotes[code].closes),
  }));

  return {
    fetchedAt: new Date().toISOString(),
    marketAsOf,
    marketSource,
    currencies,
    azteca,
    aztecaNote: azteca
      ? "El dólar de Banco Azteca es la cifra publicada de ventanilla. Yen y dólar canadiense usan el mismo margen porcentual de ese dólar sobre el mercado, porque el banco no publica esas dos divisas en la misma página. La sucursal puede cobrar distinto."
      : "No se pudo leer la ventanilla pública de Banco Azteca en este momento. Se muestra solo la referencia de mercado.",
  };
}

export async function getRates(): Promise<RatesResponse> {
  const now = Date.now();
  if (cache && now - cache.at < cache.ttl) return cache.data;
  if (!inflight) {
    inflight = loadRates()
      .then((data) => {
        cache = {
          at: Date.now(),
          ttl: data.marketSource.startsWith("Yahoo Finance (") ? FRESH_MS : FALLBACK_MS,
          data,
        };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
