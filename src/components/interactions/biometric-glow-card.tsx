import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeCheck, Fingerprint, ScanLine } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { BOUNCY_SPRING } from "./motion-utils";

type ScanStatus = "ready" | "scanning" | "verified";

export function BiometricGlowCard() {
  const reducedMotion = useReducedMotion();
  const [scanId, setScanId] = useState(0);
  const [status, setStatus] = useState<ScanStatus>("ready");
  const spring = reducedMotion ? { duration: 0.16 } : BOUNCY_SPRING;
  const scanTransition = reducedMotion
    ? { duration: 0.22 }
    : { duration: 1.35, ease: [0.22, 1, 0.36, 1] as const };

  const startScan = () => {
    setStatus("scanning");
    setScanId((current) => current + 1);
  };

  return (
    <FeatureCard
      number="05"
      eyebrow="BIOMETRIC GLOW"
      title="Un pulso de luz que revela"
      description="Un escáner translúcido recorre la tarjeta y confirma la interacción."
      className="motion-card--biometric"
    >
      <div className="biometric-demo">
        <div className="biometric-demo__display" aria-busy={status === "scanning"}>
          <span className="biometric-demo__corner biometric-demo__corner--tl" aria-hidden="true" />
          <span className="biometric-demo__corner biometric-demo__corner--tr" aria-hidden="true" />
          <span className="biometric-demo__corner biometric-demo__corner--bl" aria-hidden="true" />
          <span className="biometric-demo__corner biometric-demo__corner--br" aria-hidden="true" />
          <div className="biometric-demo__mesh" aria-hidden="true" />
          <motion.span
            className="biometric-demo__fingerprint"
            animate={status === "verified" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={spring}
            aria-hidden="true"
          >
            {status === "verified" ? (
              <BadgeCheck size={39} strokeWidth={1.35} />
            ) : (
              <Fingerprint size={42} strokeWidth={1.25} />
            )}
          </motion.span>
          <AnimatePresence initial={false}>
            {scanId > 0 ? (
              <motion.span
                className="biometric-demo__beam"
                key={scanId}
                initial={{ y: -16, opacity: 0 }}
                animate={
                  reducedMotion ? { y: 0, opacity: [0, 0.9, 0] } : { y: 154, opacity: [0, 1, 1, 0] }
                }
                transition={scanTransition}
                onAnimationComplete={() => setStatus("verified")}
                aria-hidden="true"
              />
            ) : null}
          </AnimatePresence>
          <div className="biometric-demo__display-label">
            <ScanLine size={13} aria-hidden="true" />
            <span>LECTOR BIOMÉTRICO · SIMULACIÓN</span>
          </div>
        </div>

        <div className="biometric-demo__status" role="status" aria-live="polite">
          <span className={"biometric-demo__status-dot is-" + status} aria-hidden="true" />
          <span>
            {status === "ready"
              ? "Esperando para escanear"
              : status === "scanning"
                ? "Leyendo patrón…"
                : "Verificación visual completada"}
          </span>
        </div>

        <motion.button
          className="biometric-demo__button"
          type="button"
          onClick={startScan}
          disabled={status === "scanning"}
          whileTap={reducedMotion || status === "scanning" ? undefined : { scale: 0.97 }}
          transition={spring}
        >
          <Fingerprint size={16} aria-hidden="true" />
          <span>
            {status === "scanning"
              ? "Escaneando…"
              : status === "verified"
                ? "Volver a escanear"
                : "Simular escaneo"}
          </span>
        </motion.button>
      </div>
    </FeatureCard>
  );
}
