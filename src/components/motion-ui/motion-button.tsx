import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { BOUNCY_SPRING, PRESS_SPRING, cx, type MotionTransition } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionButtonTone = "primary" | "ink" | "accent" | "outline" | "quiet";
export type MotionButtonSize = "sm" | "md" | "lg";

type MotionSurface = {
  tone: MotionButtonTone;
  size: MotionButtonSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
  busy?: boolean;
  children?: ReactNode;
};

type SurfaceProps = Partial<MotionSurface> & { className?: string };

function motionClasses(surface: MotionSurface, extra?: string) {
  return cx(
    "mui-button",
    `mui-button--${surface.tone}`,
    `mui-button--${surface.size}`,
    surface.block && "mui-button--block",
    surface.busy && "is-busy",
    extra,
  );
}

const HOVER_LIFT = { y: -2 };
const PRESS_DEPTH = { y: 4, scale: 0.985 };

function ButtonContent(props: {
  surface: MotionSurface;
  pressCount: number;
  reduced: boolean;
  pressTransition: MotionTransition;
  iconTransition: MotionTransition;
}) {
  const { surface, pressCount, reduced, iconTransition } = props;
  const { leading, trailing, children, busy } = surface;
  if (leading === undefined || leading === null) {
    return (
      <span className="mui-button__label">
        {children}
        {trailing}
      </span>
    );
  }
  return (
    <>
      <motion.span
        key={busy ? "busy" : `press-${pressCount}`}
        className="mui-button__icon"
        initial={false}
        animate={
          reduced || busy || pressCount === 0
            ? { scale: 1, rotate: 0 }
            : { scale: [0.72, 1.26, 0.94, 1], rotate: [-16, 12, -4, 0] }
        }
        transition={iconTransition}
        aria-hidden="true"
      >
        {leading}
      </motion.span>
      <span className="mui-button__label">
        {children}
        {trailing}
      </span>
    </>
  );
}

export type MotionButtonProps = SurfaceProps &
  Omit<
    HTMLMotionProps<"button">,
    | "children"
    | "className"
    | "whileHover"
    | "whileTap"
    | "transition"
    | "type"
    | "tone"
    | "size"
    | "leading"
    | "trailing"
    | "block"
    | "busy"
  > & {
    type?: "button" | "submit" | "reset";
  };

/** Botón con recorrido real: se hunde y la sombra sólida se recoge como una tecla. */
export function MotionButton({
  children,
  className,
  disabled = false,
  tone = "outline",
  size = "md",
  leading,
  trailing,
  block,
  busy = false,
  type = "button",
  onClick,
  ...rest
}: MotionButtonProps) {
  const surface: MotionSurface = { tone, size, leading, trailing, block, busy, children };
  const reduced = useMotionOff();
  const pressTransition = useSpringTransition(PRESS_SPRING);
  const iconTransition = useSpringTransition(BOUNCY_SPRING);
  const [pressCount, setPressCount] = useState(0);
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setPressCount((count) => count + 1);
      onClick?.(event);
    },
    [onClick],
  );

  return (
    <motion.button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={motionClasses(surface, className)}
      whileHover={reduced ? undefined : HOVER_LIFT}
      whileTap={reduced ? undefined : PRESS_DEPTH}
      transition={pressTransition}
      onClick={handleClick}
    >
      <ButtonContent
        surface={surface}
        pressCount={pressCount}
        reduced={reduced}
        pressTransition={pressTransition}
        iconTransition={iconTransition}
      />
    </motion.button>
  );
}

export type MotionLinkProps = SurfaceProps &
  Omit<
    HTMLMotionProps<"a">,
    | "children"
    | "className"
    | "whileHover"
    | "whileTap"
    | "transition"
    | "tone"
    | "size"
    | "leading"
    | "trailing"
    | "block"
    | "busy"
  >;

/** Enlace con la misma tecla táctil que los botones. */
export function MotionLink({
  children,
  className,
  tone = "outline",
  size = "md",
  leading,
  trailing,
  block,
  onClick,
  ...rest
}: MotionLinkProps) {
  const surface: MotionSurface = { tone, size, leading, trailing, block, children };
  const reduced = useMotionOff();
  const pressTransition = useSpringTransition(PRESS_SPRING);
  const iconTransition = useSpringTransition(BOUNCY_SPRING);
  const [pressCount, setPressCount] = useState(0);
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      setPressCount((count) => count + 1);
      onClick?.(event);
    },
    [onClick],
  );

  return (
    <motion.a
      {...rest}
      className={motionClasses(surface, className)}
      whileHover={reduced ? undefined : HOVER_LIFT}
      whileTap={reduced ? undefined : PRESS_DEPTH}
      transition={pressTransition}
      onClick={handleClick}
    >
      <ButtonContent
        surface={surface}
        pressCount={pressCount}
        reduced={reduced}
        pressTransition={pressTransition}
        iconTransition={iconTransition}
      />
    </motion.a>
  );
}
