import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PRESS_SPRING, SOFT_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionDisclosureProps = {
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  tone?: "primary" | "accent";
};

/**
 * Sección plegable elástica: la tarjeta crece con resorte y recoloca lo que
 * hay debajo, sin saltos.
 */
export function MotionDisclosure({
  title,
  hint,
  icon,
  defaultOpen = false,
  children,
  className,
  tone = "primary",
}: MotionDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useMotionOff();
  const spring = useSpringTransition(SOFT_SPRING);
  const press = useSpringTransition(PRESS_SPRING);

  return (
    <motion.section
      layout
      transition={spring}
      data-open={open ? "true" : "false"}
      className={cx("mui-disclosure", tone === "accent" && "mui-disclosure--accent", className)}
      aria-expanded={open}
    >
      <motion.button
        type="button"
        className="mui-disclosure__trigger"
        onClick={() => setOpen((value) => !value)}
        whileTap={reduced ? undefined : { scale: 0.99 }}
        transition={press}
      >
        {icon ? (
          <span className="mui-disclosure__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="mui-disclosure__copy">
          <span className="mui-disclosure__title">{title}</span>
          {hint ? <span className="mui-disclosure__hint">{hint}</span> : null}
        </span>
        <motion.span
          className="mui-disclosure__chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring}
          aria-hidden="true"
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            className="mui-disclosure__panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
          >
            <div className="mui-disclosure__panel-inner">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
