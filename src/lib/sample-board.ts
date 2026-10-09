import { CURRENCY_META, type CurrencyCode, type RatesResponse } from "@/lib/domain";
import { dayChangePct } from "@/lib/fx-parse";

function wave(spot: number, points = 24): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wobble = Math.sin(index / 3.1) * spot * 0.004 + Math.cos(index / 5.4) * spot * 0.002;
    return Number((spot * (1 - 0.003) + wobble + (index / points) * spot * 0.003).toFixed(6));
  });
}

const SPOTS: Record<CurrencyCode, number> = {
  USD: 18.15,
  JPY: 0.121,
  CAD: 13.35,
};

/**
 * Solo para cuando ninguna fuente responde. No es una cotización operable.
 * Las cifras son ilustrativas, cercanas al orden de magnitud de octubre de 2026.
 */
export const SAMPLE_RATES: RatesResponse = {
  fetchedAt: "2026-10-09T12:00:00.000Z",
  marketAsOf: "2026-10-09T12:00:00.000Z",
  marketSource: "Referencia de muestra del 9 de octubre de 2026. No es el mercado en vivo.",
  azteca: null,
  aztecaNote:
    "En la muestra no hay ventanilla de Banco Azteca. Cuando el mercado responde, aquí aparece la cifra publicada.",
  currencies: (["USD", "JPY", "CAD"] as const).map((code) => {
    const closes = wave(SPOTS[code]);
    return {
      code,
      name: CURRENCY_META[code].name,
      country: CURRENCY_META[code].country,
      mxn: SPOTS[code],
      dayCloses: closes,
      dayChangePct: dayChangePct(closes),
    };
  }),
};
