import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BellRing,
  Check,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FeatureCard } from "./feature-card";
import { BOUNCY_SPRING } from "./motion-utils";

const ONBOARDING_STEPS = [
  {
    icon: Compass,
    title: "Elige tu divisa",
    copy: "Encuentra el par que quieres revisar.",
  },
  {
    icon: BellRing,
    title: "Sigue el mercado",
    copy: "Activa avisos para detectar cambios.",
  },
  {
    icon: ShieldCheck,
    title: "Compara con calma",
    copy: "Revisa la fuente antes de decidir.",
  },
];

export function SpringMicrointeractions() {
  const inputId = useId();
  const reducedMotion = useReducedMotion();
  const [bounceKey, setBounceKey] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const spring = reducedMotion ? { duration: 0.16 } : BOUNCY_SPRING;
  const currentStep = ONBOARDING_STEPS[step]!;
  const StepIcon = currentStep.icon;

  return (
    <FeatureCard
      number="01"
      eyebrow="SPRING PHYSICS"
      title="Pequeños gestos, respuesta viva"
      description="Resortes físicos para iconos, formularios y mensajes que acompañan la acción."
      className="motion-card--spring"
    >
      <div className="spring-demo__top-row">
        <button
          className="spring-demo__button"
          type="button"
          onClick={() => setBounceKey((key) => key + 1)}
        >
          <motion.span
            key={bounceKey}
            className="spring-demo__button-icon"
            initial={{ scale: 0.55, rotate: -32, y: 4 }}
            animate={{
              scale: [0.55, 1.28, 0.94, 1],
              rotate: [-32, 11, -5, 0],
              y: [4, -3, 1, 0],
            }}
            transition={spring}
            aria-hidden="true"
          >
            <Sparkles size={17} strokeWidth={2.2} />
          </motion.span>
          <span>Probar rebote</span>
          <ArrowRight className="spring-demo__button-arrow" size={15} aria-hidden="true" />
        </button>

        <label className="spring-demo__field" htmlFor={inputId}>
          <span className="spring-demo__field-label">Campo con respuesta al foco</span>
          <span className={"spring-demo__input-wrap" + (inputFocused ? " is-focused" : "")}>
            <motion.span
              className="spring-demo__search-icon"
              animate={
                inputFocused
                  ? { scale: 1.12, rotate: [0, -10, 8, 0], color: "#0e6b54" }
                  : { scale: 1, rotate: 0, color: "#5c6b64" }
              }
              transition={spring}
              aria-hidden="true"
            >
              <Search size={16} />
            </motion.span>
            <input
              id={inputId}
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Buscar una divisa"
              autoComplete="off"
            />
          </span>
        </label>
      </div>

      <div className="spring-demo__notice-zone">
        <AnimatePresence mode="wait" initial={false}>
          {noticeVisible ? (
            <motion.div
              key="notice"
              className="spring-demo__notice"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98 }}
              transition={spring}
            >
              <motion.span
                className="spring-demo__notice-icon"
                initial={{ scale: 0.5, rotate: -24 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring}
                aria-hidden="true"
              >
                <Check size={15} strokeWidth={2.8} />
              </motion.span>
              <span className="spring-demo__notice-copy">
                <strong>Listo para comparar</strong>
                <span>El precio se actualizó hace un momento.</span>
              </span>
              <button
                className="spring-demo__notice-close"
                type="button"
                aria-label="Cerrar aviso de ejemplo"
                onClick={() => setNoticeVisible(false)}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="restore"
              className="spring-demo__restore"
              type="button"
              onClick={() => setNoticeVisible(true)}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={spring}
            >
              <BellRing size={14} aria-hidden="true" />
              Mostrar aviso de nuevo
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="spring-onboarding">
        <div className="spring-onboarding__progress" aria-hidden="true">
          {ONBOARDING_STEPS.map((item, index) => (
            <span key={item.title} className={index <= step ? "is-current" : undefined} />
          ))}
        </div>
        <div className="spring-onboarding__content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="spring-onboarding__step"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98 }}
              transition={spring}
            >
              <motion.span
                className="spring-onboarding__icon"
                initial={{ scale: 0.62, rotate: -22 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring}
                aria-hidden="true"
              >
                <StepIcon size={17} />
              </motion.span>
              <span className="spring-onboarding__copy">
                <span className="spring-onboarding__step-count">
                  PASO {String(step + 1).padStart(2, "0")} / 03
                </span>
                <strong>{currentStep.title}</strong>
                <span>{currentStep.copy}</span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          className="spring-onboarding__next"
          type="button"
          onClick={() => setStep((current) => (current + 1) % ONBOARDING_STEPS.length)}
          aria-label={
            step === ONBOARDING_STEPS.length - 1 ? "Volver al primer paso" : "Siguiente paso"
          }
        >
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </FeatureCard>
  );
}
