import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw, Shield } from "lucide-react";
import { AirportPanel, NearbyPanel } from "@/components/places-board";
import { Flag } from "@/components/flags";
import {
  CURRENCY_META,
  aztecaPair,
  formatMxn,
  type CurrencyCode,
  type RatesResponse,
} from "@/lib/domain";

type Tab = "cotizar" | "cerca" | "aeropuertos";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "cotizar", label: "Cotizar" },
  { id: "cerca", label: "Cerca de mí" },
  { id: "aeropuertos", label: "Aeropuertos" },
];

export function ExchangeApp() {
  const [tab, setTab] = useState<Tab>("cotizar");
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [code, setCode] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("100");
  const [toMxn, setToMxn] = useState(true);

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/rates");
        const body = (await res.json()) as RatesResponse & { error?: string };
        if (!res.ok) throw new Error(body.error || "Error");
        if (!stop) {
          setRates(body);
          setRateError(null);
        }
      } catch (error) {
        if (!stop) setRateError(error instanceof Error ? error.message : "Error");
      } finally {
        if (!stop) setLoadingRates(false);
      }
    };
    void pull();
    if (!auto) return () => { stop = true; };
    const timer = window.setInterval(() => void pull(), 60_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [auto, tick]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Pesos mexicanos</p>
            <h1 className="font-display text-3xl leading-none text-balance text-ink">CompraVenta de divisas</h1>
          </div>
          <Link
            to="/privacidad"
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink"
          >
            <Shield className="size-4" aria-hidden="true" />
            Privacidad
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 pb-16">
        <div className="mb-5 flex gap-2 overflow-x-auto" role="tablist" aria-label="Secciones">
          {TABS.map((item) => {
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(item.id)}
                className={
                  "press h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200 " +
                  (on ? "bg-primary text-on-primary" : "border border-line bg-surface text-ink")
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "cotizar" ? (
          <QuotePanel
            rates={rates}
            error={rateError}
            loading={loadingRates}
            auto={auto}
            onAuto={setAuto}
            code={code}
            onCode={setCode}
            amount={amount}
            onAmount={setAmount}
            toMxn={toMxn}
            onToMxn={setToMxn}
            onRetry={() => {
              setLoadingRates(true);
              setTick((value) => value + 1);
            }}
          />
        ) : null}
        {tab === "cerca" ? <NearbyPanel rates={rates} /> : null}
        {tab === "aeropuertos" ? <AirportPanel rates={rates} /> : null}
      </main>
    </div>
  );
}

function QuotePanel(props: {
  rates: RatesResponse | null;
  error: string | null;
  loading: boolean;
  auto: boolean;
  onAuto: (value: boolean) => void;
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
  const valid = Number.isFinite(numeric) && numeric >= 0;
  const result = !selected || !valid ? null : props.toMxn ? numeric * selected.mxn : numeric / selected.mxn;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-pretty text-muted">
          Dólar, yen y dólar canadiense contra el peso. El mercado se refresca solo; Banco Azteca muestra la ventanilla publicada.
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={props.auto}
          onClick={() => props.onAuto(!props.auto)}
          className="press inline-flex h-11 items-center gap-3 rounded-full border border-line bg-surface pr-2 pl-4 text-sm"
        >
          <RefreshCw className="size-4 text-primary" aria-hidden="true" />
          En vivo
          <span className={"relative h-6 w-11 rounded-full transition-colors duration-200 " + (props.auto ? "bg-primary" : "bg-line")}>
            <span
              className={
                "absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-transform duration-200 " +
                (props.auto ? "translate-x-5" : "translate-x-0.5")
              }
            />
          </span>
        </button>
        <button type="button" onClick={props.onRetry} className="press h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
          Actualizar
        </button>
      </div>

      {props.error ? (
        <p className="rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">{props.error}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {(props.rates?.currencies ?? ["USD", "JPY", "CAD"].map((code) => ({
          code: code as CurrencyCode,
          name: CURRENCY_META[code as CurrencyCode].name,
          country: CURRENCY_META[code as CurrencyCode].country,
          mxn: 0,
        }))).map((item, index) => {
          const board = usd ? aztecaPair(item.code, item.mxn, usd.mxn, props.rates?.azteca ?? null) : null;
          const hero = item.code === "JPY" ? item.mxn * 100 : item.mxn;
          const unit = item.code === "JPY" ? "100 JPY" : `1 ${item.code}`;
          return (
            <article
              key={item.code}
              className="rise rounded-card border border-line bg-surface p-4 shadow-sm"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-3 flex items-center gap-3">
                <Flag code={item.code} className="h-8 w-12 rounded-md border border-line" />
                <div>
                  <h2 className="font-semibold text-ink">{item.name}</h2>
                  <p className="text-sm text-muted">{item.country}</p>
                </div>
              </div>
              <p className="font-display text-4xl tabular-nums text-ink">
                {props.loading || !props.rates ? "…" : formatMxn(hero, item.code === "JPY" ? 2 : 2)}
              </p>
              <p className="mt-1 text-sm text-muted">por {unit} en el mercado</p>
              {item.code === "JPY" && props.rates ? (
                <p className="text-sm text-muted tabular-nums">1 JPY = {formatMxn(item.mxn, 4)}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <BoardCell
                  label="Te compran"
                  value={board ? formatMxn(item.code === "JPY" ? board.compra * 100 : board.compra) : "—"}
                  hint={item.code === "JPY" ? "Azteca · 100 JPY" : board?.published ? "Azteca publicado" : "Azteca estimado"}
                />
                <BoardCell
                  label="Te venden"
                  value={board ? formatMxn(item.code === "JPY" ? board.venta * 100 : board.venta) : "—"}
                  hint={item.code === "JPY" ? "Azteca · 100 JPY" : board?.published ? "Azteca publicado" : "Azteca estimado"}
                  accent
                />
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["USD", "JPY", "CAD"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => props.onCode(item)}
              className={
                "press inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold " +
                (props.code === item ? "bg-ink text-on-primary" : "border border-line bg-paper text-ink")
              }
            >
              <Flag code={item} className="h-4 w-6 rounded-sm" />
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{props.toMxn ? `Cantidad en ${props.code}` : "Cantidad en MXN"}</span>
            <input
              inputMode="decimal"
              value={props.amount}
              onChange={(event) => props.onAmount(event.target.value)}
              className="h-12 w-full rounded-2xl border border-line bg-paper px-4 text-lg tabular-nums outline-none focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={() => props.onToMxn(!props.toMxn)}
            className="press h-12 self-end rounded-full border border-line px-4 text-sm font-semibold"
          >
            {props.toMxn ? "Ver divisa" : "Ver pesos"}
          </button>
        </div>
        <p className="mt-4 font-display text-3xl tabular-nums">
          {result == null ? "—" : props.toMxn ? formatMxn(result) : `${result.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${props.code}`}
        </p>
        <p className="text-sm text-muted">Con el tipo de mercado, no con el de ventanilla.</p>
        {pair && valid ? (
          <p className="mt-2 text-sm text-pretty text-muted">
            Banco Azteca, misma operación:{" "}
            {props.toMxn ? (
              <>
                te entregarían{" "}
                <span className="font-semibold text-ink tabular-nums">{formatMxn(numeric * pair.compra)}</span> por tus {props.code}.
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

      <aside className="rounded-card border border-line bg-primary-soft p-4 text-sm text-pretty text-ink">
        <p className="font-semibold">De dónde sale el precio</p>
        <p className="mt-1">{props.rates?.aztecaNote}</p>
        {props.rates?.azteca ? (
          <p className="mt-2">
            Dólar Azteca: compra {formatMxn(props.rates.azteca.usdCompra)} · venta {formatMxn(props.rates.azteca.usdVenta)}
            {props.rates.azteca.asOf ? ` · fecha ${props.rates.azteca.asOf}` : ""}.{" "}
            <a className="underline" href={props.rates.azteca.sourceUrl} target="_blank" rel="noreferrer">
              Fuente
            </a>
          </p>
        ) : null}
        <p className="mt-2 text-muted">
          Mercado: {props.rates?.marketSource ?? "cargando"}
          {props.rates?.marketAsOf ? ` · ${new Date(props.rates.marketAsOf).toLocaleString("es-MX")}` : ""}. Las casas de cambio no publican un tablero único; compáralo en la pestaña Cerca de mí.
        </p>
      </aside>
    </section>
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

