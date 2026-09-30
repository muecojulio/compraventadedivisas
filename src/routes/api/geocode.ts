import { createFileRoute } from "@tanstack/react-router";
import { geocode } from "@/lib/places.server";

async function handle({ request }: { request: Request }): Promise<Response> {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2 || q.length > 120) {
    return Response.json({ error: "Escribe un lugar de 2 a 120 caracteres." }, { status: 400 });
  }
  try {
    const hits = await geocode(q);
    return Response.json(
      { hits },
      { headers: { "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } },
    );
  } catch {
    return Response.json(
      { error: "No se pudo buscar ese lugar." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const Route = createFileRoute("/api/geocode")({
  server: { handlers: { GET: handle } },
});
