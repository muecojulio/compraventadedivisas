import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, ChevronDown, Fingerprint, SlidersHorizontal } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { SOFT_SPRING } from "./motion-utils";

const SETTING_GROUPS = [
  {
    id: "market",
    title: "Alertas de mercado",
    hint: "2 preferencias",
    icon: Bell,
    items: [
      {
        title: "Movimientos mayores al 2 %",
        detail: "USD, JPY y CAD",
        checked: true,
      },
      {
        title: "Resumen semanal",
        detail: "Un repaso cada lunes",
        checked: false,
      },
    ],
  },
  {
    id: "security",
    title: "Seguridad de la cuenta",
    hint: "2 preferencias",
    icon: Fingerprint,
    items: [
      {
        title: "Confirmar antes de continuar",
        detail: "Pide una segunda revisión",
        checked: true,
      },
      {
        title: "Avisar de un nuevo dispositivo",
        detail: "Notificación en pantalla",
        checked: true,
      },
    ],
  },
  {
    id: "display",
    title: "Preferencias de visualización",
    hint: "2 preferencias",
    icon: SlidersHorizontal,
    items: [
      {
        title: "Mostrar cifras redondeadas",
        detail: "Formato breve en las tarjetas",
        checked: false,
      },
      {
        title: "Mantener mi divisa favorita",
        detail: "Disponible en este navegador",
        checked: true,
      },
    ],
  },
] as const;

export function ElasticSettingsAccordion() {
  const accordionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reducedMotion = useReducedMotion();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const spring = reducedMotion ? { duration: 0.16 } : SOFT_SPRING;

  return (
    <FeatureCard
      number="04"
      eyebrow="ELASTIC ACCORDION"
      title="Ajustes que se abren sin salto"
      description="La tarjeta crece con resorte y recoloca el contenido que queda debajo."
      className="motion-card--accordion"
    >
      <motion.div className="motion-accordion" layout transition={spring}>
        {SETTING_GROUPS.map((group) => {
          const expanded = openGroup === group.id;
          const Icon = group.icon;
          const triggerId = `${accordionId}-${group.id}-trigger`;
          const panelId = `${accordionId}-${group.id}-panel`;

          return (
            <motion.section
              className={"motion-accordion__item" + (expanded ? " is-expanded" : "")}
              key={group.id}
              layout
              transition={spring}
            >
              <button
                className="motion-accordion__trigger"
                type="button"
                id={triggerId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenGroup((current) => (current === group.id ? null : group.id))}
              >
                <span className="motion-accordion__icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <span className="motion-accordion__trigger-copy">
                  <strong>{group.title}</strong>
                  <span>{group.hint}</span>
                </span>
                <motion.span
                  className="motion-accordion__chevron"
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={spring}
                  aria-hidden="true"
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    className="motion-accordion__panel"
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                  >
                    <div className="motion-accordion__panel-inner">
                      {group.items.map((item) => (
                        <PreferenceRow
                          key={item.title}
                          title={item.title}
                          detail={item.detail}
                          checked={item.checked}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </motion.div>
      <p className="motion-accordion__footnote">
        Abre una sección para cambiar las preferencias de ejemplo.
      </p>
    </FeatureCard>
  );
}

type PreferenceRowProps = {
  title: string;
  detail: string;
  checked: boolean;
};

function PreferenceRow({ title, detail, checked }: PreferenceRowProps) {
  const inputId = useId();

  return (
    <label className="motion-preference" htmlFor={inputId}>
      <span className="motion-preference__copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </span>
      <input
        id={inputId}
        className="motion-preference__input"
        type="checkbox"
        role="switch"
        defaultChecked={checked}
      />
      <span className="motion-preference__switch" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}
