# CompraVenta de Divisas

Dólar, yen y dólar canadiense en pesos mexicanos.

- Cotizar: tipo de mercado y tablero de Banco Azteca.
- Cerca de mí: casas de cambio y Banco Azteca a 5 km.
- Aeropuertos: México, Estados Unidos, Japón y Canadá.

Sin cuentas. La ubicación solo se pide al pulsar Mi ubicación.

```bash
npm install
npm run dev
```

## Movimiento de la interfaz

La antigua pestaña **Microinteracciones** ya no existe: sus patrones se
aplicaron directamente a los controles reales. El kit vive en
`src/components/motion-ui` y no añade páginas nuevas:

| Patrón                              | Dónde se usa                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Física de resorte (`motion/react`)  | Pestañas, chips, selector, avisos y campos                                     |
| Botón táctil 3D                     | Botones y enlaces de acción (`MotionButton`, `MotionLink`, `MotionRouterLink`) |
| Toggle líquido con filtro SVG       | Barras «En vivo» y «Solo zona de aeropuerto» (`LiquidSwitch`)                  |
| Acordeón elástico                   | Secciones plegables de cotizaciones y locales (`MotionDisclosure`)             |
| Luz y barrido de confirmación       | Tarjetas de cotizaciones y locales (`GlowCard`)                                |
| Scroll horizontal nativo con _snap_ | Filtros, opciones y carrusel de cotizaciones (`MotionRail`)                    |
| Combobox con búsqueda               | Selector de aeropuerto (`MotionCombobox`)                                      |

`MotionTabs` conserva navegación con flechas, `Home` y `End`; centra la opción
activa cuando hace falta desplazar la fila. En móvil, las secciones también se
pueden cambiar deslizando el contenido. El gesto distingue movimiento
horizontal de vertical y no intercepta mapas, campos, carruseles ni controles.

Las cotizaciones y aeropuertos forman carruseles táctiles con una parte de la
siguiente tarjeta visible. Los filtros muestran un desvanecido y una indicación
de desplazamiento cuando hay más opciones. En las tarjetas de locales, deslizar
hacia la izquierda descubre accesos rápidos; el botón **«Desliza o toca para
acciones»** ofrece la misma acción sin depender del gesto. En pantallas grandes
los accesos quedan visibles en la tarjeta.

El combobox de aeropuertos admite búsqueda sin acentos, teclado (`↑`, `↓`,
`Home`, `End`, `Enter`, `Escape`) y selección con toque. Los botones pueden
mostrar estados de carga, éxito y error; las acciones de búsqueda y actualización
muestran su resultado. Los controles táctiles pequeños se ampliaron a un área
mínima aproximada de 44 px.

Todo el movimiento respeta `prefers-reduced-motion`; los gestos no son la única
forma de operar y se conservan alternativas de teclado/toque. Los estados de
foco siguen visibles y el _hover_ se reserva para dispositivos con puntero.

```tsx
import {
  GlowCard,
  LiquidSwitch,
  MotionBar,
  MotionButton,
  MotionChip,
  MotionCombobox,
  MotionDisclosure,
  MotionField,
  MotionNotice,
  MotionRail,
  MotionTabs,
} from "@/components/motion-ui";
```

## Despliegue en Vercel

El proyecto usa Nitro con el preset de Vercel. El build de Vercel ejecuta
`npm run build` y genera `.vercel/output`; no depende de un directorio `dist`
ni de una conexión a la base de datos durante la compilación.

Si se configura `DATABASE_URL` y se habilita autenticación o datos persistentes,
las migraciones se pueden ejecutar por separado con:

```bash
npm run db:migrate
```
