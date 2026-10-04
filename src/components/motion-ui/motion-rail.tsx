import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "./springs";
import { useMotionOff } from "./use-spring";

type RailRole = "group" | "tablist";

type ScrollEdges = {
  left: boolean;
  right: boolean;
  overflow: boolean;
};

export type MotionRailProps = {
  children: ReactNode;
  ariaLabel: string;
  activeKey?: string | number | null;
  className?: string;
  frameClassName?: string;
  role?: RailRole;
  hint?: string;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
};

/**
 * Carril horizontal nativo: conserva el gesto de scroll del navegador, ajusta
 * el elemento seleccionado al centro y muestra bordes suaves cuando hay más.
 */
export function MotionRail({
  children,
  ariaLabel,
  activeKey,
  className,
  frameClassName,
  role = "group",
  hint,
  onKeyDown,
}: MotionRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionOff();
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false, overflow: false });

  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const next = {
      left: rail.scrollLeft > 2,
      right: rail.scrollLeft < maxScroll - 2,
      overflow: maxScroll > 2,
    };
    setEdges((current) =>
      current.left === next.left &&
      current.right === next.right &&
      current.overflow === next.overflow
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    syncEdges();
    rail.addEventListener("scroll", syncEdges, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncEdges);
    observer?.observe(rail);
    Array.from(rail.children).forEach((child) => observer?.observe(child));

    return () => {
      rail.removeEventListener("scroll", syncEdges);
      observer?.disconnect();
    };
  }, [children, syncEdges]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || activeKey === undefined || activeKey === null) return;
    if (rail.scrollWidth <= rail.clientWidth + 2) return;

    const selected = rail.querySelector<HTMLElement>(
      '[aria-selected="true"], [aria-pressed="true"], [data-rail-active="true"]',
    );
    if (!selected) return;

    const railRect = rail.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    const desiredLeft =
      rail.scrollLeft +
      selectedRect.left -
      railRect.left -
      (rail.clientWidth - selectedRect.width) / 2;

    rail.scrollTo({
      left: Math.max(0, Math.min(desiredLeft, rail.scrollWidth - rail.clientWidth)),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeKey, children, reduced]);

  return (
    <div
      className={cx("mui-rail-frame", frameClassName)}
      data-scroll-left={edges.left || undefined}
      data-scroll-right={edges.right || undefined}
      data-scrollable={edges.overflow || undefined}
    >
      <div
        ref={railRef}
        className={cx("mui-rail", className)}
        role={role}
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        data-horizontal-rail=""
      >
        {children}
      </div>
      {hint && edges.right ? (
        <span className="mui-rail__hint" aria-hidden="true">
          {hint}
          <ChevronRight size={13} strokeWidth={2.5} />
        </span>
      ) : null}
    </div>
  );
}
