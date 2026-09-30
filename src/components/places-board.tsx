import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Plane, Search } from "lucide-react";
import { Flag } from "@/components/flags";
import { SlippyMap } from "@/components/slippy-map";
import {
  AIRPORTS,
  DEFAULT_ORIGIN,
  RADIUS_M,
  aztecaPair,
  formatDistance,
  formatMxn,
  type Airport,
  type GeoHit,
  type Place,
  type PlacesResponse,
  type RatesResponse,
} from "@/lib/domain";
import { haversineM } from "@/lib/geo";

type Origin = { lat: number; lon: number; label: string };
type Filter = "todas" | "casa" | "azteca";

export function NearbyPanel({ rates }: { rates: RatesResponse | null }) {
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  return (
    <section className="space-y-4">
      <p className="text-pretty text-muted">
        Casas de cambio y Banco Azteca a un máximo de 5 km del punto de partida. El círculo del mapa es ese radio.
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setSearching(true);
          setGeoError(null);
          void fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
            .then(async (res) => {
              const body = (await res.json()) as { hits?: GeoHit[]; error?: string };
              if (!res.ok) throw new Error(body.error || "Error");
              setHits(body.hits ?? []);
              const first = body.hits?.[0];
              if (first) setOrigin({ lat: first.lat, lon: first.lon, label: first.label });
              else setGeoError("No encontré ese lugar.");
            })
            .catch((error: unknown) => setGeoError(error instanceof Error ? error.message : "Error"))
            .finally(() => setSearching(false));
        }}
      >
        <label className="relative block flex-1">
          <span className="sr-only">Punto de partida</span>
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dirección, colonia o ciudad"
            className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-10 outline-none focus:border-primary"
          />
        </label>
        <button type="submit" className="press h-12 rounded-full bg-primary px-5 font-semibold text-on-primary" disabled={searching}>
          {searching ? "Buscando…" : "Fijar punto"}
        </button>
        <button
          type="button"
          className="press inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold"
          onClick={() => {
            if (!navigator.geolocation) {
              setGeoError("Este dispositivo no comparte ubicación.");
              return;
            }
            setLocating(true);
            setGeoError(null);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setOrigin({
                  lat: pos.coords.latitude,
                  lon: pos.coords.longitude,
                  label: "Mi ubicación",
                });
                setLocating(false);
              },
              () => {
                setGeoError("No se autorizó la ubicación. Puedes escribir un punto de partida.");
                setLocating(false);
              },
              { enableHighAccuracy: true, timeout: 10000 },
            );
          }}
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {locating ? "Ubicando…" : "Mi ubicación"}
        </button>
      </form>
      {hits.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {hits.map((hit) => (
            <button
              key={`${hit.lat}-${hit.lon}`}
              type="button"
              className="press h-10 rounded-full border border-line bg-surface px-3 text-sm"
              onClick={() => setOrigin({ lat: hit.lat, lon: hit.lon, label: hit.label })}
            >
              {hit.label}
            </button>
          ))}
        </div>
      ) : null}
      {geoError ? <p className="text-sm text-accent">{geoError}</p> : null}
      <PlaceResults origin={origin} rates={rates} airport={null} />
    </section>
  );
}

export function AirportPanel({ rates }: { rates: RatesResponse | null }) {
  const [country, setCountry] = useState<Airport["country"] | "ALL">("MX");
  const [airport, setAirport] = useState<Airport | null>(null);
  const list = AIRPORTS.filter((item) => country === "ALL" || item.country === country);
  return (
    <section className="space-y-4">
      <p className="text-pretty text-muted">
        Aeropuertos de México, Estados Unidos, Japón y Canadá. Al elegir uno se buscan casas de cambio y Banco Azteca a 5 km, sobre todo los de la zona de la terminal.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["MX", "México"],
            ["US", "Estados Unidos"],
            ["JP", "Japón"],
            ["CA", "Canadá"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setCountry(id);
              setAirport(null);
            }}
            className={
              "press inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold " +
              (country === id ? "bg-ink text-on-primary" : "border border-line bg-surface")
            }
          >
            <Flag code={id} className="h-4 w-6 rounded-sm" />
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((item) => {
          const on = airport?.iata === item.iata;
          return (
            <button
              key={item.iata}
              type="button"
              onClick={() => setAirport(item)}
              className={
                "press flex h-auto items-center gap-3 rounded-card border px-3 py-3 text-left " +
                (on ? "border-primary bg-primary-soft" : "border-line bg-surface")
              }
            >
              <Plane className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-semibold">
                  {item.iata} · {item.name}
                </span>
                <span className="block text-sm text-muted">{item.city}</span>
              </span>
            </button>
          );
        })}
      </div>
      {airport ? (
        <PlaceResults
          origin={{ lat: airport.lat, lon: airport.lon, label: `${airport.name} (${airport.iata})` }}
          rates={rates}
          airport={airport}
        />
      ) : null}
    </section>
  );
}

function PlaceResults({
  origin,
  rates,
  airport,
}: {
  origin: Origin;
  rates: RatesResponse | null;
  airport: Airport | null;
}) {
  const [data, setData] = useState<PlacesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todas");
  const [selected, setSelected] = useState<string | null>(null);
  const [onlyAirport, setOnlyAirport] = useState(Boolean(airport));

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/places?lat=${origin.lat}&lon=${origin.lon}`)
      .then(async (res) => {
        const body = (await res.json()) as PlacesResponse & { error?: string };
        if (!res.ok) throw new Error(body.error || "Error");
        if (!stop) {
          setData(body);
          setSelected(body.places[0]?.id ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!stop) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [origin.lat, origin.lon]);

  const places = useMemo(() => {
    const rows = data?.places ?? [];
    return rows.filter((place) => {
      if (filter !== "todas" && place.kind !== filter) return false;
      if (onlyAirport && airport) {
        const near = haversineM(airport.lat, airport.lon, place.lat, place.lon) <= 1500;
        const named = /aero|terminal|airport/i.test(`${place.name} ${place.address}`);
        return near || named;
      }
      return true;
    });
  }, [data, filter, onlyAirport, airport]);

  const usd = rates?.currencies.find((item) => item.code === "USD");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Punto: <span className="font-semibold text-ink">{origin.label}</span> · máximo 5 km
        </p>
        {airport ? (
          <button
            type="button"
            role="switch"
            aria-checked={onlyAirport}
            onClick={() => setOnlyAirport((value) => !value)}
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm"
          >
            Solo zona de aeropuerto
            <span className={"h-6 w-11 rounded-full " + (onlyAirport ? "bg-primary" : "bg-line")}>
              <span className={"mt-0.5 block h-5 w-5 rounded-full bg-surface transition-transform duration-200 " + (onlyAirport ? "translate-x-5" : "translate-x-0.5")} />
            </span>
          </button>
        ) : null}
      </div>
      <div className="flex gap-2">
        {(
          [
            ["todas", "Todas"],
            ["casa", "Casas de cambio"],
            ["azteca", "Banco Azteca"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={
              "press h-10 rounded-full px-3 text-sm " +
              (filter === id ? "bg-primary text-on-primary" : "border border-line bg-surface")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <SlippyMap
        center={{ lat: origin.lat, lon: origin.lon }}
        places={places}
        selectedId={selected}
        onSelect={setSelected}
        radiusM={RADIUS_M}
      />
      {loading ? <p className="text-sm text-muted">Buscando en OpenStreetMap…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {!loading && !error && places.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface px-4 py-6 text-sm text-pretty text-muted">
          No hay casas de cambio ni Banco Azteca mapeados en este radio. OpenStreetMap no lista todos los locales; prueba otro punto o desactiva el filtro de aeropuerto.
        </p>
      ) : null}
      <ul className="space-y-2">
        {places.map((place) => (
          <li key={place.id}>
            <PlaceCard
              place={place}
              active={place.id === selected}
              onSelect={() => setSelected(place.id)}
              usdMid={usd?.mxn ?? null}
              board={rates?.azteca ?? null}
              airport={airport}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceCard({
  place,
  active,
  onSelect,
  usdMid,
  board,
  airport,
}: {
  place: Place;
  active: boolean;
  onSelect: () => void;
  usdMid: number | null;
  board: RatesResponse["azteca"];
  airport: Airport | null;
}) {
  const [seenBuy, setSeenBuy] = useState("");
  const [seenSell, setSeenSell] = useState("");
  const nearAirport =
    airport != null &&
    (haversineM(airport.lat, airport.lon, place.lat, place.lon) <= 1500 ||
      /aero|terminal|airport/i.test(`${place.name} ${place.address}`));
  const azteca = usdMid ? aztecaPair("USD", usdMid, usdMid, board) : null;
  const buy = Number(seenBuy.replace(",", "."));
  const sell = Number(seenSell.replace(",", "."));
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;

  return (
    <article
      className={
        "rounded-card border bg-surface p-4 transition-colors duration-200 " +
        (active ? "border-primary" : "border-line")
      }
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start justify-between gap-3 text-left">
        <span>
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{place.name}</span>
            <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (place.kind === "azteca" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary")}>
              {place.kind === "azteca" ? "Banco Azteca" : "Casa de cambio"}
            </span>
            {nearAirport ? <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-on-primary">Zona aeropuerto</span> : null}
          </span>
          <span className="mt-1 block text-sm text-muted">
            {formatDistance(place.distanceM)}
            {place.address ? ` · ${place.address}` : ""}
          </span>
          {place.hours ? <span className="mt-1 block text-sm text-muted">{place.hours}</span> : null}
        </span>
      </button>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-2xl bg-paper px-3 py-2">
          Mercado USD <span className="font-semibold tabular-nums">{usdMid ? formatMxn(usdMid, 2) : "—"}</span>
        </p>
        <p className="rounded-2xl bg-paper px-3 py-2">
          Azteca compra/venta{" "}
          <span className="font-semibold tabular-nums">
            {azteca ? `${formatMxn(azteca.compra)} / ${formatMxn(azteca.venta)}` : "sin publicación"}
          </span>
        </p>
      </div>
      {place.kind === "casa" ? (
        <div className="mt-3">
          <p className="text-sm text-pretty text-muted">
            Esta casa no publica su tablero en una API abierta. Anota lo que veas en el local y compáralo con Banco Azteca.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              Te compran el USD
              <input value={seenBuy} onChange={(event) => setSeenBuy(event.target.value)} inputMode="decimal" className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink" placeholder="16.90" />
            </label>
            <label className="text-xs text-muted">
              Te venden el USD
              <input value={seenSell} onChange={(event) => setSeenSell(event.target.value)} inputMode="decimal" className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink" placeholder="18.60" />
            </label>
          </div>
          {azteca && Number.isFinite(buy) && buy > 0 ? (
            <p className="mt-2 text-sm">{buy >= azteca.compra ? "Te pagan igual o mejor que Azteca por tus dólares." : "Azteca te pagaría más por tus dólares."}</p>
          ) : null}
          {azteca && Number.isFinite(sell) && sell > 0 ? (
            <p className="text-sm">{sell <= azteca.venta ? "Este local te vende el dólar igual o más barato que Azteca." : "Azteca vende el dólar más barato que este tablero."}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-pretty text-muted">
          Precio de referencia nacional de ventanilla. Confírmalo en sucursal antes de operar.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={maps} target="_blank" rel="noreferrer" className="press inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-on-primary">
          Cómo llegar
        </a>
        {place.phone ? (
          <a href={`tel:${place.phone}`} className="press inline-flex h-11 items-center rounded-full border border-line px-4 text-sm">
            Llamar
          </a>
        ) : null}
        {place.website ? (
          <a href={place.website} target="_blank" rel="noreferrer" className="press inline-flex h-11 items-center rounded-full border border-line px-4 text-sm">
            Sitio
          </a>
        ) : null}
      </div>
    </article>
  );
}
