import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { useCallback, type PointerEvent, type ReactNode } from "react";
import { SOFT_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type GlowCardProps = Omit<
  HTMLMotionProps<"article">,
  "className" | "children" | "whileHover" | "transition" | "onAnimationStart"
> & {
  children?: ReactNode;
  className?: string;
  /** Resalta el borde: la tarjeta está elegida. */
  active?: boolean;
  tone?: "primary" | "accent";
  /** Cambiar esta clave lanza un barrido de luz (p. ej. al refrescar datos). */
  sweepKey?: number;
  /** Retraso del entrada escalonada, en milisegundos. */
  enterDelay?: number;
};

/**
 * Tarjeta con luz que sigue el cursor y barrido de confirmación, el patrón del
 * antiguo escáner biométrico aplicado a las tarjetas reales del tablero.
 */
export function GlowCard({
  children,
  className,
  active = false,
  tone = "primary",
  sweepKey = 0,
  enterDelay = 0,
  style,
  onPointerMove,
  ...rest
}: GlowCardProps) {
  const reduced = useMotionOff();
  const transition = useSpringTransition(SOFT_SPRING);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const node = event.currentTarget;
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mui-mx", `${event.clientX - rect.left}px`);
      node.style.setProperty("--mui-my", `${event.clientY - rect.top}px`);
      onPointerMove?.(event);
    },
    [onPointerMove],
  );

  return (
    <motion.article
      {...rest}
      onPointerMove={reduced ? onPointerMove : handlePointerMove}
      className={cx("mui-card", tone === "accent" && "mui-card--accent", active && "is-active", className)}
      style={{ ...style, animationDelay: enterDelay ? `${enterDelay}ms` : undefined }}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={transition}
    >
      <AnimatePresence initial={false}>
        {sweepKey > 0 ? (
          <motion.span
            key={sweepKey}
            className="mui-sweep"
            initial={{ y: "-110%", opacity: 0 }}
            animate={reduced ? { opacity: [0, 0.6, 0] } : { y: "150%", opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0.3 } : { duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
      {children}
    </motion.article>
  );
}
