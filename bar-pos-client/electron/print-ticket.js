/**
 * Ticket térmico 80 mm (ESC/POS) vía node-thermal-printer.
 * Conexiones: tcp://host:9100 (red) y \\.\COMx (USB cuando Windows asigna puerto serie).
 */
'use strict';

const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} = require('node-thermal-printer');

function mapDriver(d) {
  const u = String(d || 'EPSON').toUpperCase();
  if (u === 'STAR') return PrinterTypes.STAR;
  return PrinterTypes.EPSON;
}

/**
 * Texto del cuerpo del ticket más grande. ESC/POS no tiene “+2 pt”; el paso mínimo
 * suele ser altura ×2 con ancho ×1 (más legible sin partir líneas a la mitad).
 * @param {*} printer instancia ThermalPrinter
 * @param {string} driver EPSON | STAR
 */
function boostBodyFontSize(printer, driver) {
  const d = String(driver || 'EPSON').toUpperCase();
  printer.setTypeFontA();
  if (d === 'STAR') {
    printer.setTextDoubleHeight();
  } else {
    printer.append(Buffer.from([0x1d, 0x21, 0x10]));
  }
}

function money(n) {
  const x = Number(n) || 0;
  if (Number.isInteger(x)) {
    return `$${x.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
  }
  return `$${x.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrapTextToWidth(text, maxW) {
  const t = String(text || '').trim();
  if (!t) return [];
  const words = t.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const tryLine = line ? `${line} ${word}` : word;
    if (tryLine.length <= maxW) {
      line = tryLine;
    } else {
      if (line) lines.push(line);
      line = word.length > maxW ? word.slice(0, maxW) : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function printlnWrapped(printer, text, maxW) {
  for (const ln of wrapTextToWidth(text, maxW)) {
    printer.println(ln);
  }
}

function resolveInterface(config) {
  const conn = config.connection || 'tcp';
  if (conn === 'com') {
    let com = String(config.comPort || 'COM3').trim().toUpperCase();
    com = com.replace(/^\\\\\.\\/i, '');
    if (!/^COM\d+$/i.test(com)) {
      throw new Error('Puerto COM inválido (use COM3, COM4, etc.).');
    }
    return `\\\\.\\${com}`;
  }
  const host = String(config.tcpHost || '').trim();
  if (!host) {
    throw new Error('Indica la IP o host de la impresora (TCP).');
  }
  const port = Number(config.tcpPort) || 9100;
  return `tcp://${host}:${port}`;
}

/**
 * Mensaje legible para el usuario (renderer / toast).
 * @param {unknown} err
 */
function formatThermalPrintError(err) {
  if (err == null) return 'Error de impresión desconocido.';
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? /** @type {{ code?: string }} */ (err).code
      : undefined;
  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : String(err);
  const msg = raw.toLowerCase();

  if (code === 'ECONNREFUSED' || msg.includes('econnrefused')) {
    return 'No se pudo conectar por red (TCP). Revise la IP de la impresora y el puerto 9100.';
  }
  if (
    code === 'ETIMEDOUT' ||
    msg.includes('socket timeout') ||
    (msg.includes('timeout') && !msg.includes('handshake'))
  ) {
    return 'Tiempo de espera: la impresora no respondió. Revise red, IP o USB/COM.';
  }
  if (code === 'ENOTFOUND') {
    return 'No se encontró el equipo en la red (IP o nombre incorrectos).';
  }
  if (code === 'EHOSTUNREACH') {
    return 'No hay ruta hasta la impresora en la red.';
  }
  if (code === 'ENOENT' || msg.includes('enoent')) {
    return 'No se pudo abrir el puerto COM. Compruebe el número (COM3…) y que exista en el Administrador de dispositivos.';
  }
  if (
    code === 'EBUSY' ||
    code === 'EACCES' ||
    msg.includes('eacces') ||
    msg.includes('access denied') ||
    msg.includes('denied')
  ) {
    return 'Puerto COM ocupado o sin permiso. Cierre el software del fabricante u otra app que use la impresora.';
  }
  if (raw === 'Printer Error' || msg.includes('printer error')) {
    return 'La impresora por USB (COM) no respondió. Puerto incorrecto, ocupado o cable suelto; pruebe otro COM.';
  }
  return raw;
}

function createPrinter(config) {
  const width = Math.min(56, Math.max(32, Number(config.width) || 48));
  const iface = resolveInterface(config);

  const init = {
    type: mapDriver(config.driver),
    width,
    interface: iface,
    characterSet: CharacterSet.PC852_LATIN2,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    breakLine: BreakLine.WORD,
    options: { timeout: 25000 },
  };

  if (typeof iface === 'string' && iface.startsWith('printer:')) {
    try {
      init.driver = require('printer');
    } catch {
      throw new Error(
        'La impresora por nombre de Windows requiere el módulo "printer". Usa TCP o COM.'
      );
    }
  }

  return new ThermalPrinter(init);
}

/**
 * @param {object} config - connection, tcpHost, tcpPort, comPort, driver, width
 * @param {object} payload - ticket data
 */
async function printThermalReceipt(config, payload) {
  const printer = createPrinter(config);
  const lineW = Math.min(56, Math.max(32, Number(config.width) || 48));
  const isPrebill = payload.documentKind === 'prebill';
  const driverName = String(config.driver || 'EPSON').toUpperCase();

  printer.setTypeFontA();
  printer.alignCenter();
  const bizName = String(payload.businessName || 'nfarra2').trim() || 'nfarra2';
  printer.bold(true);
  if (bizName.length <= 22) {
    printer.setTextDoubleHeight();
    printer.println(bizName.slice(0, 24));
    printer.setTextNormal();
  } else {
    printlnWrapped(printer, bizName, lineW);
  }
  printer.bold(false);
  if (payload.businessAddress) {
    printlnWrapped(printer, String(payload.businessAddress), lineW);
  }
  if (payload.businessPhone) {
    printer.println(`Tel: ${String(payload.businessPhone).slice(0, 24)}`);
  }
  printer.newLine();

  boostBodyFontSize(printer, driverName);

  printer.bold(true);
  printer.println(isPrebill ? 'PRECUENTA' : 'TICKET DE COBRO');
  printer.bold(false);
  if (isPrebill) {
    printer.println('(No comprobante de pago)');
  }
  printer.drawLine();

  printer.alignLeft();
  printer.bold(true);
  printer.println(`Mesa / ticket: ${payload.tableName || '—'}`);
  printer.bold(false);
  printer.println(`Orden #${payload.orderId}`);
  if (payload.createdAt) {
    printer.println(`Fecha: ${payload.createdAt}`);
  }
  printer.newLine();

  printer.drawLine();
  printer.bold(true);
  printer.leftRight('Cant. Artículo', 'Importe');
  printer.bold(false);
  printer.drawLine();

  const items = Array.isArray(payload.items) ? payload.items : [];
  for (const it of items) {
    const name = String(it.name || '').slice(0, 28);
    const line = `${it.qty}× ${name}`;
    const sub = money(it.subtotal);
    printer.leftRight(line, sub);
    if (it.measure) {
      printer.println(`   (${it.measure})`);
    }
  }

  const tipAmt = Number(payload.tipAmount) || 0;
  const tipPctShown = Number(payload.tipPercent);
  const tipPctLabel = Number.isFinite(tipPctShown) && tipPctShown > 0 ? tipPctShown : 18;
  if (tipAmt > 0) {
    printer.leftRight(`1x Propina (${tipPctLabel}%)`, money(tipAmt));
  }
  printer.drawLine();
  printer.leftRight('Subtotal', money(payload.subtotal));
  if (Number(payload.tax) > 0) {
    printer.leftRight('Impuesto', money(payload.tax));
  }

  const baseTot = Number(payload.total) || 0;
  const grand =
    Number(payload.grandTotal) || baseTot + tipAmt;
  const hasTip = tipAmt > 0;
  const includesTip = payload.includesTip === true;

  if (hasTip) {
    printer.bold(true);
    printer.leftRight(isPrebill ? 'A PAGAR' : 'TOTAL A PAGAR', money(grand));
    printer.bold(false);
  } else {
    printer.bold(true);
    printer.leftRight(isPrebill ? 'TOTAL (pendiente)' : 'TOTAL', money(baseTot));
    printer.bold(false);
  }

  printer.newLine();
  printer.alignCenter();
  if (includesTip && hasTip) {
    printer.println(`*** INCLUYE PROPINA ${tipPctLabel}% ***`);
  }
  printer.alignLeft();

  if (!isPrebill) {
    const pay =
      payload.paymentMethod === 'card'
        ? 'Tarjeta'
        : payload.paymentMethod === 'cash'
          ? 'Efectivo'
          : String(payload.paymentMethod || '—');
    printer.println(`Pago: ${pay}`);
  }

  if (payload.notes) {
    printer.newLine();
    printer.println('Nota:');
    printer.println(String(payload.notes).slice(0, 200));
  }

  printer.newLine();
  printer.alignCenter();
  const thanks = String(payload.footerThanks || '¡Gracias por su visita!').trim();
  printlnWrapped(printer, thanks, lineW);
  printer.newLine();
  printer.newLine();

  printer.setTextNormal();
  printer.bold(false);

  try {
    printer.partialCut();
  } catch {
    try {
      printer.cut();
    } catch {
      /* sin cortador */
    }
  }

  if (!isPrebill && payload.paymentMethod === 'cash') {
    try {
      printer.openCashDrawer();
    } catch {
      /* sin cajon */
    }
  }

  await printer.execute();
}

/**
 * Comanda por estacion (barra/cocina). No imprime totales ni abre cajon.
 * @param {object} config - connection, tcpHost, tcpPort, comPort, driver, width
 * @param {object} payload - documentKind: 'station', stationName, tableName, orderId, items
 */
async function printThermalStationOrder(config, payload) {
  const printer = createPrinter(config);
  const lineW = Math.min(56, Math.max(32, Number(config.width) || 48));
  const driverName = String(config.driver || 'EPSON').toUpperCase();
  const stationName = String(payload.stationName || payload.station || 'COMANDA').trim();

  printer.setTypeFontA();
  printer.alignCenter();
  printer.bold(true);
  printer.setTextDoubleHeight();
  printlnWrapped(printer, stationName.toUpperCase(), lineW);
  printer.setTextNormal();
  printer.bold(false);
  printer.println('COMANDA');
  printer.drawLine();

  boostBodyFontSize(printer, driverName);
  printer.alignLeft();
  printer.bold(true);
  printer.println(`Mesa: ${payload.tableName || '-'}`);
  printer.bold(false);
  printer.println(`Orden #${payload.orderId || '-'}`);
  if (payload.createdAt) {
    printer.println(`Hora: ${payload.createdAt}`);
  }
  printer.drawLine();

  const items = Array.isArray(payload.items) ? payload.items : [];
  for (const it of items) {
    const qty = Number(it.qty || it.quantity || 1);
    const name = String(it.name || it.productName || '').trim();
    printer.bold(true);
    printlnWrapped(printer, `${qty} x ${name}`, lineW);
    printer.bold(false);
    if (it.measure) {
      printlnWrapped(printer, `   ${String(it.measure)}`, lineW);
    }
    if (it.notes) {
      printlnWrapped(printer, `   Nota: ${String(it.notes)}`, lineW);
    }
    printer.newLine();
  }

  if (items.length === 0) {
    printer.println('Sin items para imprimir');
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println('*** PRODUCCION ***');
  printer.newLine();
  printer.newLine();

  printer.setTextNormal();
  printer.bold(false);

  try {
    printer.partialCut();
  } catch {
    try {
      printer.cut();
    } catch {
      /* sin cortador */
    }
  }

  await printer.execute();
}

const MAX_REPORT_CATEGORIES = 18;
const MAX_REPORT_PRODUCTS = 22;
const MAX_REPORT_TABLES = 16;

function truncLabel(s, maxW) {
  const t = String(s || '').trim();
  if (!t) return '—';
  if (t.length <= maxW) return t;
  return `${t.slice(0, Math.max(1, maxW - 1))}…`;
}

/**
 * Resumen de ventas para impresora 80 mm (mismo transporte que el ticket).
 * @param {object} config
 * @param {object} payload - documentKind: 'report', business*, range*, summary, categories, products, tables
 */
async function printThermalReport(config, payload) {
  const printer = createPrinter(config);
  const lineW = Math.min(56, Math.max(32, Number(config.width) || 48));

  printer.setTypeFontA();
  printer.alignCenter();
  const bizName = String(payload.businessName || 'Bar POS').trim() || 'Bar POS';
  printer.bold(true);
  if (bizName.length <= 22) {
    printer.setTextDoubleHeight();
    printer.println(bizName.slice(0, 24));
    printer.setTextNormal();
  } else {
    printlnWrapped(printer, bizName, lineW);
  }
  printer.bold(false);
  if (payload.businessAddress) {
    printlnWrapped(printer, String(payload.businessAddress), lineW);
  }
  if (payload.businessPhone) {
    printer.println(`Tel: ${String(payload.businessPhone).slice(0, 24)}`);
  }
  printer.newLine();

  printer.bold(true);
  printer.println('REPORTE DE VENTAS');
  printer.bold(false);
  printer.drawLine();
  printer.alignLeft();
  printer.println(
    `Periodo: ${payload.rangeFrom || '—'} – ${payload.rangeTo || '—'}`
  );
  printer.newLine();

  const sum = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
  printer.bold(true);
  printer.println('RESUMEN');
  printer.bold(false);
  printer.leftRight('Ventas', money(sum.totalSales));
  printer.leftRight('Tickets', String(sum.totalTickets ?? '0'));
  printer.leftRight('Ticket prom.', money(sum.avgTicket));
  printer.println(`Pago frecuente: ${truncLabel(sum.topPaymentMethod, lineW - 18)}`);
  printer.newLine();

  const cats = Array.isArray(payload.categories) ? payload.categories : [];
  if (cats.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('POR CATEGORÍA');
    printer.bold(false);
    printer.drawLine();
    const slice = cats.slice(0, MAX_REPORT_CATEGORIES);
    for (const c of slice) {
      const name = truncLabel(c.name, Math.min(26, lineW - 14));
      printer.leftRight(name, money(c.total));
      printer.println(`   ${c.itemsSold ?? 0} uds.`);
    }
    if (cats.length > slice.length) {
      printer.println(`… +${cats.length - slice.length} más`);
    }
    printer.newLine();
  }

  const prods = Array.isArray(payload.products) ? payload.products : [];
  if (prods.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('POR PRODUCTO');
    printer.bold(false);
    printer.drawLine();
    const slice = prods.slice(0, MAX_REPORT_PRODUCTS);
    for (const p of slice) {
      const name = truncLabel(p.name, lineW - 2);
      printer.bold(true);
      printer.println(name);
      printer.bold(false);
      printer.leftRight(`  ${p.itemsSold ?? 0} uds.`, money(p.total));
    }
    if (prods.length > slice.length) {
      printer.println(`… +${prods.length - slice.length} más`);
    }
    printer.newLine();
  }

  const tabs = Array.isArray(payload.tables) ? payload.tables : [];
  if (tabs.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('POR MESA');
    printer.bold(false);
    printer.drawLine();
    const slice = tabs.slice(0, MAX_REPORT_TABLES);
    for (const t of slice) {
      const name = truncLabel(t.name, Math.min(22, lineW - 16));
      printer.leftRight(name, money(t.total));
      printer.println(`   ${t.ticketCount ?? 0} tickets`);
    }
    if (tabs.length > slice.length) {
      printer.println(`… +${tabs.length - slice.length} más`);
    }
    printer.newLine();
  }

  const thanks = String(payload.footerThanks || '').trim();
  if (thanks) {
    printer.alignCenter();
    printlnWrapped(printer, thanks, lineW);
    printer.alignLeft();
  }
  printer.newLine();
  printer.newLine();

  printer.setTextNormal();
  printer.bold(false);

  try {
    printer.partialCut();
  } catch {
    try {
      printer.cut();
    } catch {
      /* sin cortador */
    }
  }

  await printer.execute();
}

const MAX_SHIFT_CATEGORIES = 18;
const MAX_SHIFT_PRODUCTS = 28;
const MAX_SHIFT_ADJUSTMENTS = 16;

/**
 * Cierre de turno con cuadre de caja y ventas por grupo/producto.
 * @param {object} config
 * @param {object} payload - documentKind: 'shift-close', shift, totals, byCategory, byProduct, adjustments
 */
async function printThermalShiftClose(config, payload) {
  const printer = createPrinter(config);
  const lineW = Math.min(56, Math.max(32, Number(config.width) || 48));

  printer.setTypeFontA();
  printer.alignCenter();
  const bizName = String(payload.businessName || 'Bar POS').trim() || 'Bar POS';
  printer.bold(true);
  if (bizName.length <= 22) {
    printer.setTextDoubleHeight();
    printer.println(bizName.slice(0, 24));
    printer.setTextNormal();
  } else {
    printlnWrapped(printer, bizName, lineW);
  }
  printer.bold(false);
  if (payload.businessAddress) {
    printlnWrapped(printer, String(payload.businessAddress), lineW);
  }
  if (payload.businessPhone) {
    printer.println(`Tel: ${String(payload.businessPhone).slice(0, 24)}`);
  }
  printer.newLine();

  printer.bold(true);
  printer.println('CIERRE DE TURNO');
  printer.bold(false);
  printer.drawLine();
  printer.alignLeft();

  const shift = payload.shift && typeof payload.shift === 'object' ? payload.shift : {};
  if (shift.id) printer.println(`Turno #${shift.id}`);
  if (shift.openedAt) printer.println(`Apertura: ${shift.openedAt}`);
  if (shift.closedAt) printer.println(`Cierre:   ${shift.closedAt}`);
  if (shift.openedBy) printer.println(`Abierto por: ${truncLabel(shift.openedBy, lineW - 13)}`);
  if (shift.closedBy) printer.println(`Cerrado por: ${truncLabel(shift.closedBy, lineW - 13)}`);
  printer.newLine();

  const totals = payload.totals && typeof payload.totals === 'object' ? payload.totals : {};
  printer.bold(true);
  printer.println('CUADRE DE CAJA');
  printer.bold(false);
  printer.drawLine();
  printer.leftRight('Efectivo inicial', money(shift.openingCash));
  printer.leftRight('Ventas efectivo', money(totals.cashSales));
  printer.leftRight('Ventas tarjeta', money(totals.cardSales));
  printer.leftRight('Propinas', money(totals.tips));
  printer.leftRight('Efectivo esperado', money(totals.expectedCash));
  printer.leftRight('Efectivo contado', money(shift.closingCash));
  printer.bold(true);
  printer.leftRight('Diferencia', money(totals.cashDifference));
  printer.bold(false);
  printer.newLine();

  printer.bold(true);
  printer.println('RESUMEN');
  printer.bold(false);
  printer.drawLine();
  printer.leftRight('Total vendido', money(totals.totalSales));
  printer.leftRight('Ordenes', String(totals.orderCount ?? 0));
  printer.leftRight('Items', String(totals.itemCount ?? 0));
  if (Number(totals.tax) > 0) printer.leftRight('Impuestos', money(totals.tax));
  printer.newLine();

  const cats = Array.isArray(payload.byCategory) ? payload.byCategory : [];
  if (cats.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('VENTAS POR GRUPO');
    printer.bold(false);
    printer.drawLine();
    const slice = cats.slice(0, MAX_SHIFT_CATEGORIES);
    for (const c of slice) {
      printer.leftRight(truncLabel(c.name, Math.min(26, lineW - 14)), money(c.netTotal));
      printer.println(`   ${c.quantity ?? 0} uds.`);
    }
    if (cats.length > slice.length) {
      printer.println(`... +${cats.length - slice.length} mas`);
    }
    printer.newLine();
  }

  const prods = Array.isArray(payload.byProduct) ? payload.byProduct : [];
  if (prods.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('VENTAS POR PRODUCTO');
    printer.bold(false);
    printer.drawLine();
    const slice = prods.slice(0, MAX_SHIFT_PRODUCTS);
    for (const p of slice) {
      printer.bold(true);
      printer.println(truncLabel(p.name, lineW - 2));
      printer.bold(false);
      printer.leftRight(`  ${p.quantity ?? 0} uds.`, money(p.netTotal));
    }
    if (prods.length > slice.length) {
      printer.println(`... +${prods.length - slice.length} mas`);
    }
    printer.newLine();
  }

  const adjustments = payload.adjustments && typeof payload.adjustments === 'object'
    ? payload.adjustments
    : {};
  const voided = Array.isArray(adjustments.voidedItems) ? adjustments.voidedItems : [];
  const comped = Array.isArray(adjustments.compedItems) ? adjustments.compedItems : [];
  if (voided.length || comped.length) {
    printer.drawLine();
    printer.bold(true);
    printer.println('AJUSTES');
    printer.bold(false);
    printer.drawLine();
    for (const v of voided.slice(0, MAX_SHIFT_ADJUSTMENTS)) {
      printer.println(`ANULADO: ${truncLabel(v.name, lineW - 10)}`);
      printer.leftRight(`  ${v.quantity ?? 0} uds.`, money(v.amount));
      if (v.reason) printlnWrapped(printer, `  ${String(v.reason)}`, lineW);
    }
    for (const c of comped.slice(0, MAX_SHIFT_ADJUSTMENTS)) {
      printer.println(`CORTESIA: ${truncLabel(c.name, lineW - 11)}`);
      printer.leftRight(`  ${c.quantity ?? 0} uds.`, money(c.amount));
      if (c.reason) printlnWrapped(printer, `  ${String(c.reason)}`, lineW);
    }
    printer.newLine();
  }

  if (shift.notes) {
    printer.drawLine();
    printer.println('NOTAS');
    printlnWrapped(printer, String(shift.notes).slice(0, 240), lineW);
    printer.newLine();
  }

  const thanks = String(payload.footerThanks || '').trim();
  if (thanks) {
    printer.alignCenter();
    printlnWrapped(printer, thanks, lineW);
    printer.alignLeft();
  }
  printer.newLine();
  printer.newLine();

  printer.setTextNormal();
  printer.bold(false);

  try {
    printer.partialCut();
  } catch {
    try {
      printer.cut();
    } catch {
      /* sin cortador */
    }
  }

  await printer.execute();
}

module.exports = {
  printThermalReceipt,
  printThermalStationOrder,
  printThermalReport,
  printThermalShiftClose,
  resolveInterface,
  formatThermalPrintError,
};
