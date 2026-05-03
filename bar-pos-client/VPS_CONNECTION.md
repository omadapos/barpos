# Bar POS Client - conexion VPS

Esta rama deja el cliente Electron conectado al backend remoto por defecto:

```text
https://barpos.omadapos.com
```

La URL base siempre debe ir sin `/api`. Las rutas del cliente ya agregan `/api/...`.

## Desarrollo

Para levantar la app contra el VPS:

```bash
npm run dev:vps
```

Para levantar la app contra un backend local en `127.0.0.1:3001` usando proxy Vite:

```bash
npm run dev:local
```

## Build Electron

Para compilar el cliente de escritorio apuntando al VPS:

```bash
npm run build:vps
```

La app empaquetada tambien puede apuntar a otro backend sin recompilar si se lanza con `API_URL`:

```cmd
set API_URL=https://staging.ejemplo.com && BarPOS.exe
```

## Archivos clave

- `src/lib/apiBaseUrl.ts`: decide la URL del API en renderer.
- `electron/preload.js`: expone `window.electronEnv.apiBaseUrl` para Electron empaquetado.
- `src/api/client.ts`: agrega `baseURL` y `Authorization: Bearer ...` en cada request.
- `src/api/auth.api.ts`: login por PIN contra `POST /api/auth/login-pin`.
