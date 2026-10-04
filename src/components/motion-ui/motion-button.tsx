import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
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
  feedback?: "success" | "error" | null;
  feedbackLabel?: string;
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
    surface.feedback && `is-${surface.feedback}`,
    extra,
  );
}

const HOVER_LIFT = { y: -2 };
const PRESS_DEPTH = { y: 4, scale: 0.985 };

function ButtonContent(props: {
  surface: MotionSurface;
  pressCount: number;
  reduced: boolean;
  iconTransition: MotionTransition;
}) {
  const { surface, pressCount, reduced, iconTransition } = props;
  const { leading, trailing, children, busy, feedback, feedbackLabel } = surface;
  const stateIcon = busy ? (
    <LoaderCircle className="size-4" />
  ) : feedback === "success" ? (
    <Check className="size-4" />
  ) : feedback === "error" ? (
    <AlertCircle className="size-4" />
  ) : (
    leading
  );

  return (
    <>
      {stateIcon !== undefined && stateIcon !== null ? (
        <motion.span
          key={`${busy ? "busy" : (feedback ?? "idle")}-${pressCount}`}
          className="mui-button__icon"
          initial={false}
          animate={
            reduced || busy
              ? { scale: 1, rotate: 0 }
              : feedback === "success"
                ? { scale: [0.72, 1.24, 0.96, 1], rotate: [-14, 10, -3, 0] }
                : feedback === "error"
                  ? { scale: [1, 0.88, 1.08, 1], rotate: [0, -9, 8, 0] }
                  : pressCount === 0
                    ? { scale: 1, rotate: 0 }
                    : { scale: [0.72, 1.26, 0.94, 1], rotate: [-16, 12, -4, 0] }
          }
          transition={iconTransition}
          aria-hidden="true"
        >
          {stateIcon}
        </motion.span>
      ) : null}
      <span className="mui-button__label">
        {children}
        {trailing}
      </span>
      {feedback ? (
        <span className="sr-only" role="status" aria-live="polite">
          {feedbackLabel ??
            (feedback === "success"
              ? "Operación completada."
              : "No se pudo completar la operación.")}
        </span>
      ) : null}
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
    | "feedback"
    | "feedbackLabel"
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
  feedback = null,
  feedbackLabel,
  type = "button",
  onClick,
  ...rest
}: MotionButtonProps) {
  const surface: MotionSurface = {
    tone,
    size,
    leading,
    trailing,
    block,
    busy,
    feedback,
    feedbackLabel,
    children,
  };
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
      data-feedback={feedback ?? "idle"}
      className={motionClasses(surface, className)}
      animate={feedback === "error" && !reduced ? { x: [0, -3, 3, -2, 0] } : { x: 0 }}
      whileHover={reduced ? undefined : HOVER_LIFT}
      whileTap={reduced ? undefined : PRESS_DEPTH}
      transition={feedback === "error" && !reduced ? { duration: 0.32 } : pressTransition}
      onClick={handleClick}
    >
      <ButtonContent
        surface={surface}
        pressCount={pressCount}
        reduced={reduced}
        iconTransition={iconTransition}
      />
    </motion.button>
  );
}

export type MotionLinkProps = Omit<SurfaceProps, "busy" | "feedback" | "feedbackLabel"> &
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
        iconTransition={iconTransition}
      />
    </motion.a>
  );
}
