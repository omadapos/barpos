const { execFile } = require('child_process');
const { promisify } = require('util');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  printThermalReceipt,
  printThermalReport,
  formatThermalPrintError,
} = require('./print-ticket');

const execFileAsync = promisify(execFile);

/** Puertos COM en Windows (USB–serie, cable adaptador, etc.). */
async function listWindowsComPorts() {
  if (process.platform !== 'win32') return [];
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        'Get-CimInstance Win32_SerialPort | Select-Object -ExpandProperty DeviceID',
      ],
      { timeout: 12000, windowsHide: true, maxBuffer: 1024 * 1024 },
    );
    const ports = stdout
      .split(/\r?\n/)
      .map((l) => l.trim().toUpperCase())
      .filter((l) => /^COM\d+$/i.test(l));
    const unique = [...new Set(ports)];
    unique.sort((a, b) => {
      const na = parseInt(String(a).replace(/^COM/i, ''), 10);
      const nb = parseInt(String(b).replace(/^COM/i, ''), 10);
      return na - nb;
    });
    return unique;
  } catch {
    return [];
  }
}

/** Ventana principal (para listar impresoras del sistema). */
let mainWindow = null;

ipcMain.on('app-close', () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.close();
});

ipcMain.handle('thermal-print', async (_evt, data) => {
  try {
    const body = data && typeof data === 'object' ? data : {};
    const { config: cfgIn, payload: payIn } = body;
    if (!cfgIn || !payIn || typeof cfgIn !== 'object' || typeof payIn !== 'object') {
      return { ok: false, error: 'Faltan datos de impresión (config o ticket).' };
    }
    const config = JSON.parse(JSON.stringify(cfgIn));
    const payload = JSON.parse(JSON.stringify(payIn));
    if (payload.documentKind === 'report') {
      await printThermalReport(config, payload);
    } else {
      await printThermalReceipt(config, payload);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatThermalPrintError(e) };
  }
});

ipcMain.handle('printers:list', async () => {
  const w =
    mainWindow && !mainWindow.isDestroyed()
      ? mainWindow
      : BrowserWindow.getFocusedWindow();
  if (!w || w.isDestroyed()) return [];
  try {
    return await w.webContents.getPrintersAsync();
  } catch {
    return [];
  }
});

ipcMain.handle('com-ports:list', async () => listWindowsComPorts());

function createWindow() {
  const win = new BrowserWindow({
    title: 'Bar POS',
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: true,
    frame: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      /**
       * Necesario para llamar a https://barpos.omadapos.com desde `file://` (build de producción).
       * Sin esto Chromium suele bloquear XHR/fetch aunque el backend envíe CORS.
       */
      webSecurity: false,
    },
    show: false,
  });

  mainWindow = win;

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['debug', 'info', 'warning', 'error'];
    const label = levels[level] || String(level);
    console.log(`[renderer:${label}] ${message} (${sourceId}:${line})`);
  });

  win.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });

  win.once('ready-to-show', () => {
    console.log('Main window ready to show');
    win.show();
  });

  const devUrl =
    process.env.VITE_DEV_SERVER_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : null);
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('Activating and creating window');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    console.log('Quitting app');
    app.quit();
  }
});
