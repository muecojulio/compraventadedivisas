import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BusyError,
  KeyedLimiter,
  LruTtlCache,
  RequestPacer,
  TokenBucket,
  assertAllowlistedUrl,
  clientAddress,
  isCrossSiteRequest,
  mapsDirectionsUrl,
  safeHttpUrl,
  safeTelHref,
  sanitizeDisplayText,
  sanitizePhone,
  sanitizeSearchQuery,
} from "./security.ts";

describe("safeHttpUrl", () => {
  it("acepta https público y devuelve el href analizado", () => {
    assert.equal(safeHttpUrl("https://ejemplo.mx/casa"), "https://ejemplo.mx/casa");
  });

  it("rechaza javascript, data y credenciales", () => {
    assert.equal(safeHttpUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpUrl("data:text/html,hi"), null);
    assert.equal(safeHttpUrl("https://user:pass@ejemplo.mx/"), null);
  });

  it("rechaza loopback, metadata y redes privadas", () => {
    assert.equal(safeHttpUrl("http://127.0.0.1/"), null);
    assert.equal(safeHttpUrl("http://169.254.169.254/latest"), null);
    assert.equal(safeHttpUrl("http://10.1.1.1/"), null);
    assert.equal(safeHttpUrl("http://192.168.0.8/"), null);
    assert.equal(safeHttpUrl("http://localhost/admin"), null);
  });
});

describe("teléfono y texto", () => {
  it("limpia un teléfono y arma tel:", () => {
    assert.equal(sanitizePhone("+52 55 1234 5678"), "+52 55 1234 5678");
    assert.equal(safeTelHref("javascript:alert(1)"), null);
    assert.equal(safeTelHref("+52 55 1234 5678"), "tel:+525512345678");
  });

  it("quita marcas bidireccionales y controles", () => {
    assert.equal(sanitizeDisplayText("Casa\u202Eevil\u0000"), "Casa evil");
    assert.equal(sanitizeSearchQuery("  Roma Norte!!!  "), "Roma Norte");
  });
});

describe("mapas y origen", () => {
  it("solo arma un destino numérico", () => {
    assert.equal(
      mapsDirectionsUrl(19.4, -99.1),
      "https://www.google.com/maps/dir/?api=1&destination=19.400000%2C-99.100000",
    );
    assert.equal(mapsDirectionsUrl(Number.NaN, 0), null);
    assert.equal(mapsDirectionsUrl(120, 0), null);
  });

  it("detecta cross-site y no confía en un XFF basura", () => {
    const cross = new Request("https://app.example/api/geocode", {
      headers: { "sec-fetch-site": "cross-site" },
    });
    assert.equal(isCrossSiteRequest(cross), true);
    assert.equal(isCrossSiteRequest(new Request("https://app.example/api/rates")), false);
    assert.equal(
      clientAddress(new Request("https://app.example/", { headers: { "x-forwarded-for": "not an ip, 203.0.113.8" } })),
      "anon",
    );
    assert.equal(
      clientAddress(new Request("https://app.example/", { headers: { "x-real-ip": "203.0.113.8" } })),
      "203.0.113.8",
    );
  });
});

describe("límites y caché", () => {
  it("agota el cubo y no deja crecer la caché", () => {
    const bucket = new TokenBucket(2, 1, 1_000);
    assert.equal(bucket.allow(1, 1_000), true);
    assert.equal(bucket.allow(1, 1_000), true);
    assert.equal(bucket.allow(1, 1_000), false);
    assert.equal(bucket.allow(1, 2_000), true);

    const cache = new LruTtlCache<string>(2, 1_000);
    cache.set("a", "1", 0);
    cache.set("b", "2", 0);
    cache.set("c", "3", 0);
    assert.equal(cache.get("a", 10), null);
    assert.equal(cache.get("c", 10), "3");
    assert.equal(cache.size, 2);
  });

  it("el límite por clave no crece sin tope", () => {
    const limiter = new KeyedLimiter(1, 0, 2);
    assert.equal(limiter.allow("uno", 0), true);
    assert.equal(limiter.allow("uno", 0), false);
    assert.equal(limiter.allow("dos", 0), true);
    assert.equal(limiter.allow("tres", 0), true);
  });

  it("la cola de upstream rechaza cuando está llena", async () => {
    const pacer = new RequestPacer(50, 1);
    const first = pacer.run(async () => "ok");
    await assert.rejects(pacer.run(async () => "no"), BusyError);
    assert.equal(await first, "ok");
  });
});

describe("lista de sitios del servidor", () => {
  it("solo deja pasar anfitriones conocidos por https", () => {
    assert.equal(
      assertAllowlistedUrl("https://query1.finance.yahoo.com/v8/finance/chart/USDMXN=X"),
      "https://query1.finance.yahoo.com/v8/finance/chart/USDMXN=X",
    );
    assert.equal(assertAllowlistedUrl("http://query1.finance.yahoo.com/v8"), null);
    assert.equal(assertAllowlistedUrl("https://evil.example/query1.finance.yahoo.com"), null);
    assert.equal(assertAllowlistedUrl("https://user@nominatim.openstreetmap.org/search"), null);
    assert.equal(assertAllowlistedUrl("https://169.254.169.254/"), null);
  });
});
