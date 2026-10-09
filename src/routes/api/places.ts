import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiJson, enforceLimit, rejectIfCrossSite, upstreamFailure } from "@/lib/guard.server";
import { getPlaces } from "@/lib/places.server";

const schema = z.object({
  lat: z.coerce.number().finite().gte(-90).lte(90),
  lon: z.coerce.number().finite().gte(-180).lte(180),
});

async function handle({ request }: { request: Request }): Promise<Response> {
  const cross = rejectIfCrossSite(request);
  if (cross) return cross;
  const limited = enforceLimit(request, "places");
  if (limited) return limited;
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    lat: url.searchParams.get("lat"),
    lon: url.searchParams.get("lon"),
  });
  if (!parsed.success) {
    return apiJson({ error: "Coordenadas inválidas." }, 400, "no-store");
  }
  try {
    return apiJson(await getPlaces(parsed.data.lat, parsed.data.lon), 200, "private, max-age=60");
  } catch (error) {
    return upstreamFailure(error, "El mapa de OpenStreetMap no respondió. Intenta de nuevo en un momento.");
  }
}

export const Route = createFileRoute("/api/places")({
  server: { handlers: { GET: handle } },
});
