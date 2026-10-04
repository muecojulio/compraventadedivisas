import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { PRESS_SPRING, SOFT_SPRING, cx } from "./springs";
import { useMotionOff, useSpringTransition } from "./use-spring";

export type MotionTabItem<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
};

export type MotionTabsProps<T extends string> = {
  items: readonly MotionTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  idPrefix: string;
  panelId?: string;
  layoutId?: string;
  className?: string;
};

/**
 * Pestañas con píldora líquida: la pastilla verde viaja de una pestaña a otra
 * con física de resorte en lugar de aparecer de golpe.
 */
export function MotionTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  idPrefix,
  panelId,
  layoutId,
  className,
}: MotionTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionOff();
  const pressTransition = useSpringTransition(PRESS_SPRING);
  const pillTransition = useSpringTransition(SOFT_SPRING);
  const pillId = layoutId ?? `${idPrefix}-tab-pill`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const count = items.length;
    if (count === 0) return;
    const current = Math.max(
      0,
      items.findIndex((item) => item.id === value),
    );
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % count;
    else if (event.key === "ArrowLeft") next = (current - 1 + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else return;
    event.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    buttons?.[next]?.focus();
  }

  return (
    <div
      ref={listRef}
      className={cx("mui-tablist", className)}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <motion.button
            key={item.id}
            type="button"
            id={`${idPrefix}-tab-${item.id}`}
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cx("mui-tab", selected && "is-selected")}
            whileHover={reduced ? undefined : { y: -1 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={pressTransition}
          >
            {selected ? (
              <motion.span
                layoutId={pillId}
                className="mui-tab__pill"
                transition={pillTransition}
                aria-hidden="true"
              />
            ) : null}
            {item.icon ? (
              <span className="mui-tab__icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
