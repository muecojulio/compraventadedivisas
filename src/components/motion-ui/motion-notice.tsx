import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BOUNCY_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionNoticeProps = {
  tone?: "danger" | "success" | "info";
  title: ReactNode;
  children?: ReactNode;
  dismissible?: boolean;
  className?: string;
};

const ICONS = {
  danger: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

/**
 * Aviso con resorte: entra escalado, sale desvanecido y su icono hace un
 * pequeño rebote al aparecer. Sustituye los mensajes planos de error.
 */
export function MotionNotice({
  tone = "info",
  title,
  children,
  dismissible = true,
  className,
}: MotionNoticeProps) {
  const reduced = useMotionOff();
  const spring = useSpringTransition(BOUNCY_SPRING);
  const [open, setOpen] = useState(true);
  const Icon = ICONS[tone];
  const visible = open || !dismissible;

  return (
    <div className={cx("mui-notice-zone", className)}>
      <AnimatePresence initial={false} mode="wait">
        {visible ? (
          <motion.div
            key={`notice-${tone}`}
            className={cx("mui-notice", `mui-notice--${tone}`)}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={spring}
          >
            <motion.span
              className="mui-notice__icon"
              initial={reduced ? false : { scale: 0.5, rotate: -22 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={spring}
              aria-hidden="true"
            >
              <Icon size={15} strokeWidth={2.4} />
            </motion.span>
            <span className="mui-notice__copy">
              <strong>{title}</strong>
              {children ? <span>{children}</span> : null}
            </span>
            {dismissible ? (
              <motion.button
                type="button"
                className="mui-notice__close"
                aria-label="Cerrar aviso"
                onClick={() => setOpen(false)}
                whileHover={reduced ? undefined : { rotate: 90, scale: 1.08 }}
                whileTap={reduced ? undefined : { scale: 0.88 }}
                transition={spring}
              >
                <X size={15} aria-hidden="true" />
              </motion.button>
            ) : null}
          </motion.div>
        ) : (
          <motion.button
            key="restore"
            type="button"
            className="mui-notice__restore"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={spring}
          >
            <Info size={14} aria-hidden="true" />
            Volver a mostrar el aviso
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
