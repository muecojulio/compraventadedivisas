import type { ReactNode } from "react";
import { MotionLink } from "@/components/motion-ui";
import { safeHostname, safeHttpUrl, safeTelHref } from "@/lib/security";

type LinkBits = {
  className?: string;
  size?: "sm" | "md" | "lg";
  leading?: ReactNode;
  children?: ReactNode;
  label: string;
};

/** Enlace externo solo si la URL sobrevivió el filtro http(s) público. */
export function SafeSiteLink({ href, className, size = "md", leading, children, label }: LinkBits & { href: string | null }) {
  const safe = safeHttpUrl(href);
  const host = safeHostname(href);
  if (!safe || !host) return null;
  return (
    <MotionLink
      className={className}
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      size={size}
      leading={leading}
      aria-label={label}
    >
      {children ?? host}
    </MotionLink>
  );
}

export function SafeTelLink({
  phone,
  className,
  size = "md",
  leading,
  children,
  label,
}: LinkBits & { phone: string | null }) {
  const href = safeTelHref(phone);
  if (!href) return null;
  return (
    <MotionLink className={className} href={href} size={size} leading={leading} aria-label={label}>
      {children ?? "Llamar"}
    </MotionLink>
  );
}
