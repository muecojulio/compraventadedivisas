import { motion } from "motion/react";
import { BOUNCY_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";
import type { ReactNode } from "react";

export type MotionBarProps = {
  /** Progreso de 0 a 1. `null` deja la barra en modo indeterminado. */
  value?: number | null;
  /** Barrido continuo mientras se espera una respuesta. */
  busy?: boolean;
  label: string;
  hint?: ReactNode;
  tone?: "primary" | "accent";
  className?: string;
};

const SHIMMER_TRAVEL = { x: ["-45%", "255%"] };

/**
 * Barra con física: el relleno avanza con resorte y, mientras hay una consulta
 * en vuelo, un brillo recorre la pista.
 */
export function MotionBar({
  value = null,
  busy = false,
  label,
  hint,
  tone = "primary",
  className,
}: MotionBarProps) {
  const reduced = useMotionOff();
  const spring = useSpringTransition(BOUNCY_SPRING);
  const clamped = Math.min(1, Math.max(0, value ?? (busy ? 1 : 0)));
  const percent = Math.round(clamped * 100);

  return (
    <div className={cx("mui-bar-row", className)}>
      <div
        className={cx("mui-bar", tone === "accent" && "mui-bar--accent")}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={busy ? undefined : percent}
        aria-valuetext={busy ? "consultando el mercado" : `${percent}%`}
      >
        {busy && !reduced ? (
          <motion.span
            className="mui-bar__shimmer"
            animate={SHIMMER_TRAVEL}
            transition={{ duration: 1.35, ease: "easeInOut", repeat: Infinity }}
            aria-hidden="true"
          />
        ) : null}
        <motion.span
          className="mui-bar__fill"
          style={busy ? { opacity: reduced ? 0.35 : 0.24 } : undefined}
          animate={{ width: `${busy && value == null ? 100 : percent}%` }}
          transition={spring}
          aria-hidden="true"
        />
      </div>
      {hint ? <p className="mui-bar-row__label">{hint}</p> : null}
    </div>
  );
}

/** Punto vivo que late cuando el refresco automático está activo. */
export function LiveDot({ on }: { on: boolean }) {
  return <span className={cx("mui-live-dot", !on && "is-paused")} aria-hidden="true" />;
}
