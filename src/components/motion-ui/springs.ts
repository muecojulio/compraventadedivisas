/**
 * Resortes compartidos por todo el kit `motion-ui`. Son los valores del antiguo
 * laboratorio de microinteracciones, ahora al servicio de la interfaz real:
 * botones, pestañas, menús de selección y barras.
 */

export type MotionSpring = {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
};

export type MotionTransition = MotionSpring | { duration: number };

/** Rebote vivo: iconos, chips, interruptores. */
export const BOUNCY_SPRING: MotionSpring = {
  type: "spring",
  stiffness: 520,
  damping: 17,
  mass: 0.55,
};

/** Apertura suave: acordeones, paneles, mapas. */
export const SOFT_SPRING: MotionSpring = {
  type: "spring",
  stiffness: 340,
  damping: 29,
  mass: 0.8,
};

/** Pulsaciones con peso mecánico: botones y pestañas. */
export const PRESS_SPRING: MotionSpring = {
  type: "spring",
  stiffness: 600,
  damping: 34,
  mass: 0.55,
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
