import { useState, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { BOUNCY_SPRING, PRESS_SPRING, SOFT_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionChipProps = Omit<
  HTMLMotionProps<"button">,
  "children" | "className" | "whileHover" | "whileTap" | "transition" | "type"
> & {
  children?: ReactNode;
  className?: string;
  selected?: boolean;
  tone?: "ink" | "primary";
  size?: "sm" | "md";
  block?: boolean;
  leading?: ReactNode;
  layoutId?: string;
  /** Retraso de la entrada escalonada, en milisegundos. */
  enterDelay?: number;
  type?: "button" | "submit";
};

/**
 * Opción de menú (divisa, país, filtro). La selección se transfiere de un chip
 * a otro como una gota: la píldora comparte `layoutId` y viaja con resorte.
 */
export function MotionChip({
  children,
  className,
  selected = false,
  tone = "primary",
  size = "md",
  block = false,
  leading,
  layoutId,
  enterDelay,
  type = "button",
  onClick,
  ...rest
}: MotionChipProps) {
  const reduced = useMotionOff();
  const pressTransition = useSpringTransition(PRESS_SPRING);
  const pillTransition = useSpringTransition(SOFT_SPRING);
  const iconTransition = useSpringTransition(BOUNCY_SPRING);
  const [pressCount, setPressCount] = useState(0);

  return (
    <motion.button
      {...rest}
      type={type}
      aria-pressed={selected}
      className={cx(
        "mui-chip",
        `mui-chip--${tone}`,
        `mui-chip--${size}`,
        block && "mui-chip--block",
        enterDelay !== undefined && "mui-chip--enter",
        className,
      )}
      style={{ ...rest.style, animationDelay: enterDelay ? `${enterDelay}ms` : undefined }}
      whileHover={reduced ? undefined : { y: -1.5 }}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      transition={pressTransition}
      onClick={(event) => {
        setPressCount((count) => count + 1);
        onClick?.(event);
      }}
    >
      {selected ? (
        layoutId ? (
          <motion.span
            layoutId={layoutId}
            className="mui-chip__pill"
            transition={pillTransition}
            aria-hidden="true"
          />
        ) : (
          <motion.span
            layout
            className="mui-chip__pill"
            transition={pillTransition}
            aria-hidden="true"
          />
        )
      ) : null}
      {leading ? (
        <motion.span
          key={`icon-${pressCount}`}
          className="mui-chip__icon"
          initial={false}
          animate={
            reduced || pressCount === 0
              ? { scale: 1, rotate: 0 }
              : { scale: [1, 1.22, 0.96, 1], rotate: [0, -8, 4, 0] }
          }
          transition={iconTransition}
          aria-hidden="true"
        >
          {leading}
        </motion.span>
      ) : null}
      <span className="mui-chip__label">{children}</span>
    </motion.button>
  );
}
