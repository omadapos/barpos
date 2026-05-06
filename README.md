# Bar POS Client

Cliente de escritorio para Bar POS construido con Electron, React, Vite y TailwindCSS.

Este repo contiene solo la app cliente. El backend y la base de datos viven en el VPS remoto:

```text
https://barpos.omadapos.com
```

No se usa backend local ni proxy a `127.0.0.1:3001`.

## Desarrollo

```bash
cd bar-pos-client
npm install
npm run dev
```

La app abre el frontend local en `http://127.0.0.1:5173`, pero todas las llamadas API van al VPS remoto.

## Build

```bash
cd bar-pos-client
npm run build
```

El ejecutable se genera en `bar-pos-client/release/`.

## Configuracion

Variables principales:

```env
VITE_API_URL=https://barpos.omadapos.com
VITE_APP_KEY=7610df99-c33f-4e08-b989-554580302fc7
```

El `App Key` vincula el terminal POS con el restaurante configurado en el VPS. Tambien puede cambiarse desde el icono de engranaje en la pantalla de login.
