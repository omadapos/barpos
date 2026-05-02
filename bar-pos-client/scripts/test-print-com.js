#!/usr/bin/env node
/**
 * Prueba de impresión térmica por puerto COM (USB serie en Windows).
 * Uso:
 *   npm run test:print-com6
 *   npm run test:print-com -- COM4
 */
'use strict';

const {
  printThermalReceipt,
  formatThermalPrintError,
} = require('../electron/print-ticket');

const comPort = (process.argv[2] || 'COM6').trim().toUpperCase();
if (!/^COM\d+$/i.test(comPort)) {
  console.error('Puerto inválido. Ejemplo: npm run test:print-com -- COM6');
  process.exit(1);
}

const config = {
  connection: 'com',
  comPort,
  driver: 'EPSON',
  width: 48,
};

const payload = {
  businessName: 'TEST USB',
  tableName: `PRUEBA ${comPort}`,
  orderId: 0,
  createdAt: new Date().toLocaleString('es-MX'),
  items: [{ name: 'Linea prueba Bar POS', qty: 1, unitPrice: 1, subtotal: 1 }],
  subtotal: 1,
  tax: 0,
  total: 1,
  paymentMethod: 'cash',
  notes: `Test script -> ${comPort}`,
};

(async () => {
  console.log(`Enviando ticket de prueba a ${comPort}...`);
  try {
    await printThermalReceipt(config, payload);
    console.log('OK: buffer enviado al puerto.');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', formatThermalPrintError(e));
    process.exit(1);
  }
})();
