import { createFileRoute } from "@tanstack/react-router";
import { apiJson, enforceLimit, rejectIfCrossSite, upstreamFailure } from "@/lib/guard.server";
import { geocode } from "@/lib/places.server";

async function handle({ request }: { request: Request }): Promise<Response> {
  const cross = rejectIfCrossSite(request);
  if (cross) return cross;
  const limited = enforceLimit(request, "geocode");
  if (limited) return limited;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2 || q.length > 120) {
    return apiJson({ error: "Escribe un lugar de 2 a 120 caracteres." }, 400, "no-store");
  }
  try {
    const hits = await geocode(q);
    return apiJson({ hits }, 200, "private, max-age=60");
  } catch (error) {
    return upstreamFailure(error, "No se pudo buscar ese lugar.");
  }
}

export const Route = createFileRoute("/api/geocode")({
  server: { handlers: { GET: handle } },
});
