/**
 * Encabezados de documento y de API.
 * frame-ancestors queda abierto a propósito: la vista previa vive en un iframe.
 * No se usa X-Frame-Options DENY ni un CSP que bloquee https://grok.com.
 */

const GROK = "https://grok.com https://*.grok.com https://og.grok.me";

export function contentSecurityPolicy({ dev = false } = {}) {
  const connect = ["'self'", "https://grok.com", "https://*.grok.com", "https://og.grok.me"];
  if (dev) connect.push("ws:", "wss:", "http://127.0.0.1:8080", "http://localhost:8080");
  const script = ["'self'", "'unsafe-inline'", "https://grok.com", "https://*.grok.com"];
  if (dev) script.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://tile.openstreetmap.org https://grok.com https://*.grok.com https://og.grok.me",
    `connect-src ${connect.join(" ")}`,
    `frame-src 'self' ${GROK}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors *",
  ].join("; ");
}

export function securityHeaders({ dev = false } = {}) {
  return {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-dns-prefetch-control": "off",
    "permissions-policy": "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
    "content-security-policy": contentSecurityPolicy({ dev }),
  };
}
