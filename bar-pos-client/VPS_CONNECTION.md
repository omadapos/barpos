# Conexion Remota

La app usa un unico backend remoto:

```text
https://barpos.omadapos.com
```

No hay API local ni proxy de desarrollo a `127.0.0.1:3001`.

## Desarrollo

```bash
npm run dev
```

Vite sirve el frontend en `http://127.0.0.1:5173`, pero Axios llama al VPS configurado en `VITE_API_URL`.

## Build Electron

```bash
npm run build
```

La app empaquetada puede sobrescribir la URL remota con `API_URL` al lanzar el `.exe`, pero el valor por defecto sigue siendo el VPS.

## Archivos clave

- `src/lib/apiBaseUrl.ts`: resuelve la URL remota.
- `.env`: define `VITE_API_URL` y `VITE_APP_KEY`.
- `src/api/client.ts`: agrega `baseURL` y `Authorization: Bearer ...` en cada request.
- `src/api/auth.api.ts`: login por PIN contra `POST /api/auth/login-waiter-pin`.
