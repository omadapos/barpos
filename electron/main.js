const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const db = require('./database');

const settingsStore = new Store({
  name: 'barpos-settings',
  defaults: { taxPercent: 0 },
});

let mainWindow;

function getTaxPercent() {
  const v = Number(settingsStore.get('taxPercent'));
  return Number.isFinite(v) ? v : 0;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f172a',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('settings:get', () => ({
    taxPercent: getTaxPercent(),
  }));

  ipcMain.handle('settings:set', (_e, data) => {
    if (data && typeof data.taxPercent === 'number') {
      settingsStore.set('taxPercent', Math.max(0, Math.min(100, data.taxPercent)));
    }
    return { taxPercent: getTaxPercent() };
  });

  ipcMain.handle('db:getTables', () => db.getTables());
  ipcMain.handle('db:createTable', (_e, data) => db.createTable(data));
  ipcMain.handle('db:updateTable', (_e, id, data) => db.updateTable(id, data));
  ipcMain.handle('db:toggleTable', (_e, id) => db.toggleTable(id));
  ipcMain.handle('db:deleteTable', (_e, id) => db.deleteTable(id));

  ipcMain.handle('db:getCategories', () => db.getCategories());
  ipcMain.handle('db:getProducts', (_e, categoryId) => db.getProducts(categoryId));
  ipcMain.handle('db:getMeasures', (_e, productId) => db.getMeasures(productId));

  ipcMain.handle('db:getOpenOrders', () => db.getOpenOrders());
  ipcMain.handle('db:getOrderByTable', (_e, tableId) => db.getOrderByTable(tableId));
  ipcMain.handle('db:getOrderById', (_e, orderId) => db.getOrderById(orderId));

  ipcMain.handle('db:createOrder', (_e, data) => db.createOrder(data, getTaxPercent()));
  ipcMain.handle('db:addOrderItem', (_e, orderId, item) =>
    db.addOrderItem(orderId, item, getTaxPercent())
  );
  ipcMain.handle('db:updateItemQuantity', (_e, itemId, qty) =>
    db.updateItemQuantity(itemId, qty, getTaxPercent())
  );
  ipcMain.handle('db:removeOrderItem', (_e, itemId) =>
    db.removeOrderItem(itemId, getTaxPercent())
  );
  ipcMain.handle('db:closeOrder', (_e, orderId, paymentMethod) =>
    db.closeOrder(orderId, paymentMethod, getTaxPercent())
  );
  ipcMain.handle('db:cancelOrder', (_e, orderId) => db.cancelOrder(orderId));

  ipcMain.handle('db:getReportSummary', (_e, from, to) =>
    db.getReportSummary(from, to)
  );
  ipcMain.handle('db:getReportByCategory', (_e, from, to) =>
    db.getReportByCategory(from, to)
  );
  ipcMain.handle('db:getReportProductsInCategory', (_e, from, to, category) =>
    db.getReportProductsInCategory(from, to, category)
  );
  ipcMain.handle('db:getReportByProduct', (_e, from, to, categoryFilter) =>
    db.getReportByProduct(from, to, categoryFilter)
  );
  ipcMain.handle('db:getReportByTable', (_e, from, to) =>
    db.getReportByTable(from, to)
  );

  ipcMain.handle('export:csv', async (_e, rows, suggestedName) => {
    if (!mainWindow) return { error: 'No window' };
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar CSV',
      defaultPath: suggestedName || 'reporte-barpos.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    try {
      fs.writeFileSync(filePath, rows, 'utf8');
      return { ok: true, path: filePath };
    } catch (err) {
      return { error: err.message };
    }
  });
}

app.whenReady().then(() => {
  db.initDatabase(app.getPath('userData'));
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
