import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getPlaces } from "@/lib/places.server";

const schema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
});

async function handle({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    lat: url.searchParams.get("lat"),
    lon: url.searchParams.get("lon"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }
  try {
    const data = await getPlaces(parsed.data.lat, parsed.data.lon);
    return Response.json(data, {
      headers: {
        "cache-control": "public, max-age=120",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "El mapa de OpenStreetMap no respondió. Intenta de nuevo en un momento." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const Route = createFileRoute("/api/places")({
  server: { handlers: { GET: handle } },
});
