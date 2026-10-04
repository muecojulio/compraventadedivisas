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

La antigua pestaña **Microinteracciones** ya no existe: sus cinco patrones se
aplicaron directamente a los controles reales de la app. El kit vive en
`src/components/motion-ui` y no añade páginas nuevas:

| Patrón del laboratorio | Dónde se usa ahora |
| --- | --- |
| Física de resorte (`motion/react`) | Pestañas, chips de divisa/país/filtros, avisos y campos |
| Botón táctil 3D | Todos los botones y enlaces de acción (`MotionButton`, `MotionLink`, `MotionRouterLink`) |
| Toggle líquido con filtro SVG | Barras de estado «En vivo» y «Solo zona de aeropuerto» (`LiquidSwitch`) |
| Acordeón elástico | Secciones plegables: «De dónde sale el precio» y «Anota el tablero que viste» |
| Luz que sigue el cursor y barrido de confirmación | Tarjetas de divisas y de locales (`GlowCard`) |

```tsx
import {
  GlowCard,
  LiquidSwitch,
  MotionBar,
  MotionButton,
  MotionChip,
  MotionDisclosure,
  MotionField,
  MotionNotice,
  MotionTabs,
} from "@/components/motion-ui";
```

Extras del kit: `MotionTabs` desliza una píldora compartida entre pestañas con
teclado completo (izquierda/derecha, `Home`, `End`), `MotionChip` transfiere su
selección de un menú a otro con el mismo truco de `layoutId`, y `MotionBar`
muestra el ciclo de refresco del tipo de cambio (y el estado de carga del mapa).

Todo el movimiento respeta `prefers-reduced-motion`: los resortes se apagan y
queda el estado final, sin animaciones.

## Despliegue en Vercel

El proyecto usa Nitro con el preset de Vercel. El build de Vercel ejecuta
`npm run build` y genera `.vercel/output`; no depende de un directorio `dist`
ni de una conexión a la base de datos durante la compilación.

Si se configura `DATABASE_URL` y se habilita autenticación o datos persistentes,
las migraciones se pueden ejecutar por separado con:

```bash
npm run db:migrate
```
