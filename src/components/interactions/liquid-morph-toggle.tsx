import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, Droplets } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { BOUNCY_SPRING, cx } from "./motion-utils";

export type LiquidMorphToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
};

export function LiquidMorphToggle({
  checked: controlledChecked,
  defaultChecked = true,
  onCheckedChange,
  label = "Alertas de mercado",
  description = "Avísame cuando una divisa se mueva más de un 2 %.",
  className,
}: LiquidMorphToggleProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `liquid-goo-${safeId}`;
  const descriptionId = `liquid-description-${safeId}`;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const reducedMotion = useReducedMotion();
  const isChecked = controlledChecked ?? uncontrolledChecked;
  const spring = reducedMotion ? { duration: 0.15 } : BOUNCY_SPRING;

  const toggle = () => {
    const nextValue = !isChecked;
    if (controlledChecked === undefined) setUncontrolledChecked(nextValue);
    onCheckedChange?.(nextValue);
  };

  return (
    <FeatureCard
      number="02"
      eyebrow="LIQUID MORPH"
      title="Un switch con memoria elástica"
      description="Un rastro de mercurio se estira y se funde al desplazarse en el eje X."
      className={cx("motion-card--liquid", className)}
    >
      <div className="liquid-demo">
        <div className="liquid-demo__copy">
          <span className="liquid-demo__icon" aria-hidden="true">
            <Activity size={16} />
          </span>
          <div>
            <p className="liquid-demo__label">{label}</p>
            <p className="liquid-demo__description" id={descriptionId}>
              {description}
            </p>
          </div>
        </div>

        <div className="liquid-demo__control">
          <span
            className={"liquid-demo__state" + (isChecked ? " is-enabled" : "")}
            aria-live="polite"
          >
            {isChecked ? "ACTIVO" : "PAUSADO"}
          </span>
          <motion.button
            className="liquid-switch"
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-label={label}
            aria-describedby={descriptionId}
            onClick={toggle}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={spring}
          >
            <motion.span
              className="liquid-switch__track"
              animate={{ backgroundColor: isChecked ? "#0e6b54" : "#dce4dd" }}
              transition={spring}
              aria-hidden="true"
            />
            <span
              className="liquid-switch__goo"
              style={{ filter: `url(#${filterId})` }}
              aria-hidden="true"
            >
              <motion.span
                className="liquid-switch__neck"
                animate={{ x: isChecked ? 18 : 12, scaleX: isChecked ? 0.96 : 0.58 }}
                transition={spring}
              />
              <motion.span
                className="liquid-switch__orb"
                animate={{ x: isChecked ? 34 : 0, scaleX: isChecked ? 1.05 : 1 }}
                transition={spring}
              />
            </span>
            <motion.span
              className="liquid-switch__glint"
              animate={{ x: isChecked ? 34 : 0 }}
              transition={spring}
              aria-hidden="true"
            />
            <span className="liquid-switch__sr-only">{isChecked ? "Desactivar" : "Activar"}</span>
          </motion.button>
        </div>
      </div>

      <div className="liquid-demo__footnote">
        <Droplets size={14} aria-hidden="true" />
        <span>Filtro SVG activo · blur + matriz alfa</span>
      </div>

      <svg className="liquid-demo__filters" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id={filterId}
            x="-55%"
            y="-75%"
            width="210%"
            height="250%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="softened" />
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
    </FeatureCard>
  );
}
