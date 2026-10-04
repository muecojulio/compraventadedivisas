import { useId } from "react";
import { motion } from "motion/react";
import { BOUNCY_SPRING, cx } from "./springs";
import { useSpringTransition } from "./use-spring";

const TRACK_W = 46;
const TRACK_H = 26;
const PAD = 3;
const ORB = TRACK_H - PAD * 2;
const TRAVEL = TRACK_W - ORB - PAD * 2;
const GOO_W = TRACK_W - PAD * 2;
const GOO_H = TRACK_H - PAD * 2;

const ON_COLOR = "#0e6b54";
const OFF_COLOR = "#dcd8cc";

export type LiquidSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Nombre accesible del interruptor. */
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Barra de estado con mercurio: la perla se estira y se funde con la pista
 * gracias a un filtro SVG (blur + matriz alfa).
 */
export function LiquidSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: LiquidSwitchProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `mui-goo-${safeId}`;
  const descriptionId = description ? `mui-goo-desc-${safeId}` : undefined;
  const spring = useSpringTransition(BOUNCY_SPRING);

  return (
    <>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        disabled={disabled}
        className={cx("mui-switch", className)}
        style={{ width: TRACK_W, height: TRACK_H }}
        onClick={() => onChange(!checked)}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={spring}
      >
        <motion.span
          className="mui-switch__track"
          animate={{ backgroundColor: checked ? ON_COLOR : OFF_COLOR }}
          transition={spring}
          aria-hidden="true"
        />
        <span
          className="mui-switch__goo"
          style={{ width: GOO_W, height: GOO_H, filter: `url(#${filterId})` }}
          aria-hidden="true"
        >
          <motion.span
            className="mui-switch__neck"
            style={{ width: GOO_W }}
            animate={{ x: 0, scaleX: checked ? 1 : ORB / GOO_W }}
            transition={spring}
          />
          <motion.span
            className="mui-switch__orb"
            style={{ width: ORB, height: ORB }}
            animate={{ x: checked ? TRAVEL : 0, scaleX: checked ? 1.04 : 1 }}
            transition={spring}
          />
        </span>
        <motion.span
          className="mui-switch__glint"
          animate={{ x: checked ? TRAVEL : 0 }}
          transition={spring}
          aria-hidden="true"
        />
        <span className="sr-only">{checked ? "Desactivar" : "Activar"}</span>
      </motion.button>
      <svg className="mui-switch__filters" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id={filterId}
            x="-45%"
            y="-70%"
            width="190%"
            height="240%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.7" result="softened" />
            <feColorMatrix
              in="softened"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="liquid"
            />
            <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
