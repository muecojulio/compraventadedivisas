import type { ComponentType, MouseEventHandler } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { motion, type MotionProps } from "motion/react";
import { cx, PRESS_SPRING } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";
import type { MotionButtonSize, MotionButtonTone } from "./motion-button";
import { useCallback, useState, type MouseEvent, type ReactNode } from "react";

/**
 * El `Link` de TanStack sigue siendo un `<a>` del router; `motion.create` lo
 * convierte en un objetivo animable sin perder navegación client-side.
 */
/**
 * `motion.create` no propaga los props genéricos de `Link`, así que el envoltorio
 * se tipa a mano: cualquier prop de enlace + los de movimiento.
 */
type MotionRouterLinkComponentProps = Record<string, unknown> &
  MotionProps & {
    children?: ReactNode;
  };

const MotionLinkPrimitive = motion.create(Link) as unknown as ComponentType<MotionRouterLinkComponentProps>;

export type MotionRouterLinkProps = Omit<LinkProps, "children" | "onClick"> & {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children?: ReactNode;
  tone?: MotionButtonTone;
  size?: MotionButtonSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

/** Enlace interno de la app con la misma tecla táctil que los botones. */
export function MotionRouterLink({
  children,
  className,
  tone = "outline",
  size = "md",
  leading,
  trailing,
  onClick,
  ...linkProps
}: MotionRouterLinkProps) {
  const reduced = useMotionOff();
  const transition = useSpringTransition(PRESS_SPRING);
  const [pressed, setPressed] = useState(false);
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      setPressed(true);
      onClick?.(event);
    },
    [onClick],
  );

  return (
    <MotionLinkPrimitive
      {...linkProps}
      onClick={handleClick}
      className={cx(
        "mui-button",
        `mui-button--${tone}`,
        `mui-button--${size}`,
        pressed && "is-pressed",
        className,
      )}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { y: 4, scale: 0.985 }}
      transition={transition}
    >
      {leading ? (
        <span className="mui-button__icon" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <span className="mui-button__label">
        {children}
        {trailing}
      </span>
    </MotionLinkPrimitive>
  );
}
