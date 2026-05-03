const { contextBridge, ipcRenderer } = require('electron');

const DEFAULT_REMOTE_API_BASE = 'https://barpos.omadapos.com';

function normalizeApiBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
}

/**
 * Origen del API (sin /api). Por defecto producción Omada.
 * Prioridad: API_URL al lanzar el .exe → VITE_API_URL en el proceso → remoto.
 */
const apiBaseUrl = normalizeApiBaseUrl(
  process.env.API_URL || process.env.VITE_API_URL || DEFAULT_REMOTE_API_BASE
);

/**
 * Evita promesas rechazadas en el renderer por fallos de IPC (p. ej. "Error invoking remote method").
 */
async function safeThermalPrint(data) {
  const fail = (error) => ({ ok: /** @type {const} */ (false), error });
  try {
    if (
      !data ||
      typeof data !== 'object' ||
      !data.config ||
      !data.payload ||
      typeof data.config !== 'object' ||
      typeof data.payload !== 'object'
    ) {
      return fail('Datos de impresión incompletos.');
    }
    let plain;
    try {
      plain = JSON.parse(JSON.stringify(data));
    } catch {
      return fail('Datos del ticket no se pueden serializar para impresión.');
    }
    const result = await ipcRenderer.invoke('thermal-print', plain);
    if (result && typeof result === 'object' && 'ok' in result) {
      return result;
    }
    return { ok: true };
  } catch (e) {
    const m = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
    if (m.includes('No handler registered')) {
      return fail(
        'Impresión no disponible: use la app de escritorio Bar POS (.exe), no solo el navegador, y reinicie si acaba de actualizar.'
      );
    }
    if (m.includes('could not be cloned')) {
      return fail('No se pudieron enviar los datos del ticket al proceso de impresión.');
    }
    return fail(m);
  }
}

async function safeInvokeArray(channel) {
  try {
    const out = await ipcRenderer.invoke(channel);
    return Array.isArray(out) ? out : [];
  } catch {
    return [];
  }
}

contextBridge.exposeInMainWorld('electronEnv', {
  NODE_ENV: process.env.NODE_ENV ?? 'production',
  isElectron: true,
  apiBaseUrl,
  closeWindow: () => ipcRenderer.send('app-close'),
  printThermalReceipt: (data) => safeThermalPrint(data),
  listThermalPrinters: () => safeInvokeArray('printers:list'),
  listComPorts: () => safeInvokeArray('com-ports:list'),
});
