import { useReducedMotion } from "motion/react";
import type { MotionSpring, MotionTransition } from "./springs";

/**
 * Devuelve el resorte pedido, o un salto directo de 0 ms cuando el sistema del
 * usuario pide movimiento reducido: el estado final se ve igual, sin animación.
 * Todos los componentes del kit pasan por aquí para respetar
 * `prefers-reduced-motion`.
 */
export function useSpringTransition(spring: MotionSpring): MotionTransition {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? { duration: 0 } : spring;
}

/** `true` cuando hay que apagar el movimiento (hover, tap, barridos). */
export function useMotionOff() {
  return useReducedMotion() === true;
}
