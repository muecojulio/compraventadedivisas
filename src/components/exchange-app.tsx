import { useEffect, useRef, useState, type TouchEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MoveHorizontal, Shield } from "lucide-react";
import { AirportPanel, NearbyPanel } from "@/components/places-board";
import { QuotePanel } from "@/components/quote-panel";
import { MarketShell, PapelPicado, SessionStrip, TickerTape } from "@/components/market-live";
import { LiveDot, MotionRouterLink, MotionTabs, type MotionTabItem } from "@/components/motion-ui";
import { type CurrencyCode, type RatesResponse } from "@/lib/domain";
import { SAMPLE_RATES } from "@/lib/sample-board";

type Tab = "cotizar" | "cerca" | "aeropuertos";

const TABS: Array<MotionTabItem<Tab>> = [
  { id: "cotizar", label: "Cotizar" },
  { id: "cerca", label: "Cerca de mí" },
  { id: "aeropuertos", label: "Aeropuertos" },
];

const AUTO_REFRESH_MS = 60_000;

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
      (horizontalDistance >= 64 || (horizontalDistance >= 36 && horizontalDistance / elapsedMs > 0.45));
    if (!isHorizontalSwipe) return;

    const currentIndex = TABS.findIndex((item) => item.id === tab);
    const nextIndex = Math.max(0, Math.min(TABS.length - 1, currentIndex + (deltaX < 0 ? 1 : -1)));
    const nextTab = TABS[nextIndex];
    if (nextTab && nextIndex !== currentIndex) changeTab(nextTab.id);
  }

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
  const demo = rates == null && !loadingRates;
  const board = rates ?? (demo ? SAMPLE_RATES : null);
  const panelVariants = {
    enter: (direction: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : direction * 18 }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : direction * -18 }),
  };

  return (
    <MarketShell>
      <header className="floor-header">
        <PapelPicado />
        <div className="floor-brand">
          <div className="min-w-0">
            <p className="floor-kicker">
              <LiveDot on={auto && !loadingRates && !demo} />
              Piso de cambios · pesos mexicanos
            </p>
            <h1 className="floor-title">
              CompraVenta <span>de divisas</span>
            </h1>
            <p className="floor-lede">Dólar, yen y canadiense. El mercado no se queda quieto.</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={"live-stamp" + (auto && !demo ? "" : " live-stamp--paused")}>
              {demo ? "Muestra" : auto ? "En vivo" : "En pausa"}
            </span>
            <MotionRouterLink
              to="/privacidad"
              tone="outline"
              size="md"
              leading={<Shield className="size-4" aria-hidden="true" />}
            >
              Privacidad
            </MotionRouterLink>
          </div>
        </div>
        <SessionStrip />
      </header>
      {demo ? (
        <p className="demo-banner" role="status">
          Sin lectura en vivo. Los números de abajo son una muestra del 9 de octubre de 2026 para ver el piso. No
          operes con ellos.
        </p>
      ) : null}
      <TickerTape rates={board} />

      <main className="mx-auto max-w-5xl px-4 py-5 pb-10">
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
                prefersReducedMotion ? { duration: 0.01 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
              }
              id="panel-main"
              role="tabpanel"
              aria-labelledby={`main-tab-${tab}`}
              tabIndex={0}
            >
              {tab === "cotizar" ? (
                <QuotePanel
                  rates={board}
                  demo={demo}
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
              {tab === "cerca" ? <NearbyPanel rates={board} /> : null}
              {tab === "aeropuertos" ? <AirportPanel rates={board} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <footer className="floor-footer">
        <p>
          Referencia de mercado, no una ventanilla ni asesoría. El precio de sucursal cambia por horario y monto.
        </p>
        <MotionRouterLink to="/privacidad" tone="quiet" size="sm">
          Política de privacidad
        </MotionRouterLink>
      </footer>
    </MarketShell>
  );
}
