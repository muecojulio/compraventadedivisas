export const BOUNCY_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 17,
  mass: 0.55,
};

export const SOFT_SPRING = {
  type: "spring" as const,
  stiffness: 340,
  damping: 29,
  mass: 0.8,
};

export const PRESS_SPRING = {
  type: "spring" as const,
  stiffness: 600,
  damping: 34,
  mass: 0.55,
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
