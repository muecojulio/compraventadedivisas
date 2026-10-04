import { useId, type ReactNode } from "react";
import { cx } from "./motion-utils";

type FeatureCardProps = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

export function FeatureCard({
  number,
  eyebrow,
  title,
  description,
  className,
  children,
}: FeatureCardProps) {
  const headingId = useId();

  return (
    <article className={cx("motion-card", className)} aria-labelledby={headingId}>
      <div className="motion-card__eyebrow">
        <span className="motion-card__index" aria-hidden="true">
          {number}
        </span>
        <span>{eyebrow}</span>
      </div>
      <h3 className="motion-card__title" id={headingId}>
        {title}
      </h3>
      <p className="motion-card__description">{description}</p>
      <div className="motion-card__body">{children}</div>
    </article>
  );
}
