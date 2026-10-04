import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { cx, PRESS_SPRING } from "./motion-utils";

export type Tactile3DButtonProps = Omit<
  HTMLMotionProps<"button">,
  "className" | "children" | "disabled" | "type" | "whileHover" | "whileTap" | "transition"
> & {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: HTMLMotionProps<"button">["type"];
  tone?: "critical" | "primary";
};

export function Tactile3DButton({
  children = "Confirmar acción",
  className,
  disabled = false,
  tone = "critical",
  type = "button",
  ...buttonProps
}: Tactile3DButtonProps) {
  const reducedMotion = useReducedMotion();
  const spring = reducedMotion ? { duration: 0.12 } : PRESS_SPRING;
  const pressedShadow = tone === "critical" ? "0px 1px 0px #793a24" : "0px 1px 0px #084431";
  const hoverShadow =
    tone === "critical"
      ? "0px 8px 0px #793a24, 0px 13px 20px rgba(104, 48, 28, 0.17)"
      : "0px 8px 0px #084431, 0px 13px 20px rgba(8, 68, 49, 0.17)";

  return (
    <motion.button
      {...buttonProps}
      className={cx("motion-tactile-button", `motion-tactile-button--${tone}`, className)}
      type={type}
      disabled={disabled}
      whileHover={disabled || reducedMotion ? undefined : { y: -2, boxShadow: hoverShadow }}
      whileTap={disabled || reducedMotion ? undefined : { y: 6, boxShadow: pressedShadow }}
      transition={spring}
    >
      <span className="motion-tactile-button__content">
        <span className="motion-tactile-button__icon" aria-hidden="true">
          {tone === "critical" ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
        </span>
        <span className="motion-tactile-button__label">{children}</span>
        <ArrowRight className="motion-tactile-button__arrow" size={16} aria-hidden="true" />
      </span>
    </motion.button>
  );
}
