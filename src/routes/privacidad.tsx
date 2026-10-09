import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MarketShell, PapelPicado } from "@/components/market-live";
import { MotionRouterLink } from "@/components/motion-ui";

export const Route = createFileRoute("/privacidad")({ component: Privacy });

function Privacy() {
  return (
    <MarketShell>
      <header className="floor-header">
        <PapelPicado />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <MotionRouterLink to="/" tone="quiet" size="sm" leading={<ArrowLeft className="size-4" aria-hidden="true" />}>
            Volver al piso
          </MotionRouterLink>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <article className="privacy-sheet">
          <p className="floor-kicker">CompraVenta de Divisas</p>
          <h1 className="floor-title">
            Política de <span>privacidad</span>
          </h1>
          <p className="privacy-date">Vigente desde el 9 de octubre de 2026</p>
          <p className="mt-4">
            Esta aplicación muestra tipos de cambio de referencia y locales públicos. No es un banco, no abre
            cuentas y no vende datos. Esta versión describe con precisión lo que hace el programa hoy.
          </p>

          <h2>Responsable</h2>
          <p>
            El responsable del tratamiento es quien opera esta aplicación. No hay un registro de usuarios al que
            escribir: la aplicación no pide nombre, correo ni teléfono propios. Los controles están en la propia
            pantalla y se explican abajo.
          </p>

          <h2>Qué no pedimos</h2>
          <ul>
            <li>No hay alta, inicio de sesión ni perfil de la aplicación.</li>
            <li>No hay publicidad ni venta de datos.</li>
            <li>No guardamos en una base de datos quién consultó qué.</li>
            <li>Las tipografías se sirven desde la propia aplicación. No se pide la fuente a Google.</li>
          </ul>

          <h2>Ubicación</h2>
          <p>
            El teléfono solo comparte ubicación si tocas «Mi ubicación». Esas coordenadas se usan en el momento
            para buscar locales a 5 km. Viajan a nuestro servidor y, desde ahí, a Nominatim (OpenStreetMap). No se
            atan a un nombre.
          </p>
          <p>
            El servidor recuerda el resultado unos 8 minutos, solo en memoria y con las coordenadas redondeadas a
            tres decimales (unos cien metros). Hay un tope de entradas: lo viejo se olvida. No es una base de datos
            de personas. Si no tocas el botón, no se pide la ubicación.
          </p>

          <h2>Direcciones que escribes</h2>
          <p>
            Si fijas un punto de partida, el texto se limpia y se envía a Nominatim para convertirlo en
            coordenadas. No se guarda. La respuesta no se ofrece a cachés compartidas: el encabezado pide que no se
            publique en una CDN. No escribas el domicilio de otra persona ni el de un menor.
          </p>

          <h2>Mapa</h2>
          <p>
            Las teselas las pide tu navegador directamente a tile.openstreetmap.org. OpenStreetMap ve la dirección
            IP y la zona que estás mirando. El enlace del mapa usa una política de referido que no manda la
            dirección completa de esta página. La atribución «© OpenStreetMap» permanece en el mapa.
          </p>

          <h2>Cómo llegar</h2>
          <p>
            «Cómo llegar» abre Google Maps con el destino del local, solo si tú lo pulsas. A partir de ahí aplica
            la privacidad de Google. El teléfono del local, si OpenStreetMap lo publica, se ofrece como enlace de
            llamada después de quitar caracteres que no sean de un número.
          </p>

          <h2>Cotizaciones y terceros</h2>
          <p>El servidor consulta únicamente estos sitios, con una lista cerrada. No sigue redirecciones hacia otros:</p>
          <ul>
            <li>Yahoo Finance, para el tipo de mercado y el trazo del día.</li>
            <li>ExchangeRate-API abierta y el repositorio público fawazahmed0/currency-api, solo si Yahoo no responde.</li>
            <li>dolarenmexico.com, para la ventanilla publicada de Banco Azteca.</li>
            <li>nominatim.openstreetmap.org, para locales y geocodificación.</li>
          </ul>
          <p>
            Esas consultas no incluyen tu nombre. Pueden incluir la zona del mapa o el texto del lugar que
            escribiste. Los sitios externos tienen sus propias políticas. Si ninguna fuente responde, la pantalla
            puede mostrar una referencia de muestra, marcada como tal. Esos números van en el programa, no se piden
            a un tercero, y no son una cotización para operar.
          </p>

          <h2>Memoria temporal</h2>
          <p>
            Las cotizaciones se recuerdan unos 45 segundos (o unos minutos si se usó el respaldo). Los lugares,
            unos 8 minutos. Todo vive en la memoria del proceso, con tope, y se pierde al reiniciar. No hay índices
            de una base de usuarios porque no hay base de usuarios.
          </p>

          <h2>Tu navegador</h2>
          <p>
            La comparación que anotas en una casa de cambio se queda en la pantalla y desaparece al salir. Esta
            aplicación no escribe una lista de favoritos ni una cookie propia de seguimiento. El reloj de los
            horarios de referencia se calcula en tu dispositivo.
          </p>

          <h2>Seguridad</h2>
          <ul>
            <li>Las consultas a cotizaciones, lugares y geocodificación tienen un límite por visitante y otro global.</li>
            <li>Un sitio ajeno no puede usar estas consultas como proxy: el navegador marca ese caso y se rechaza.</li>
            <li>Los enlaces que llegan de OpenStreetMap solo se muestran si son http o https públicos, sin credenciales.</li>
            <li>Los textos visibles se limpian de caracteres de control y de marcas que invierten la escritura.</li>
            <li>
              Las respuestas llevan encabezados para que el navegador no las interprete como otro tipo de archivo,
              para acotar el referido y para no pedir cámara, micrófono ni pagos. La ubicación solo se permite en
              esta misma página.
            </li>
          </ul>
          <p>
            La vista previa puede mostrarse dentro de otro marco. Por eso no se bloquea el embebido: no hay sesión
            que robar en esta aplicación.
          </p>

          <h2>Menores</h2>
          <p>
            La aplicación no está dirigida a menores. No pidas la ubicación de un niño ni escribas su domicilio.
          </p>

          <h2>Derechos</h2>
          <p>
            Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, los
            derechos de acceso, rectificación, cancelación y oposición se ejercen sobre datos que un responsable
            guarda y puede identificar. Aquí no hay un expediente a tu nombre. El control práctico es no compartir
            la ubicación, no escribir una dirección y cerrar la página. Si un local publicó tu teléfono en
            OpenStreetMap, la corrección se pide a OpenStreetMap, no a esta aplicación.
          </p>

          <h2>Cambios</h2>
          <p>
            Si el tratamiento cambia, esta página se actualiza y se indica la fecha. La versión anterior hablaba de
            caché y de fuentes, pero no del mapa en el navegador, de Google Maps, de las tipografías ni de los
            límites de consulta. Eso queda cubierto aquí.
          </p>

          <h2>Qué no es</h2>
          <p>
            No es un banco ni una casa de cambio. Los precios son de referencia. El de sucursal puede cambiar por
            horario y monto. No es asesoría financiera ni una oferta para operar.
          </p>
        </article>
      </main>
    </MarketShell>
  );
}
