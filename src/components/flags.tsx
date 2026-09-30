import type { CurrencyCode } from "@/lib/domain";

type FlagProps = { code: "MX" | "US" | "JP" | "CA" | CurrencyCode; className?: string };

export function Flag({ code, className = "h-8 w-11" }: FlagProps) {
  const mapped = code === "USD" ? "US" : code === "JPY" ? "JP" : code === "CAD" ? "CA" : code;
  return (
    <svg viewBox="0 0 60 40" className={className} role="img" aria-label={mapped}>
      {mapped === "MX" ? <Mexico /> : null}
      {mapped === "US" ? <UnitedStates /> : null}
      {mapped === "JP" ? <Japan /> : null}
      {mapped === "CA" ? <Canada /> : null}
    </svg>
  );
}

function Mexico() {
  return (
    <>
      <rect width="20" height="40" fill="#006847" />
      <rect x="20" width="20" height="40" fill="#ffffff" />
      <rect x="40" width="20" height="40" fill="#ce1126" />
      <circle cx="30" cy="20" r="4.2" fill="none" stroke="#8d4f2b" strokeWidth="1.2" />
    </>
  );
}

function UnitedStates() {
  return (
    <>
      <rect width="60" height="40" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 40) / 13} width="60" height={40 / 13} fill="#ffffff" />
      ))}
      <rect width="26" height={(7 * 40) / 13} fill="#3c3b6e" />
    </>
  );
}

function Japan() {
  return (
    <>
      <rect width="60" height="40" fill="#ffffff" />
      <circle cx="30" cy="20" r="8" fill="#bc002d" />
    </>
  );
}

function Canada() {
  return (
    <>
      <rect width="60" height="40" fill="#ffffff" />
      <rect width="15" height="40" fill="#ff0000" />
      <rect x="45" width="15" height="40" fill="#ff0000" />
      <path d="M30 10 32.2 16.2 38.6 16.4 33.6 20.2 35.6 26.2 30 22.6 24.4 26.2 26.4 20.2 21.4 16.4 27.8 16.2Z" fill="#ff0000" />
    </>
  );
}
