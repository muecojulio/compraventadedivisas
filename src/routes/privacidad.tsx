import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({ component: Privacy });

function Privacy() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="press inline-flex h-11 items-center text-sm font-semibold text-primary">
          Volver
        </Link>
        <h1 className="mt-4 font-display text-4xl text-balance">Política de privacidad</h1>
        <div className="mt-6 space-y-4 text-pretty text-ink">
          <p>
            CompraVenta de Divisas no pide cuenta, no crea un perfil y no vende datos. Las cotizaciones y el mapa son información pública.
          </p>
          <h2 className="font-display text-2xl">Ubicación</h2>
          <p>
            La ubicación del teléfono solo se pide si tocas «Mi ubicación». Se usa en el momento para buscar locales a 5 km y no se guarda en una base de datos. Si escribes una dirección, esa búsqueda se envía a Nominatim (OpenStreetMap) para convertirla en coordenadas.
          </p>
          <h2 className="font-display text-2xl">Servicios externos</h2>
          <p>
            El tipo de mercado sale de Yahoo Finance, con respaldo en la API abierta de ExchangeRate-API y en el repositorio público fawazahmed0/currency-api. La ventanilla de Banco Azteca se lee de una página pública que recopila precios de bancos. Los locales salen de OpenStreetMap. Esas consultas pueden incluir la zona que estás mirando, no tu nombre.
          </p>
          <h2 className="font-display text-2xl">Caché</h2>
          <p>
            Las cotizaciones se recuerdan unos 45 segundos y los lugares unos 8 minutos, solo en memoria del servidor, para no repetir las mismas consultas. No hay índices de base de datos porque no hay base de datos de usuarios.
          </p>
          <h2 className="font-display text-2xl">Qué no es</h2>
          <p>
            No es un banco ni una casa de cambio. Los precios son de referencia. El de sucursal puede cambiar por horario y monto. No es asesoría financiera.
          </p>
        </div>
      </div>
    </main>
  );
}
