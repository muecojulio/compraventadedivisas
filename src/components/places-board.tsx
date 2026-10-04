import { useEffect, useMemo, useState } from "react";
import { Banknote, LocateFixed, MapPin, Navigation, Phone, Plane, Search } from "lucide-react";
import { Flag } from "@/components/flags";
import { SlippyMap } from "@/components/slippy-map";
import {
  GlowCard,
  LiquidSwitch,
  MotionButton,
  MotionChip,
  MotionDisclosure,
  MotionField,
  MotionLink,
  MotionNotice,
} from "@/components/motion-ui";
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

  const search = () => {
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
  };

  return (
    <section className="space-y-4">
      <p className="text-pretty text-muted">
        Casas de cambio y Banco Azteca a un máximo de 5 km del punto de partida. El círculo del mapa es ese radio.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <MotionField
          className="flex-1"
          label="Punto de partida"
          value={query}
          onValueChange={setQuery}
          placeholder="Dirección, colonia o ciudad"
          icon={<Search className="size-4" aria-hidden="true" />}
          onSubmit={search}
        />
        <div className="flex gap-2">
          <MotionButton tone="primary" size="lg" leading={<Search className="size-4" aria-hidden="true" />} busy={searching} onClick={search}>
            {searching ? "Buscando…" : "Fijar punto"}
          </MotionButton>
          <MotionButton
            tone="outline"
            size="lg"
            leading={<LocateFixed className="size-4" aria-hidden="true" />}
            busy={locating}
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
            {locating ? "Ubicando…" : "Mi ubicación"}
          </MotionButton>
        </div>
      </div>
      {hits.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Resultados de la búsqueda">
          {hits.map((hit, index) => (
            <MotionChip
              key={`${hit.lat}-${hit.lon}`}
              size="sm"
              tone="primary"
              selected={origin.label === hit.label}
              layoutId="geocode-hit-pill"
              leading={<MapPin className="size-3.5" aria-hidden="true" />}
              onClick={() => setOrigin({ lat: hit.lat, lon: hit.lon, label: hit.label })}
              enterDelay={index * 45}
            >
              {hit.label}
            </MotionChip>
          ))}
        </div>
      ) : null}
      {geoError ? (
        <MotionNotice tone="danger" title="No pude leer ese punto">
          {geoError}
        </MotionNotice>
      ) : null}
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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar aeropuertos por país">
        {(
          [
            ["MX", "México"],
            ["US", "Estados Unidos"],
            ["JP", "Japón"],
            ["CA", "Canadá"],
          ] as const
        ).map(([id, label]) => (
          <MotionChip
            key={id}
            tone="ink"
            selected={country === id}
            layoutId="airport-country-pill"
            leading={<Flag code={id} className="h-4 w-6 rounded-sm" />}
            onClick={() => {
              setCountry(id);
              setAirport(null);
            }}
          >
            {label}
          </MotionChip>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((item, index) => {
          const on = airport?.iata === item.iata;
          return (
            <MotionChip
              key={item.iata}
              block
              size="md"
              tone="primary"
              selected={on}
              layoutId="airport-card-pill"
              leading={<Plane className="size-5 shrink-0 text-primary" aria-hidden="true" />}
              onClick={() => setAirport(item)}
              enterDelay={index * 55}
            >
              <span className="block font-semibold">
                {item.iata} · {item.name}
              </span>
              <span className="block text-sm text-muted">{item.city}</span>
            </MotionChip>
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
          <span className="mui-pill h-11">
            Solo zona de aeropuerto
            <LiquidSwitch checked={onlyAirport} onChange={setOnlyAirport} label="Mostrar solo la zona del aeropuerto" />
          </span>
        ) : null}
      </div>
      <div className="flex gap-2" role="group" aria-label="Filtrar locales">
        {(
          [
            ["todas", "Todas"],
            ["casa", "Casas de cambio"],
            ["azteca", "Banco Azteca"],
          ] as const
        ).map(([id, label]) => (
          <MotionChip
            key={id}
            size="sm"
            tone="primary"
            selected={filter === id}
            layoutId="place-filter-pill"
            onClick={() => setFilter(id)}
          >
            {label}
          </MotionChip>
        ))}
      </div>
      <SlippyMap
        center={{ lat: origin.lat, lon: origin.lon }}
        places={places}
        selectedId={selected}
        onSelect={setSelected}
        radiusM={RADIUS_M}
        loading={loading}
      />
      {loading ? (
        <MotionNotice tone="info" title="Buscando en OpenStreetMap…" dismissible={false}>
          Los locales cercanos aparecen en cuanto llegan.
        </MotionNotice>
      ) : null}
      {error ? (
        <MotionNotice tone="danger" title="No pude cargar los locales">
          {error}
        </MotionNotice>
      ) : null}
      {!loading && !error && places.length === 0 ? (
        <MotionNotice tone="info" title="Sin locales en este radio" dismissible={false}>
          OpenStreetMap no lista todos los locales; prueba otro punto o desactiva el filtro de aeropuerto.
        </MotionNotice>
      ) : null}
      <ul className="space-y-2">
        {places.map((place, index) => (
          <li key={place.id}>
            <PlaceCard
              place={place}
              active={place.id === selected}
              onSelect={() => setSelected(place.id)}
              usdMid={usd?.mxn ?? null}
              board={rates?.azteca ?? null}
              airport={airport}
              index={index}
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
  index = 0,
}: {
  place: Place;
  active: boolean;
  onSelect: () => void;
  usdMid: number | null;
  board: RatesResponse["azteca"];
  airport: Airport | null;
  index?: number;
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
    <GlowCard
      className="p-4"
      active={active}
      tone={place.kind === "azteca" ? "accent" : "primary"}
      enterDelay={Math.min(index, 6) * 45}
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
        <MotionDisclosure
          className="mt-3"
          tone="accent"
          icon={<Banknote className="size-4" aria-hidden="true" />}
          title="Anota el tablero que viste"
          hint="Compáralo con Banco Azteca en el momento"
        >
          <p className="text-sm text-pretty text-muted">
            Esta casa no publica su tablero en una API abierta. Anota lo que veas en el local y compáralo con Banco Azteca.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <MotionField
              size="sm"
              label="Te compran el USD"
              value={seenBuy}
              onValueChange={setSeenBuy}
              inputMode="decimal"
              placeholder="16.90"
            />
            <MotionField
              size="sm"
              label="Te venden el USD"
              value={seenSell}
              onValueChange={setSeenSell}
              inputMode="decimal"
              placeholder="18.60"
            />
          </div>
          {azteca && Number.isFinite(buy) && buy > 0 ? (
            <p className="mt-2 text-sm">{buy >= azteca.compra ? "Te pagan igual o mejor que Azteca por tus dólares." : "Azteca te pagaría más por tus dólares."}</p>
          ) : null}
          {azteca && Number.isFinite(sell) && sell > 0 ? (
            <p className="mt-2 text-sm">{sell <= azteca.venta ? "Este local te vende el dólar igual o más barato que Azteca." : "Azteca vende el dólar más barato que este tablero."}</p>
          ) : null}
        </MotionDisclosure>
      ) : (
        <p className="mt-3 text-sm text-pretty text-muted">
          Precio de referencia nacional de ventanilla. Confírmalo en sucursal antes de operar.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <MotionLink href={maps} target="_blank" rel="noreferrer" tone="ink" size="md" leading={<Navigation className="size-4" aria-hidden="true" />}>
          Cómo llegar
        </MotionLink>
        {place.phone ? (
          <MotionLink href={`tel:${place.phone}`} size="md" leading={<Phone className="size-4" aria-hidden="true" />}>
            Llamar
          </MotionLink>
        ) : null}
        {place.website ? (
          <MotionLink href={place.website} target="_blank" rel="noreferrer" size="md">
            Sitio
          </MotionLink>
        ) : null}
      </div>
    </GlowCard>
  );
}
