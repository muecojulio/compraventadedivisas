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

## Despliegue en Vercel

El proyecto usa Nitro con el preset de Vercel. El build de Vercel ejecuta
`npm run build` y genera `.vercel/output`; no depende de un directorio `dist`
ni de una conexión a la base de datos durante la compilación.

Si se configura `DATABASE_URL` y se habilita autenticación o datos persistentes,
las migraciones se pueden ejecutar por separado con:

```bash
npm run db:migrate
```
