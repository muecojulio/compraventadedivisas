import { createFileRoute } from "@tanstack/react-router";
import { getRates } from "@/lib/fx.server";

async function handle(): Promise<Response> {
  try {
    const data = await getRates();
    return Response.json(data, {
      headers: {
        "cache-control": "public, max-age=30",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudieron leer las cotizaciones en este momento." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const Route = createFileRoute("/api/rates")({
  server: { handlers: { GET: handle } },
});
