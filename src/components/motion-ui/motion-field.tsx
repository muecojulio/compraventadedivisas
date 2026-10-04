import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { BOUNCY_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionFieldProps = {
  label: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  icon?: ReactNode;
  trailing?: ReactNode;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text" | "search" | "email" | "tel" | "url";
  size?: "md" | "sm";
  hideLabel?: boolean;
  autoComplete?: "on" | "off";
  onSubmit?: () => void;
  className?: string;
};

/**
 * Campo con respuesta elástica al foco: el icono crece y gira, la caja se
 * ilumina. El mismo gesto para todas las entradas de la app.
 */
export function MotionField({
  label,
  value,
  onValueChange,
  icon,
  trailing,
  placeholder,
  inputMode = "text",
  size = "md",
  hideLabel = false,
  autoComplete = "off",
  onSubmit,
  className,
}: MotionFieldProps) {
  const inputId = useId();
  const reduced = useMotionOff();
  const spring = useSpringTransition(BOUNCY_SPRING);
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") onSubmit?.();
  };

  return (
    <label className={cx("mui-field", size === "sm" && "mui-field--sm", className)} htmlFor={inputId}>
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="mui-field__label">{label}</span>
      )}
      <span className={cx("mui-field__box", focused && "is-focused")}>
        {icon ? (
          <motion.span
            className="mui-field__icon"
            animate={
              focused && !reduced
                ? { scale: 1.14, rotate: [0, -10, 8, 0], y: -1 }
                : { scale: 1, rotate: 0, y: 0 }
            }
            transition={spring}
            aria-hidden="true"
          >
            {icon}
          </motion.span>
        ) : null}
        <input
          id={inputId}
          className="mui-field__input"
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {trailing}
      </span>
    </label>
  );
}
