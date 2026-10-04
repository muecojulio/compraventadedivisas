import { useEffect, useRef, useState, type TouchEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftRight, Calculator, MoveHorizontal, RefreshCw, Shield } from "lucide-react";
import { AirportPanel, NearbyPanel } from "@/components/places-board";
import { Flag } from "@/components/flags";
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
  MotionRouterLink,
  MotionTabs,
  type MotionTabItem,
} from "@/components/motion-ui";
import {
  CURRENCY_META,
  aztecaPair,
  formatMxn,
  type CurrencyCode,
  type RatesResponse,
} from "@/lib/domain";

type Tab = "cotizar" | "cerca" | "aeropuertos";

const TABS: Array<MotionTabItem<Tab>> = [
  { id: "cotizar", label: "Cotizar" },
  { id: "cerca", label: "Cerca de mí" },
  { id: "aeropuertos", label: "Aeropuertos" },
];

const AUTO_REFRESH_MS = 60_000;
const CURRENCY_CODES: Array<CurrencyCode> = ["USD", "JPY", "CAD"];

export function ExchangeApp() {
  const [tab, setTab] = useState<Tab>("cotizar");
  const [tabDirection, setTabDirection] = useState(1);
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [refreshFeedback, setRefreshFeedback] = useState<"success" | "error" | null>(null);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [code, setCode] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("100");
  const [toMxn, setToMxn] = useState(true);
  const manualRefreshRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const swipeStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const prefersReducedMotion = useReducedMotion() === true;

  useEffect(() => {
    let stop = false;
    const showFeedback = (status: "success" | "error") => {
      setRefreshFeedback(status);
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => setRefreshFeedback(null), 2200);
    };
    const pull = async () => {
      const isManualRefresh = manualRefreshRef.current;
      manualRefreshRef.current = false;
      try {
        const res = await fetch("/api/rates");
        const body = (await res.json()) as RatesResponse & { error?: string };
        if (!res.ok) throw new Error(body.error || "Error");
        if (!stop) {
          setRates(body);
          setRateError(null);
          setRefreshedAt(Date.now());
          setElapsed(0);
          if (isManualRefresh) showFeedback("success");
        }
      } catch (error) {
        if (!stop) {
          setRateError(error instanceof Error ? error.message : "Error");
          if (isManualRefresh) showFeedback("error");
        }
      } finally {
        if (!stop) setLoadingRates(false);
      }
    };
    void pull();
    if (!auto)
      return () => {
        stop = true;
      };
    const timer = window.setInterval(() => void pull(), AUTO_REFRESH_MS);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [auto, tick]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  function changeTab(nextTab: Tab) {
    const currentIndex = TABS.findIndex((item) => item.id === tab);
    const nextIndex = TABS.findIndex((item) => item.id === nextTab);
    if (nextIndex !== currentIndex) setTabDirection(Math.sign(nextIndex - currentIndex) || 1);
    setTab(nextTab);
  }

  function handlePanelTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1) {
      swipeStart.current = null;
      return;
    }
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        "input, textarea, select, button, a, [role='button'], [role='switch'], [role='tablist'], [data-horizontal-rail], [data-swipe-ignore], [data-card-swipe], .mui-combobox",
      )
    ) {
      swipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    swipeStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  function handlePanelTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const elapsedMs = Math.max(1, Date.now() - start.time);
    const horizontalDistance = Math.abs(deltaX);
    const isHorizontalSwipe =
      horizontalDistance > Math.abs(deltaY) * 1.25 &&
      (horizontalDistance >= 64 ||
        (horizontalDistance >= 36 && horizontalDistance / elapsedMs > 0.45));
    if (!isHorizontalSwipe) return;

    const currentIndex = TABS.findIndex((item) => item.id === tab);
    const nextIndex = Math.max(0, Math.min(TABS.length - 1, currentIndex + (deltaX < 0 ? 1 : -1)));
    const nextTab = TABS[nextIndex];
    if (nextTab && nextIndex !== currentIndex) changeTab(nextTab.id);
  }

  // Reloj de la barra: solo corre en el cliente y solo con el refresco en vivo.
  useEffect(() => {
    if (!auto) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => {
      if (refreshedAt === null) return;
      setElapsed(Math.min(AUTO_REFRESH_MS, Date.now() - refreshedAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [auto, refreshedAt]);

  const progress = refreshedAt === null ? null : Math.min(1, elapsed / AUTO_REFRESH_MS);
  const panelVariants = {
    enter: (direction: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : direction * 18 }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : direction * -18 }),
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
              <LiveDot on={auto && !loadingRates} />
              Pesos mexicanos
            </p>
            <h1 className="font-display text-3xl leading-none text-balance text-ink">
              CompraVenta de divisas
            </h1>
          </div>
          <MotionRouterLink
            to="/privacidad"
            tone="outline"
            size="md"
            leading={<Shield className="size-4" aria-hidden="true" />}
          >
            Privacidad
          </MotionRouterLink>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 pb-16">
        <MotionTabs
          items={TABS}
          value={tab}
          onChange={changeTab}
          ariaLabel="Secciones"
          idPrefix="main"
          panelId="panel-main"
          layoutId="main-tab-pill"
          className="mb-2"
        />
        <p className="mui-panel-swipe-hint" aria-hidden="true">
          <MoveHorizontal size={14} /> Desliza el contenido para cambiar de sección
        </p>

        <div
          className="mui-panel-swipe-zone"
          onTouchStart={handlePanelTouchStart}
          onTouchEnd={handlePanelTouchEnd}
          onTouchCancel={() => {
            swipeStart.current = null;
          }}
        >
          <AnimatePresence initial={false} mode="wait" custom={tabDirection}>
            <motion.div
              key={tab}
              custom={tabDirection}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
              }
              id="panel-main"
              role="tabpanel"
              aria-labelledby={`main-tab-${tab}`}
              tabIndex={0}
            >
              {tab === "cotizar" ? (
                <QuotePanel
                  rates={rates}
                  error={rateError}
                  loading={loadingRates}
                  refreshFeedback={refreshFeedback}
                  auto={auto}
                  onAuto={setAuto}
                  progress={progress}
                  refreshedAt={refreshedAt}
                  code={code}
                  onCode={setCode}
                  amount={amount}
                  onAmount={setAmount}
                  toMxn={toMxn}
                  onToMxn={setToMxn}
                  onRetry={() => {
                    manualRefreshRef.current = true;
                    setRefreshFeedback(null);
                    setLoadingRates(true);
                    setTick((value) => value + 1);
                  }}
                />
              ) : null}
              {tab === "cerca" ? <NearbyPanel rates={rates} /> : null}
              {tab === "aeropuertos" ? <AirportPanel rates={rates} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function QuotePanel(props: {
  rates: RatesResponse | null;
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
    selected && usd
      ? aztecaPair(selected.code, selected.mxn, usd.mxn, props.rates?.azteca ?? null)
      : null;
  const numeric = Number(props.amount.replace(",", "."));
  const valid = Number.isFinite(numeric) && numeric >= 0;
  const result =
    !selected || !valid ? null : props.toMxn ? numeric * selected.mxn : numeric / selected.mxn;
  const refreshedLabel =
    props.refreshedAt === null
      ? props.loading
        ? "consultando el mercado"
        : "sin lectura todavía"
      : new Date(props.refreshedAt).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-pretty text-muted">
          Dólar, yen y dólar canadiense contra el peso. El mercado se refresca solo; Banco Azteca
          muestra la ventanilla publicada.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mui-pill h-11">
            <RefreshCw className="size-4 text-primary" aria-hidden="true" />
            En vivo
            <LiquidSwitch
              checked={props.auto}
              onChange={props.onAuto}
              label="Actualización en vivo cada minuto"
            />
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
            {props.refreshFeedback === "success"
              ? "Actualizado"
              : props.refreshFeedback === "error"
                ? "Reintentar"
                : "Actualizar"}
          </MotionButton>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface px-4 py-3">
        <MotionBar
          value={props.auto ? props.progress : 0}
          busy={props.loading}
          label="Ciclo de refresco del tipo de cambio"
          tone={props.error ? "accent" : "primary"}
          hint={
            <span>
              <LiveDot on={props.auto && !props.loading} />
              {props.auto
                ? `Siguiente lectura: ${refreshedLabel}`
                : `Refresco en pausa · ${refreshedLabel}`}
            </span>
          }
        />
      </div>

      {props.error ? (
        <p className="rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
          {props.error}
        </p>
      ) : null}

      <MotionRail
        activeKey={props.code}
        ariaLabel="Cotizaciones por divisa"
        className="mui-quote-rail"
        frameClassName="mui-quote-rail-frame"
      >
        {(
          props.rates?.currencies ??
          CURRENCY_CODES.map((code) => ({
            code,
            name: CURRENCY_META[code].name,
            country: CURRENCY_META[code].country,
            mxn: 0,
          }))
        ).map((item, index) => {
          const board = usd
            ? aztecaPair(item.code, item.mxn, usd.mxn, props.rates?.azteca ?? null)
            : null;
          const hero = item.code === "JPY" ? item.mxn * 100 : item.mxn;
          const unit = item.code === "JPY" ? "100 JPY" : `1 ${item.code}`;
          return (
            <GlowCard
              key={item.code}
              className="p-4 h-full"
              active={item.code === props.code}
              enterDelay={index * 80}
              sweepKey={props.refreshedAt ? Math.round(props.refreshedAt / 1000) : 0}
            >
              <div className="mb-3 flex items-center gap-3">
                <Flag code={item.code} className="h-8 w-12 rounded-md border border-line" />
                <div>
                  <h2 className="font-semibold text-ink">{item.name}</h2>
                  <p className="text-sm text-muted">{item.country}</p>
                </div>
              </div>
              <p className="font-display text-4xl tabular-nums text-ink">
                {props.loading || !props.rates ? "…" : formatMxn(hero, 2)}
              </p>
              <p className="mt-1 text-sm text-muted">por {unit} en el mercado</p>
              {item.code === "JPY" && props.rates ? (
                <p className="text-sm text-muted tabular-nums">1 JPY = {formatMxn(item.mxn, 4)}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <BoardCell
                  label="Te compran"
                  value={
                    board ? formatMxn(item.code === "JPY" ? board.compra * 100 : board.compra) : "—"
                  }
                  hint={
                    item.code === "JPY"
                      ? "Azteca · 100 JPY"
                      : board?.published
                        ? "Azteca publicado"
                        : "Azteca estimado"
                  }
                />
                <BoardCell
                  label="Te venden"
                  value={
                    board ? formatMxn(item.code === "JPY" ? board.venta * 100 : board.venta) : "—"
                  }
                  hint={
                    item.code === "JPY"
                      ? "Azteca · 100 JPY"
                      : board?.published
                        ? "Azteca publicado"
                        : "Azteca estimado"
                  }
                  accent
                />
              </div>
            </GlowCard>
          );
        })}
      </MotionRail>

      <section className="rounded-card border border-line bg-surface p-4">
        <MotionRail
          activeKey={props.code}
          ariaLabel="Elegir divisa"
          className="mui-currency-rail"
          frameClassName="mui-currency-rail-frame mb-3"
        >
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
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
          <MotionField
            label={props.toMxn ? `Cantidad en ${props.code}` : "Cantidad en MXN"}
            value={props.amount}
            onValueChange={props.onAmount}
            inputMode="decimal"
            icon={<Calculator className="size-4" aria-hidden="true" />}
            placeholder="0.00"
          />
          <MotionButton
            tone="outline"
            size="lg"
            leading={<ArrowLeftRight className="size-4" aria-hidden="true" />}
            onClick={() => props.onToMxn(!props.toMxn)}
          >
            {props.toMxn ? "Ver divisa" : "Ver pesos"}
          </MotionButton>
        </div>
        <p className="mt-4 font-display text-3xl tabular-nums">
          {result == null
            ? "—"
            : props.toMxn
              ? formatMxn(result)
              : `${result.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${props.code}`}
        </p>
        <p className="text-sm text-muted">Con el tipo de mercado, no con el de ventanilla.</p>
        {pair && valid ? (
          <p className="mt-2 text-sm text-pretty text-muted">
            Banco Azteca, misma operación:{" "}
            {props.toMxn ? (
              <>
                te entregarían{" "}
                <span className="font-semibold text-ink tabular-nums">
                  {formatMxn(numeric * pair.compra)}
                </span>{" "}
                por tus {props.code}.
              </>
            ) : (
              <>
                te darían{" "}
                <span className="font-semibold text-ink tabular-nums">
                  {(numeric / pair.venta).toLocaleString("es-MX", { maximumFractionDigits: 2 })}{" "}
                  {props.code}
                </span>{" "}
                por esos pesos.
              </>
            )}{" "}
            {pair.published ? "Dólar publicado." : "Estimado con el margen del dólar."}
          </p>
        ) : null}
      </section>

      <MotionDisclosure
        icon={<Shield className="size-4" aria-hidden="true" />}
        title="De dónde sale el precio"
        hint="Fuentes del tablero y del mercado"
        defaultOpen
      >
        <p className="text-sm text-pretty">{props.rates?.aztecaNote}</p>
        {props.rates?.azteca ? (
          <p className="mt-2 text-sm">
            Dólar Azteca: compra {formatMxn(props.rates.azteca.usdCompra)} · venta{" "}
            {formatMxn(props.rates.azteca.usdVenta)}
            {props.rates.azteca.asOf ? ` · fecha ${props.rates.azteca.asOf}` : ""}.{" "}
            <a
              className="underline"
              href={props.rates.azteca.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Fuente
            </a>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          Mercado: {props.rates?.marketSource ?? "cargando"}
          {props.rates?.marketAsOf
            ? ` · ${new Date(props.rates.marketAsOf).toLocaleString("es-MX")}`
            : ""}
          . Las casas de cambio no publican un tablero único; compáralo en la pestaña Cerca de mí.
        </p>
      </MotionDisclosure>
    </section>
  );
}

function BoardCell({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={"rounded-2xl px-3 py-2 " + (accent ? "bg-accent-soft" : "bg-primary-soft")}>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={
          "text-sm font-semibold tabular-nums " + (accent ? "text-accent" : "text-primary")
        }
      >
        {value}
      </p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}
