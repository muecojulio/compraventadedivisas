import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Flag } from "@/components/flags";
import { formatChange, formatMxn, type RatesResponse } from "@/lib/domain";

const PICADO = ["#0e6b54", "#e2b15a", "#d4533a", "#fffaf2", "#1d4e89", "#bc002d", "#f4ead7", "#0e6b54"];

const SESSIONS = [
  { id: "MX", city: "Ciudad de México", tz: "America/Mexico_City", open: 9, close: 16 },
  { id: "US", city: "Nueva York", tz: "America/New_York", open: 8, close: 17 },
  { id: "JP", city: "Tokio", tz: "Asia/Tokyo", open: 9, close: 15 },
  { id: "CA", city: "Toronto", tz: "America/Toronto", open: 9, close: 17 },
] as const;

export function MarketAtmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="atmosphere__sarape" />
      <span className="atmosphere__orb atmosphere__orb--gold" />
      <span className="atmosphere__orb atmosphere__orb--emerald" />
      <span className="atmosphere__orb atmosphere__orb--coral" />
    </div>
  );
}

export function MarketShell({ children }: { children: ReactNode }) {
  return (
    <div className="market-shell">
      <MarketAtmosphere />
      <div className="market-foreground">{children}</div>
    </div>
  );
}

export function PapelPicado() {
  const flags = [...PICADO, ...PICADO, ...PICADO];
  return (
    <div className="picado" aria-hidden="true">
      {flags.map((color, index) => (
        <span
          key={`${color}-${index}`}
          style={{ "--picado": color, animationDelay: `${(index % 7) * 0.11}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function sessionNow(now: Date, tz: string, open: number, close: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const weekend = weekday === "Sat" || weekday === "Sun";
  const mins = hour * 60 + minute;
  const isOpen = !weekend && mins >= open * 60 && mins < close * 60;
  const clock = new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return { isOpen, clock };
}

export function SessionStrip() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="sessions" aria-label="Horarios de referencia">
      {SESSIONS.map((session) => {
        const state = now === null ? null : sessionNow(new Date(now), session.tz, session.open, session.close);
        return (
          <div key={session.id} className={"session" + (state?.isOpen ? " is-open" : "")}>
            <Flag code={session.id} className="h-4 w-6 rounded-sm" />
            <span>
              <strong>{session.city}</strong>
              <span className="session__meta">
                {state ? state.clock : "··:··"}
                {" · "}
                {state ? (state.isOpen ? "en horario" : "en pausa") : "horario de referencia"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TickerTape({ rates }: { rates: RatesResponse | null }) {
  const items =
    rates?.currencies.map((item) => {
      const hero = item.code === "JPY" ? item.mxn * 100 : item.mxn;
      return {
        code: item.code,
        label: item.code === "JPY" ? "100 JPY" : item.code,
        value: formatMxn(hero),
        change: item.dayChangePct,
      };
    }) ?? [];
  const loop = items.length > 0 ? [...items, ...items] : [];

  return (
    <div className="ticker" role="region" aria-label="Cinta de cotizaciones">
      {loop.length === 0 ? (
        <p className="ticker__wait">Afinando el oído del piso…</p>
      ) : (
        <div className="ticker__track">
          {loop.map((item, index) => (
            <span className="ticker__item" key={`${item.code}-${index}`} aria-hidden={index >= items.length}>
              <Flag code={item.code} className="ticker__flag" />
              <strong>{item.label}</strong>
              <span className="ticker__value">{item.value}</span>
              {item.change != null ? (
                <span className={item.change >= 0 ? "chg chg--up" : "chg chg--down"}>{formatChange(item.change)}</span>
              ) : (
                <span className="chg">hoy</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveFigure({
  value,
  text,
  className = "",
}: {
  value: number | null;
  text: string;
  className?: string;
}) {
  const prev = useRef<number | null>(null);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (prev.current != null && value != null && value !== prev.current) {
      setDir(value > prev.current ? "up" : "down");
    }
    prev.current = value;
  }, [value]);
  useEffect(() => {
    if (!dir) return;
    const timer = window.setTimeout(() => setDir(null), 900);
    return () => window.clearTimeout(timer);
  }, [dir]);

  return <span className={`live-figure ${dir ? `is-${dir}` : ""} ${className}`.trim()}>{text}</span>;
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const rawId = useId().replace(/:/g, "");
  if (values.length < 2) {
    return <p className="sparkline-empty">Sin trazo intradía todavía</p>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 160;
  const h = 46;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * w;
    const y = h - 4 - ((value - min) / span) * (h - 10);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const up = values[values.length - 1]! >= values[0]!;
  const stroke = up ? "#0e6b54" : "#b64028";
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={rawId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${rawId})`} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function SpreadBar({ compra, mid, venta }: { compra: number; mid: number; venta: number }) {
  const lo = Math.min(compra, mid, venta);
  const hi = Math.max(compra, mid, venta);
  const span = hi - lo || 1;
  const pos = (n: number) => ((n - lo) / span) * 100;
  return (
    <div className="spread" aria-hidden="true">
      <span className="spread__track" />
      <span
        className="spread__zone"
        style={{ left: `${pos(Math.min(compra, venta))}%`, width: `${Math.abs(pos(venta) - pos(compra))}%` }}
      />
      <span className="spread__mark spread__mark--buy" style={{ left: `${pos(compra)}%` }} />
      <span className="spread__mark spread__mark--mid" style={{ left: `${pos(mid)}%` }} />
      <span className="spread__mark spread__mark--sell" style={{ left: `${pos(venta)}%` }} />
    </div>
  );
}

export function FloorBanner({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="floor-banner">
      <p className="floor-banner__eye">{eyebrow}</p>
      <h2 className="floor-banner__title">{title}</h2>
      <div className="floor-banner__body">{children}</div>
    </div>
  );
}

export function FloorStats({ rates, refreshedLabel }: { rates: RatesResponse | null; refreshedLabel: string }) {
  const usd = rates?.currencies.find((item) => item.code === "USD");
  const mover = rates?.currencies.reduce<(typeof rates.currencies)[number] | null>((best, item) => {
    if (item.dayChangePct == null) return best;
    if (!best || best.dayChangePct == null || Math.abs(item.dayChangePct) > Math.abs(best.dayChangePct)) return item;
    return best;
  }, null);
  const spread =
    rates?.azteca && usd ? rates.azteca.usdVenta - rates.azteca.usdCompra : null;
  return (
    <div className="floor-stats">
      <article className="floor-stat">
        <p>Movimiento del día</p>
        <strong>{mover ? `${mover.code} ${formatChange(mover.dayChangePct ?? 0)}` : "esperando serie"}</strong>
        <span>{mover ? mover.name : "Llega con la primera lectura de Yahoo"}</span>
      </article>
      <article className="floor-stat floor-stat--gold">
        <p>Spread Azteca USD</p>
        <strong>{spread != null ? formatMxn(spread) : "sin ventanilla"}</strong>
        <span>{rates?.azteca ? "Venta menos compra, dólar publicado" : "La página pública no respondió"}</span>
      </article>
      <article className="floor-stat">
        <p>Última lectura</p>
        <strong>{refreshedLabel}</strong>
        <span>{rates?.marketSource ?? "Mercado en camino"}</span>
      </article>
    </div>
  );
}
