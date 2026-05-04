# Bar POS

Sistema de Punto de Venta (POS) diseñado específicamente para Bares y Restaurantes. Construido con una arquitectura moderna para soportar múltiples sucursales, impresión térmica directa y una experiencia de usuario rápida y fluida.

## 🏗 Arquitectura del Proyecto

Este repositorio es un **monorepo** que contiene dos partes principales:

- **`bar-pos-api/`**: El backend de la aplicación. Maneja la base de datos, la autenticación y la lógica de negocio central.
- **`bar-pos-client/`**: El frontend de la aplicación. Es una aplicación de escritorio basada en **Electron, React, Vite y TailwindCSS**.

> **Nota importante:** Anteriormente existía una versión antigua del frontend en la carpeta raíz `src/`. Dicha versión en JS puro ha sido eliminada y reemplazada por completo por la versión robusta en TypeScript alojada en `bar-pos-client/`.

## 🚀 Cómo empezar (Cliente Frontend)

Si deseas ejecutar o compilar la aplicación de escritorio para la tableta/caja:

### 1. Entorno de Desarrollo
Para arrancar la aplicación en modo desarrollo (con Hot-Reloading):

```bash
cd bar-pos-client
npm install
npm run dev
```

### 2. Compilar Producción (.exe)
Para generar el instalador de Windows (y el ejecutable portable):

```bash
cd bar-pos-client
npm run build
```

El resultado final (ejecutable) se generará dentro de la carpeta `bar-pos-client/release/`.

## ⚙️ Configuración Multi-Sucursal (App Key)

El sistema soporta múltiples sucursales (tenants) desde un mismo servidor centralizado. Para vincular una tableta física a una sucursal específica:

1. Abre la aplicación (en desarrollo o producción).
2. En la pantalla de Inicio de Sesión (donde pide el PIN), haz clic en el **ícono de engranaje (Configuración)** en la esquina superior derecha.
3. Ingresa el **App Key** (UUID o slug) de tu sucursal correspondiente y dale a Guardar.
4. Ingresa el PIN de acceso. ¡Listo! La tableta estará permanentemente vinculada a esa sucursal hasta que se decida cambiar.

## 🖨️ Impresión Térmica

Bar POS cuenta con integración nativa con impresoras térmicas EPSON/ESC POS (80mm o 58mm) a través de la red (TCP) o localmente.
- Se puede imprimir la cuenta previa.
- Se genera el ticket o recibo al cobrar.
- *Nota: La impresión térmica real solo funciona cuando la aplicación corre empaquetada como `.exe` en Electron, no desde el navegador.*
