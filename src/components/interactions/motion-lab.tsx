import { useState } from "react";
import { MotionConfig } from "motion/react";
import { Accessibility, ArrowDownRight, Layers3, MoveUpRight, Waves } from "lucide-react";
import { BiometricGlowCard } from "./biometric-glow-card";
import { ElasticSettingsAccordion } from "./elastic-settings-accordion";
import { FeatureCard } from "./feature-card";
import { LiquidMorphToggle } from "./liquid-morph-toggle";
import { SpringMicrointeractions } from "./spring-microinteractions";
import { Tactile3DButton } from "./tactile-3d-button";
import { cx } from "./motion-utils";

type MotionLabProps = {
  className?: string;
};

export function MotionLab({ className }: MotionLabProps) {
  return (
    <MotionConfig reducedMotion="user">
      <section className={cx("motion-lab", className)} aria-labelledby="motion-lab-title">
        <header className="motion-lab__hero">
          <div className="motion-lab__hero-copy">
            <div className="motion-lab__hero-kicker">
              <span className="motion-lab__hero-mark" aria-hidden="true">
                <Waves size={15} />
              </span>
              <span>LABORATORIO DE INTERACCIÓN</span>
              <span className="motion-lab__hero-version">EDICIÓN 01</span>
            </div>
            <h2 className="motion-lab__hero-title" id="motion-lab-title">
              Movimiento con
              <br />
              <em>intención.</em>
            </h2>
            <p className="motion-lab__hero-description">
              Cinco patrones de interfaz con resortes, volumen y luz. Toca cada muestra para
              sentirla.
            </p>
            <div className="motion-lab__hero-tags" aria-label="Características del laboratorio">
              <span>Física de resorte</span>
              <span>Sin acciones reales</span>
              <span>Accesible al movimiento</span>
            </div>
          </div>
          <div className="motion-lab__orbit" aria-hidden="true">
            <span className="motion-lab__orbit-ring motion-lab__orbit-ring--outer" />
            <span className="motion-lab__orbit-ring motion-lab__orbit-ring--middle" />
            <span className="motion-lab__orbit-ring motion-lab__orbit-ring--inner" />
            <span className="motion-lab__orbit-core">
              <MoveUpRight size={25} strokeWidth={1.4} />
            </span>
            <span className="motion-lab__orbit-dot motion-lab__orbit-dot--one" />
            <span className="motion-lab__orbit-dot motion-lab__orbit-dot--two" />
          </div>
        </header>

        <div className="motion-lab__section-heading">
          <div>
            <p className="motion-lab__section-kicker">PATRONES INTERACTIVOS</p>
            <h2>Elige una muestra</h2>
          </div>
          <p className="motion-lab__section-note">
            <Accessibility size={15} aria-hidden="true" />
            <span>Compatible con movimiento reducido</span>
          </p>
        </div>

        <div className="motion-lab__grid">
          <SpringMicrointeractions />
          <LiquidMorphToggle />
          <TactileDemo />
          <ElasticSettingsAccordion />
          <BiometricGlowCard />
        </div>

        <footer className="motion-lab__footer">
          <span className="motion-lab__footer-icon" aria-hidden="true">
            <Layers3 size={16} />
          </span>
          <p>
            Componentes separados y reutilizables: <code>motion/react</code> para los resortes y CSS
            para el acabado visual.
          </p>
          <span className="motion-lab__footer-count">05 INTERACCIONES</span>
        </footer>
      </section>
    </MotionConfig>
  );
}

function TactileDemo() {
  const [pressCount, setPressCount] = useState(0);

  return (
    <FeatureCard
      number="03"
      eyebrow="TACTILE 3D"
      title="Un botón con peso mecánico"
      description="El plano baja al tocarlo y la sombra sólida se recoge como una tecla real."
      className="motion-card--tactile"
    >
      <div className="tactile-demo">
        <div className="tactile-demo__stage">
          <Tactile3DButton onClick={() => setPressCount((count) => count + 1)}>
            Confirmar acción
          </Tactile3DButton>
        </div>
        <div className="tactile-demo__measure" aria-hidden="true">
          <span>RECORRIDO DEL BOTÓN</span>
          <strong>
            06 PX <ArrowDownRight size={14} />
          </strong>
        </div>
        <p className="tactile-demo__hint">Presiona o mantén pulsado para probar la profundidad.</p>
        <p className="tactile-demo__status" role="status" aria-live="polite">
          {pressCount === 0
            ? "Simulación local · sin cambios en una cuenta real"
            : `Prueba registrada · ${pressCount} ${pressCount === 1 ? "pulsación" : "pulsaciones"}`}
        </p>
      </div>
    </FeatureCard>
  );
}
