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

## Laboratorio de microinteracciones

La pestaña **Microinteracciones** reúne cinco demostraciones listas para reutilizar: resortes,
toggle líquido con filtro SVG, botón táctil 3D, acordeón elástico y escáner biométrico.
Las exportaciones están agrupadas en `src/components/interactions`:

```tsx
import {
  BiometricGlowCard,
  ElasticSettingsAccordion,
  LiquidMorphToggle,
  MotionLab,
  SpringMicrointeractions,
  Tactile3DButton,
} from "@/components/interactions";
```

`MotionLab` es el showcase completo; los componentes individuales se pueden componer por separado.
El paquete `motion` aporta las transiciones de resorte y la hoja de estilos del barrel acompaña las
exportaciones visuales.

## Despliegue en Vercel

El proyecto usa Nitro con el preset de Vercel. El build de Vercel ejecuta
`npm run build` y genera `.vercel/output`; no depende de un directorio `dist`
ni de una conexión a la base de datos durante la compilación.

Si se configura `DATABASE_URL` y se habilita autenticación o datos persistentes,
las migraciones se pueden ejecutar por separado con:

```bash
npm run db:migrate
```
