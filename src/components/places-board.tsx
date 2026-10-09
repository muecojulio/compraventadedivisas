import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue } from "motion/react";
import {
  Banknote,
  ChevronLeft,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Search,
} from "lucide-react";
import { Flag } from "@/components/flags";
import { FloorBanner } from "@/components/market-live";
import { SafeSiteLink, SafeTelLink } from "@/components/safe-link";
import { SlippyMap } from "@/components/slippy-map";
import {
  GlowCard,
  LiquidSwitch,
  MotionButton,
  MotionChip,
  MotionCombobox,
  MotionDisclosure,
  MotionField,
  MotionLink,
  MotionNotice,
  MotionRail,
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
import { mapsDirectionsUrl } from "@/lib/security";
import { SOFT_SPRING } from "@/components/motion-ui/springs";
import { useSpringTransition } from "@/components/motion-ui/use-spring";

type Origin = { lat: number; lon: number; label: string };
type Filter = "todas" | "casa" | "azteca";

export function NearbyPanel({ rates }: { rates: RatesResponse | null }) {
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<"success" | "error" | null>(null);
  const [locationFeedback, setLocationFeedback] = useState<"success" | "error" | null>(null);

  const search = () => {
    setSearching(true);
    setSearchFeedback(null);
    setGeoError(null);
    void fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        const body = (await res.json()) as { hits?: GeoHit[]; error?: string };
        if (!res.ok) throw new Error(body.error || "Error");
        setHits(body.hits ?? []);
        const first = body.hits?.[0];
        if (first) {
          setOrigin({ lat: first.lat, lon: first.lon, label: first.label });
          setSearchFeedback("success");
        } else {
          setGeoError("No encontré ese lugar.");
          setSearchFeedback("error");
        }
      })
      .catch((error: unknown) => {
        setGeoError(error instanceof Error ? error.message : "Error");
        setSearchFeedback("error");
      })
      .finally(() => setSearching(false));
  };

  return (
    <section className="space-y-4">
      <FloorBanner eyebrow="A 5 km" title="Casas y Azteca cerca de ti">
        El círculo del mapa es el radio. La ubicación solo se pide si tocas Mi ubicación.
      </FloorBanner>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <MotionField
          className="flex-1"
          label="Punto de partida"
          value={query}
          onValueChange={(nextValue) => {
            setQuery(nextValue);
            setSearchFeedback(null);
          }}
          placeholder="Dirección, colonia o ciudad"
          icon={<Search className="size-4" aria-hidden="true" />}
          onSubmit={search}
        />
        <div className="flex gap-2">
          <MotionButton
            tone="primary"
            size="lg"
            leading={<Search className="size-4" aria-hidden="true" />}
            busy={searching}
            feedback={searchFeedback}
            feedbackLabel={
              searchFeedback === "success"
                ? "Punto de partida encontrado."
                : "No se encontró el punto de partida."
            }
            onClick={search}
          >
            {searching
              ? "Buscando…"
              : searchFeedback === "success"
                ? "Punto fijado"
                : "Fijar punto"}
          </MotionButton>
          <MotionButton
            tone="outline"
            size="lg"
            leading={<LocateFixed className="size-4" aria-hidden="true" />}
            busy={locating}
            feedback={locationFeedback}
            feedbackLabel={
              locationFeedback === "success"
                ? "Ubicación detectada."
                : "No se pudo detectar la ubicación."
            }
            onClick={() => {
              setLocationFeedback(null);
              if (!navigator.geolocation) {
                setGeoError("Este dispositivo no comparte ubicación.");
                setLocationFeedback("error");
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
                  setLocationFeedback("success");
                  setLocating(false);
                },
                () => {
                  setGeoError("No se autorizó la ubicación. Puedes escribir un punto de partida.");
                  setLocationFeedback("error");
                  setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000 },
              );
            }}
          >
            {locating
              ? "Ubicando…"
              : locationFeedback === "success"
                ? "Ubicación lista"
                : "Mi ubicación"}
          </MotionButton>
        </div>
      </div>
      {hits.length > 1 ? (
        <MotionRail
          activeKey={origin.label}
          ariaLabel="Resultados de la búsqueda"
          className="mui-chip-rail"
          hint="Más"
        >
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
        </MotionRail>
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
  const countryOptions = [
    ["MX", "México"],
    ["US", "Estados Unidos"],
    ["JP", "Japón"],
    ["CA", "Canadá"],
  ] as const;
  const airportOptions = list.map((item) => ({
    value: item.iata,
    label: `${item.iata} · ${item.name}`,
    description: item.city,
    leading: <Flag code={item.country} className="h-4 w-6 rounded-sm" />,
  }));
  const chooseAirport = (iata: string) => {
    const match = list.find((item) => item.iata === iata);
    if (match) setAirport(match);
  };

  return (
    <section className="space-y-4">
      <FloorBanner eyebrow="Terminales" title="Dónde cambiar al llegar">
        México, Estados Unidos, Japón y Canadá. Al elegir un aeropuerto se buscan locales a 5 km, sobre todo
        en la zona de la terminal.
      </FloorBanner>
      <MotionRail
        activeKey={country}
        ariaLabel="Filtrar aeropuertos por país"
        className="mui-chip-rail"
        hint="Países"
      >
        {countryOptions.map(([id, label]) => (
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
      </MotionRail>

      <MotionCombobox
        className="max-w-xl"
        label="Buscar aeropuerto"
        value={airport?.iata ?? null}
        options={airportOptions}
        onValueChange={chooseAirport}
        placeholder="Nombre, ciudad o clave IATA"
        emptyMessage="No hay aeropuertos en este país con ese nombre."
      />

      <MotionRail
        activeKey={airport?.iata}
        ariaLabel="Aeropuertos disponibles"
        className="mui-airport-rail"
        hint="Aeropuertos"
      >
        {list.map((item, index) => (
          <MotionChip
            key={item.iata}
            block
            size="md"
            tone="primary"
            selected={airport?.iata === item.iata}
            className="mui-airport-card"
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
        ))}
      </MotionRail>

      {airport ? (
        <PlaceResults
          origin={{
            lat: airport.lat,
            lon: airport.lon,
            label: `${airport.name} (${airport.iata})`,
          }}
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
            <LiquidSwitch
              checked={onlyAirport}
              onChange={setOnlyAirport}
              label="Mostrar solo la zona del aeropuerto"
            />
          </span>
        ) : null}
      </div>
      <MotionRail
        activeKey={filter}
        ariaLabel="Filtrar locales"
        className="mui-chip-rail"
        hint="Filtros"
      >
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
      </MotionRail>
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
          OpenStreetMap no lista todos los locales; prueba otro punto o desactiva el filtro de
          aeropuerto.
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

type SwipeRevealControls = {
  open: boolean;
  toggle: () => void;
  actionsId: string;
};

type SwipeDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  baseX: number;
  axis: "x" | "y" | null;
  moved: boolean;
};

function SwipeRevealCard({
  children,
  actions,
  actionWidth = 188,
}: {
  children: (controls: SwipeRevealControls) => ReactNode;
  actions: ReactNode;
  actionWidth?: number;
}) {
  const actionsId = useId();
  const x = useMotionValue(0);
  const drag = useRef<SwipeDrag | null>(null);
  const suppressClick = useRef(false);
  const [open, setOpen] = useState(false);
  const spring = useSpringTransition(SOFT_SPRING);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const resetOnDesktop = () => {
      if (!desktop.matches) return;
      drag.current = null;
      setOpen(false);
      x.set(0);
    };
    resetOnDesktop();
    desktop.addEventListener("change", resetOnDesktop);
    return () => desktop.removeEventListener("change", resetOnDesktop);
  }, [x]);

  function settle(nextOpen: boolean) {
    setOpen(nextOpen);
    void animate(x, nextOpen ? -actionWidth : 0, spring);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType === "mouse" ||
      event.button !== 0 ||
      window.matchMedia("(min-width: 768px)").matches
    ) {
      return;
    }
    const target = event.target as Element;
    if (
      target.closest(
        "a, input, textarea, select, [role='switch'], .place-swipe-toggle, .mui-disclosure__trigger, button:not(.place-card__select)",
      )
    ) {
      return;
    }
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      baseX: open ? -actionWidth : 0,
      axis: null,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (current.axis === null && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) {
      current.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? "x" : "y";
      if (current.axis === "x") {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // The pointer can be canceled by the browser while it hands off a vertical pan.
        }
      }
    }
    if (current.axis !== "x") return;

    event.preventDefault();
    current.moved = current.moved || Math.abs(deltaX) > 16;
    x.set(Math.max(-actionWidth, Math.min(0, current.baseX + deltaX)));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.axis === "x") {
      const deltaX = event.clientX - current.startX;
      const duration = Math.max(1, performance.now() - current.startedAt);
      const velocity = deltaX / duration;
      const nextOpen = x.get() < -actionWidth * 0.43 || velocity < -0.55;
      if (current.moved) {
        suppressClick.current = true;
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }
      settle(nextOpen);
    }
    drag.current = null;
  }

  function handlePointerCancel() {
    drag.current = null;
    settle(open);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  }

  return (
    <div className="place-swipe-shell" data-card-swipe="">
      <div id={actionsId} className="place-swipe-actions" aria-hidden={!open} inert={!open}>
        <span className="place-swipe-actions__label">Acciones rápidas</span>
        {actions}
      </div>
      <motion.div
        className="place-swipe-front"
        style={{ x }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) settle(false);
        }}
      >
        {children({ open, toggle: () => settle(!open), actionsId })}
      </motion.div>
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
  const maps = mapsDirectionsUrl(place.lat, place.lon);

  return (
    <SwipeRevealCard
      actions={
        <>
          {maps ? (
            <MotionLink
              className="place-swipe-action"
              href={maps}
              target="_blank"
              rel="noopener noreferrer"
              tone="ink"
              size="sm"
              leading={<Navigation className="size-4" aria-hidden="true" />}
              aria-label={`Cómo llegar a ${place.name}`}
            >
              Cómo llegar
            </MotionLink>
          ) : null}
          <SafeTelLink
            className="place-swipe-action"
            phone={place.phone}
            size="sm"
            leading={<Phone className="size-4" aria-hidden="true" />}
            label={`Llamar a ${place.name}`}
          >
            Llamar
          </SafeTelLink>
          <SafeSiteLink
            className="place-swipe-action"
            href={place.website}
            size="sm"
            label={`Abrir sitio de ${place.name}`}
          >
            Sitio
          </SafeSiteLink>
        </>
      }
    >
      {({ open, toggle, actionsId }) => (
        <GlowCard
          className="place-card-surface p-4"
          active={active}
          tone={place.kind === "azteca" ? "accent" : "primary"}
          enterDelay={Math.min(index, 6) * 45}
        >
          <button
            type="button"
            onClick={onSelect}
            className="place-card__select flex w-full items-start justify-between gap-3 text-left"
            aria-pressed={active}
          >
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{place.name}</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (place.kind === "azteca"
                      ? "bg-accent-soft text-accent"
                      : "bg-primary-soft text-primary")
                  }
                >
                  {place.kind === "azteca" ? "Banco Azteca" : "Casa de cambio"}
                </span>
                {nearAirport ? (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-on-primary">
                    Zona aeropuerto
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {formatDistance(place.distanceM)}
                {place.address ? ` · ${place.address}` : ""}
              </span>
              {place.hours ? (
                <span className="mt-1 block text-sm text-muted">{place.hours}</span>
              ) : null}
            </span>
          </button>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-2xl bg-paper px-3 py-2">
              Mercado USD{" "}
              <span className="font-semibold tabular-nums">
                {usdMid ? formatMxn(usdMid, 2) : "—"}
              </span>
            </p>
            <p className="rounded-2xl bg-paper px-3 py-2">
              Azteca compra/venta{" "}
              <span className="font-semibold tabular-nums">
                {azteca
                  ? `${formatMxn(azteca.compra)} / ${formatMxn(azteca.venta)}`
                  : "sin publicación"}
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
                Esta casa no publica su tablero en una API abierta. Anota lo que veas en el local y
                compáralo con Banco Azteca.
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
                <p className="mt-2 text-sm">
                  {buy >= azteca.compra
                    ? "Te pagan igual o mejor que Azteca por tus dólares."
                    : "Azteca te pagaría más por tus dólares."}
                </p>
              ) : null}
              {azteca && Number.isFinite(sell) && sell > 0 ? (
                <p className="mt-2 text-sm">
                  {sell <= azteca.venta
                    ? "Este local te vende el dólar igual o más barato que Azteca."
                    : "Azteca vende el dólar más barato que este tablero."}
                </p>
              ) : null}
            </MotionDisclosure>
          ) : (
            <p className="mt-3 text-sm text-pretty text-muted">
              Precio de referencia nacional de ventanilla. Confírmalo en sucursal antes de operar.
            </p>
          )}

          <button
            type="button"
            className="place-swipe-toggle"
            aria-expanded={open}
            aria-controls={actionsId}
            onClick={toggle}
          >
            <ChevronLeft className={open ? "is-open" : ""} size={16} aria-hidden="true" />
            {open ? "Ocultar acciones" : "Desliza o toca para acciones"}
          </button>

          <div className="place-card__desktop-actions mt-3 flex flex-wrap gap-2">
            {maps ? (
              <MotionLink
                href={maps}
                target="_blank"
                rel="noopener noreferrer"
                tone="ink"
                size="md"
                leading={<Navigation className="size-4" aria-hidden="true" />}
              >
                Cómo llegar
              </MotionLink>
            ) : null}
            <SafeTelLink
              phone={place.phone}
              size="md"
              leading={<Phone className="size-4" aria-hidden="true" />}
              label={`Llamar a ${place.name}`}
            >
              Llamar
            </SafeTelLink>
            <SafeSiteLink href={place.website} size="md" label={`Abrir sitio de ${place.name}`}>
              Sitio
            </SafeSiteLink>
          </div>
        </GlowCard>
      )}
    </SwipeRevealCard>
  );
}
