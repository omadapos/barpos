const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTables: () => ipcRenderer.invoke('db:getTables'),
  createTable: (data) => ipcRenderer.invoke('db:createTable', data),
  updateTable: (id, data) => ipcRenderer.invoke('db:updateTable', id, data),
  toggleTable: (id) => ipcRenderer.invoke('db:toggleTable', id),
  deleteTable: (id) => ipcRenderer.invoke('db:deleteTable', id),

  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  getProducts: (categoryId) => ipcRenderer.invoke('db:getProducts', categoryId),
  getMeasures: (productId) => ipcRenderer.invoke('db:getMeasures', productId),

  getOpenOrders: () => ipcRenderer.invoke('db:getOpenOrders'),
  getOrderByTable: (tableId) => ipcRenderer.invoke('db:getOrderByTable', tableId),
  getOrderById: (orderId) => ipcRenderer.invoke('db:getOrderById', orderId),
  createOrder: (data) => ipcRenderer.invoke('db:createOrder', data),
  addOrderItem: (orderId, item) => ipcRenderer.invoke('db:addOrderItem', orderId, item),
  updateItemQuantity: (itemId, qty) => ipcRenderer.invoke('db:updateItemQuantity', itemId, qty),
  removeOrderItem: (itemId) => ipcRenderer.invoke('db:removeOrderItem', itemId),
  closeOrder: (orderId, paymentMethod) =>
    ipcRenderer.invoke('db:closeOrder', orderId, paymentMethod),
  cancelOrder: (orderId) => ipcRenderer.invoke('db:cancelOrder', orderId),

  getReportSummary: (from, to) => ipcRenderer.invoke('db:getReportSummary', from, to),
  getReportByCategory: (from, to) => ipcRenderer.invoke('db:getReportByCategory', from, to),
  getReportProductsInCategory: (from, to, category) =>
    ipcRenderer.invoke('db:getReportProductsInCategory', from, to, category),
  getReportByProduct: (from, to, categoryFilter) =>
    ipcRenderer.invoke('db:getReportByProduct', from, to, categoryFilter),
  getReportByTable: (from, to) => ipcRenderer.invoke('db:getReportByTable', from, to),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (data) => ipcRenderer.invoke('settings:set', data),

  exportCSV: (data, filename) => ipcRenderer.invoke('export:csv', data, filename),
});
