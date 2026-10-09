import { ArrowLeftRight, Calculator, RefreshCw, Shield } from "lucide-react";
import { Flag } from "@/components/flags";
import { FloorBanner, FloorStats, LiveFigure, Sparkline, SpreadBar } from "@/components/market-live";
import {
  GlowCard,
  LiquidSwitch,
  LiveDot,
  MotionBar,
  MotionButton,
  MotionChip,
  MotionDisclosure,
  MotionField,
  MotionRail,
} from "@/components/motion-ui";
import {
  CURRENCY_META,
  aztecaPair,
  formatChange,
  formatMxn,
  type CurrencyCode,
  type RatesResponse,
} from "@/lib/domain";
import { safeHttpUrl } from "@/lib/security";

const CURRENCY_CODES: Array<CurrencyCode> = ["USD", "JPY", "CAD"];
const AMOUNTS = ["50", "100", "500", "1000", "5000"];

export function QuotePanel(props: {
  rates: RatesResponse | null;
  demo?: boolean;
  error: string | null;
  loading: boolean;
  refreshFeedback: "success" | "error" | null;
  auto: boolean;
  onAuto: (value: boolean) => void;
  progress: number | null;
  refreshedAt: number | null;
  code: CurrencyCode;
  onCode: (code: CurrencyCode) => void;
  amount: string;
  onAmount: (value: string) => void;
  toMxn: boolean;
  onToMxn: (value: boolean) => void;
  onRetry: () => void;
}) {
  const usd = props.rates?.currencies.find((item) => item.code === "USD");
  const selected = props.rates?.currencies.find((item) => item.code === props.code);
  const pair =
    selected && usd ? aztecaPair(selected.code, selected.mxn, usd.mxn, props.rates?.azteca ?? null) : null;
  const numeric = Number(props.amount.replace(",", "."));
  const valid = Number.isFinite(numeric) && numeric >= 0 && numeric < 1_000_000_000;
  const result = !selected || !valid ? null : props.toMxn ? numeric * selected.mxn : numeric / selected.mxn;
  const source = safeHttpUrl(props.rates?.azteca?.sourceUrl);
  const refreshedLabel =
    props.refreshedAt === null
      ? props.loading
        ? "consultando"
        : "sin lectura"
      : new Date(props.refreshedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const rows =
    props.rates?.currencies ??
    CURRENCY_CODES.map((code) => ({
      code,
      name: CURRENCY_META[code].name,
      country: CURRENCY_META[code].country,
      mxn: 0,
      dayCloses: [] as number[],
      dayChangePct: null,
    }));

  return (
    <section className="space-y-4">
      <FloorBanner eyebrow="Tablero" title="Lo que se mueve ahora">
        El mercado se refresca solo. Banco Azteca muestra la ventanilla publicada, y el trazo es el día en curso.
      </FloorBanner>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mui-pill h-11">
          <RefreshCw className="size-4 text-primary" aria-hidden="true" />
          En vivo
          <LiquidSwitch checked={props.auto} onChange={props.onAuto} label="Actualización en vivo cada minuto" />
        </span>
        <MotionButton
          tone="outline"
          size="md"
          leading={<RefreshCw className="size-4" aria-hidden="true" />}
          busy={props.loading}
          feedback={props.refreshFeedback}
          feedbackLabel={
            props.refreshFeedback === "success"
              ? "Cotizaciones actualizadas."
              : "No se pudieron actualizar las cotizaciones."
          }
          onClick={props.onRetry}
        >
          {props.refreshFeedback === "success" ? "Actualizado" : props.refreshFeedback === "error" ? "Reintentar" : "Actualizar"}
        </MotionButton>
      </div>

      <div className="floor-meter">
        <MotionBar
          value={props.auto ? props.progress : 0}
          busy={props.loading}
          label="Ciclo de refresco del tipo de cambio"
          tone={props.error ? "accent" : "primary"}
          hint={
            <span>
              <LiveDot on={props.auto && !props.loading && !props.demo} />
              {props.auto ? `Siguiente lectura cerca de ${refreshedLabel}` : `Refresco en pausa · ${refreshedLabel}`}
            </span>
          }
        />
      </div>

      <FloorStats rates={props.rates} refreshedLabel={props.demo ? "muestra" : refreshedLabel} />

      {props.error && !props.demo ? (
        <p className="rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">{props.error}</p>
      ) : null}

      <MotionRail activeKey={props.code} ariaLabel="Cotizaciones por divisa" className="mui-quote-rail" frameClassName="mui-quote-rail-frame">
        {rows.map((item, index) => (
          <QuoteCard
            key={item.code}
            item={item}
            index={index}
            selected={item.code === props.code}
            usdMid={usd?.mxn ?? null}
            azteca={props.rates?.azteca ?? null}
            loading={props.loading || !props.rates}
            sweepKey={props.refreshedAt ? Math.round(props.refreshedAt / 1000) : 0}
            onSelect={() => props.onCode(item.code)}
          />
        ))}
      </MotionRail>

      <section className="ventanilla">
        <div>
          <p className="floor-banner__eye">Ventanilla</p>
          <h2 className="font-display text-3xl text-balance">¿Cuánto te queda?</h2>
          <MotionRail activeKey={props.code} ariaLabel="Elegir divisa" className="mui-currency-rail" frameClassName="mui-currency-rail-frame mt-3 mb-3">
            {CURRENCY_CODES.map((item) => (
              <MotionChip
                key={item}
                selected={props.code === item}
                layoutId="currency-chip-pill"
                tone="ink"
                size="md"
                leading={<Flag code={item} className="h-4 w-6 rounded-sm" />}
                onClick={() => props.onCode(item)}
              >
                {item}
              </MotionChip>
            ))}
          </MotionRail>
          <MotionRail activeKey={props.amount} ariaLabel="Montos rápidos" className="mui-chip-rail" hint="Montos">
            {AMOUNTS.map((item) => (
              <MotionChip key={item} size="sm" tone="primary" selected={props.amount === item} layoutId="amount-chip-pill" onClick={() => props.onAmount(item)}>
                {item}
              </MotionChip>
            ))}
          </MotionRail>
          <div className="mt-3 grid items-end gap-3">
            <MotionField
              label={props.toMxn ? `Cantidad en ${props.code}` : "Cantidad en MXN"}
              value={props.amount}
              onValueChange={(next) => props.onAmount(next.replace(/[^\d.,]/g, "").slice(0, 12))}
              inputMode="decimal"
              icon={<Calculator className="size-4" aria-hidden="true" />}
              placeholder="0.00"
            />
            <MotionButton tone="outline" size="lg" leading={<ArrowLeftRight className="size-4" aria-hidden="true" />} onClick={() => props.onToMxn(!props.toMxn)}>
              {props.toMxn ? "Ver divisa" : "Ver pesos"}
            </MotionButton>
          </div>
        </div>
        <div className="ventanilla__result">
          <p className="floor-banner__eye">{props.toMxn ? "En pesos" : `En ${props.code}`}</p>
          <p className="ventanilla__figure">
            <LiveFigure
              value={result}
              text={
                result == null
                  ? "—"
                  : props.toMxn
                    ? formatMxn(result)
                    : `${result.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${props.code}`
              }
            />
          </p>
          <p className="text-sm text-muted">Con el tipo de mercado, no con el de ventanilla.</p>
          <div className="coin-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        {pair && valid ? (
          <p className="ventanilla__note">
            Banco Azteca, misma operación:{" "}
            {props.toMxn ? (
              <>
                te entregarían <span className="font-semibold text-ink tabular-nums">{formatMxn(numeric * pair.compra)}</span> por tus {props.code}.
              </>
            ) : (
              <>
                te darían{" "}
                <span className="font-semibold text-ink tabular-nums">
                  {(numeric / pair.venta).toLocaleString("es-MX", { maximumFractionDigits: 2 })} {props.code}
                </span>{" "}
                por esos pesos.
              </>
            )}{" "}
            {pair.published ? "Dólar publicado." : "Estimado con el margen del dólar."}
          </p>
        ) : null}
      </section>

      <MotionDisclosure icon={<Shield className="size-4" aria-hidden="true" />} title="De dónde sale el precio" hint="Fuentes del tablero y del mercado" defaultOpen>
        <p className="text-sm text-pretty">{props.rates?.aztecaNote}</p>
        {props.rates?.azteca ? (
          <p className="mt-2 text-sm">
            Dólar Azteca: compra {formatMxn(props.rates.azteca.usdCompra)} · venta {formatMxn(props.rates.azteca.usdVenta)}
            {props.rates.azteca.asOf ? ` · fecha ${props.rates.azteca.asOf}` : ""}.{" "}
            {source ? (
              <a className="underline" href={source} target="_blank" rel="noopener noreferrer">
                Fuente
              </a>
            ) : null}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          Mercado: {props.rates?.marketSource ?? "cargando"}
          {props.rates?.marketAsOf ? ` · ${new Date(props.rates.marketAsOf).toLocaleString("es-MX")}` : ""}. Las casas de cambio no publican un tablero único; compáralo en la pestaña Cerca de mí.
        </p>
      </MotionDisclosure>
    </section>
  );
}

function QuoteCard({
  item,
  index,
  selected,
  usdMid,
  azteca,
  loading,
  sweepKey,
  onSelect,
}: {
  item: RatesResponse["currencies"][number];
  index: number;
  selected: boolean;
  usdMid: number | null;
  azteca: RatesResponse["azteca"];
  loading: boolean;
  sweepKey: number;
  onSelect: () => void;
}) {
  const board = usdMid ? aztecaPair(item.code, item.mxn, usdMid, azteca) : null;
  const hero = item.code === "JPY" ? item.mxn * 100 : item.mxn;
  const unit = item.code === "JPY" ? "100 JPY" : `1 ${item.code}`;
  const series = (item.dayCloses ?? []).map((value) => (item.code === "JPY" ? value * 100 : value));
  const low = series.length ? Math.min(...series) : null;
  const high = series.length ? Math.max(...series) : null;
  const windowHint = !board
    ? "Sin ventanilla"
    : item.code === "JPY"
      ? "Azteca · 100 JPY"
      : board.published
        ? "Azteca publicado"
        : "Azteca estimado";
  const buy = board ? formatMxn(item.code === "JPY" ? board.compra * 100 : board.compra) : "—";
  const sell = board ? formatMxn(item.code === "JPY" ? board.venta * 100 : board.venta) : "—";

  return (
    <GlowCard className="quote-card h-full p-4" active={selected} enterDelay={index * 80} sweepKey={sweepKey}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Flag code={item.code} className="quote-flag" />
          <div>
            <h2 className="font-semibold text-ink">{item.name}</h2>
            <p className="text-sm text-muted">{item.country}</p>
          </div>
        </div>
        {item.dayChangePct != null ? (
          <span
            className={item.dayChangePct >= 0 ? "chg chg--up" : "chg chg--down"}
            aria-label={
              item.dayChangePct >= 0
                ? `sube ${formatChange(item.dayChangePct)} en el día`
                : `baja ${formatChange(item.dayChangePct)} en el día`
            }
          >
            {formatChange(item.dayChangePct)}
          </span>
        ) : null}
      </div>
      <p className="quote-price">
        <LiveFigure value={loading ? null : hero} text={loading ? "…" : formatMxn(hero, 2)} />
      </p>
      <p className="mt-1 text-sm text-muted">por {unit} en el mercado</p>
      <Sparkline values={series} label={`Tendencia del día de ${item.name}`} />
      {low != null && high != null ? (
        <p className="text-xs text-muted tabular-nums">
          Día {formatMxn(low)} – {formatMxn(high)}
        </p>
      ) : null}
      {item.code === "JPY" && !loading ? <p className="text-sm text-muted tabular-nums">1 JPY = {formatMxn(item.mxn, 4)}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <BoardCell label="Te compran" value={buy} hint={windowHint} />
        <BoardCell label="Te venden" value={sell} hint={windowHint} accent />
      </div>
      {board ? <SpreadBar compra={board.compra} mid={item.mxn} venta={board.venta} /> : null}
      <MotionButton className="mt-3" tone={selected ? "primary" : "outline"} size="sm" block onClick={onSelect}>
        {selected ? "En la ventanilla" : `Cotizar ${item.code}`}
      </MotionButton>
    </GlowCard>
  );
}

function BoardCell({ label, value, hint, accent = false }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl px-3 py-2 " + (accent ? "bg-accent-soft" : "bg-primary-soft")}>
      <p className="text-xs text-muted">{label}</p>
      <p className={"text-sm font-semibold tabular-nums " + (accent ? "text-accent" : "text-primary")}>{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}
