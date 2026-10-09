import { createFileRoute } from "@tanstack/react-router";
import { getRates } from "@/lib/fx.server";
import { apiJson, enforceLimit, upstreamFailure } from "@/lib/guard.server";

async function handle({ request }: { request: Request }): Promise<Response> {
  const limited = enforceLimit(request, "rates");
  if (limited) return limited;
  try {
    return apiJson(await getRates(), 200, "public, max-age=30");
  } catch (error) {
    return upstreamFailure(error, "No se pudieron leer las cotizaciones en este momento.");
  }
}

export const Route = createFileRoute("/api/rates")({
  server: { handlers: { GET: handle } },
});
