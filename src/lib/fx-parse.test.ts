import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayChangePct, downsample, inRateBand, parseAztecaMoney, parseYahooChart } from "./fx-parse.ts";

describe("parseYahooChart", () => {
  it("toma el precio y recorta la serie", () => {
    const parsed = parseYahooChart({
      chart: {
        result: [
          {
            meta: { regularMarketPrice: 18.2, regularMarketTime: 1_700_000_000 },
            indicators: { quote: [{ close: [18.1, null, 18.4, 90, 18.3] }] },
          },
        ],
      },
    });
    assert.equal(parsed?.price, 18.2);
    assert.deepEqual(parsed?.closes, [18.1, 18.4, 18.3]);
  });

  it("rechaza un precio imposible y un payload vacío", () => {
    assert.equal(parseYahooChart({ chart: { result: [{ meta: { regularMarketPrice: 5000 } }] } }), null);
    assert.equal(parseYahooChart(null), null);
    assert.equal(parseYahooChart({ chart: {} }), null);
  });
});

describe("bandas y variación", () => {
  it("acota el dólar y el yen", () => {
    assert.equal(inRateBand("USD", 18.11), true);
    assert.equal(inRateBand("USD", 0.2), false);
    assert.equal(inRateBand("JPY", 0.12), true);
    assert.equal(inRateBand("JPY", 18), false);
  });

  it("no publica una variación absurda", () => {
    assert.equal(dayChangePct([18, 18.2]), 1.11);
    assert.equal(dayChangePct([18, 40]), null);
    assert.deepEqual(downsample([1, 2, 3, 4], 2), [1, 4]);
    assert.equal(parseAztecaMoney("18.94"), 18.94);
    assert.equal(parseAztecaMoney("1"), null);
  });
});
