import { securityHeaders } from "../../scripts/security-headers.mjs";

type NodeRes = {
  headersSent?: boolean;
  setHeader?: (key: string, value: string) => void;
};

/**
 * Encabezados en el build de Nitro. En desarrollo los pone el plugin de Vite,
 * para que la vista previa y el despliegue no diverjan.
 */
export default async function securityHeadersMiddleware(
  event: { node?: { res?: NodeRes } },
  next: () => unknown,
): Promise<unknown> {
  const headers = securityHeaders({ dev: process.env.NODE_ENV !== "production" });
  const nodeRes = event.node?.res;
  if (nodeRes && !nodeRes.headersSent && nodeRes.setHeader) {
    for (const [key, value] of Object.entries(headers)) {
      try {
        nodeRes.setHeader(key, value);
      } catch {
        // La respuesta ya empezó a salir.
      }
    }
  }

  const result = await next();
  if (!(result instanceof Response)) return result;

  const merged = new Headers(result.headers);
  for (const [key, value] of Object.entries(headers)) {
    if (!merged.has(key)) merged.set(key, value);
  }
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: merged,
  });
}
