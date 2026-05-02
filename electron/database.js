const Database = require('better-sqlite3');
const path = require('path');
const {
  seedCategories,
  seedLicores,
  defaultMeasures,
  seedProducts,
  seedTables,
} = require(path.join(__dirname, '..', 'src', 'data', 'seedData.js'));

let db;

function initDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'barpos.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '🍹',
      sort_order INTEGER DEFAULT 0,
      is_bottle_category INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      price REAL NOT NULL,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS bottle_measures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      measure_name TEXT NOT NULL,
      price REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      table_name TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      measure_name TEXT,
      category_name TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      subtotal REAL NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertCat = db.prepare(
    `INSERT INTO categories (name, color, icon, sort_order, is_bottle_category) VALUES (@name, @color, @icon, @sort_order, @is_bottle_category)`
  );
  const insertProduct = db.prepare(
    `INSERT INTO products (category_id, name, price, active) VALUES (?, ?, ?, 1)`
  );
  const insertMeasure = db.prepare(
    `INSERT INTO bottle_measures (product_id, measure_name, price) VALUES (?, ?, ?)`
  );
  const insertTable = db.prepare(
    `INSERT INTO tables (name, capacity, active) VALUES (?, ?, 1)`
  );

  const catIdByName = {};
  seedCategories.forEach((c, i) => {
    insertCat.run({
      name: c.name,
      color: c.color,
      icon: c.icon,
      sort_order: i,
      is_bottle_category: c.is_bottle_category,
    });
    const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(c.name);
    catIdByName[c.name] = row.id;
  });

  const licoresId = catIdByName['Licores'];
  seedLicores.forEach((name) => {
    const info = insertProduct.run(licoresId, name, 0);
    const pid = info.lastInsertRowid;
    defaultMeasures.forEach((m) => {
      insertMeasure.run(pid, m.measure_name, m.price);
    });
  });

  seedProducts.forEach((p) => {
    const cid = catIdByName[p.category];
    if (cid) insertProduct.run(cid, p.name, p.price);
  });

  seedTables.forEach((t) => insertTable.run(t.name, t.capacity));
}

function recalcOrderTotals(orderId, taxPercent) {
  const items = db
    .prepare(
      `SELECT quantity, unit_price, subtotal FROM order_items WHERE order_id = ?`
    )
    .all(orderId);
  let subtotal = 0;
  items.forEach((row) => {
    subtotal += row.subtotal;
  });
  const tax = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  db.prepare(
    `UPDATE orders SET subtotal = ?, tax = ?, total = ? WHERE id = ?`
  ).run(subtotal, tax, total, orderId);
  return { subtotal, tax, total };
}

function getTables() {
  return db
    .prepare(
      `SELECT id, name, capacity, active FROM tables ORDER BY id ASC`
    )
    .all();
}

function createTable(data) {
  const r = db
    .prepare(
      `INSERT INTO tables (name, capacity, active) VALUES (?, ?, 1)`
    )
    .run(data.name, data.capacity ?? 4);
  return { id: r.lastInsertRowid, name: data.name, capacity: data.capacity ?? 4, active: 1 };
}

function updateTable(id, data) {
  const fields = [];
  const vals = [];
  if (data.name != null) {
    fields.push('name = ?');
    vals.push(data.name);
  }
  if (data.capacity != null) {
    fields.push('capacity = ?');
    vals.push(data.capacity);
  }
  if (fields.length === 0) return getTableById(id);
  vals.push(id);
  db.prepare(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return getTableById(id);
}

function getTableById(id) {
  return db
    .prepare(`SELECT id, name, capacity, active FROM tables WHERE id = ?`)
    .get(id);
}

function toggleTable(id) {
  const t = getTableById(id);
  if (!t) return null;
  const next = t.active ? 0 : 1;
  db.prepare(`UPDATE tables SET active = ? WHERE id = ?`).run(next, id);
  return getTableById(id);
}

function deleteTable(id) {
  const open = db
    .prepare(
      `SELECT id FROM orders WHERE table_id = ? AND status = 'open' LIMIT 1`
    )
    .get(id);
  if (open) {
    return { error: 'Hay una orden abierta en esta mesa.' };
  }
  db.prepare(`DELETE FROM tables WHERE id = ?`).run(id);
  return { ok: true };
}

function getCategories() {
  return db
    .prepare(
      `SELECT id, name, color, icon, sort_order, is_bottle_category FROM categories ORDER BY sort_order ASC, id ASC`
    )
    .all()
    .map((c) => ({ ...c, is_bottle_category: !!c.is_bottle_category }));
}

function getProducts(categoryId) {
  return db
    .prepare(
      `SELECT id, category_id, name, price, active FROM products WHERE category_id = ? AND active = 1 ORDER BY name ASC`
    )
    .all(categoryId);
}

function getMeasures(productId) {
  return db
    .prepare(
      `SELECT id, product_id, measure_name, price FROM bottle_measures WHERE product_id = ? ORDER BY id ASC`
    )
    .all(productId);
}

function getOpenOrders() {
  const rows = db
    .prepare(
      `SELECT o.id, o.table_id, o.table_name, o.status, o.subtotal, o.tax, o.total, o.created_at,
        (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count
      FROM orders o WHERE o.status = 'open'`
    )
    .all();
  const map = {};
  rows.forEach((o) => {
    if (o.table_id != null) map[o.table_id] = o.id;
  });
  return { list: rows, byTableId: map };
}

function getOrderByTable(tableId) {
  const order = db
    .prepare(
      `SELECT * FROM orders WHERE table_id = ? AND status = 'open' LIMIT 1`
    )
    .get(tableId);
  if (!order) return null;
  return hydrateOrder(order.id);
}

function getOrderById(orderId) {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return null;
  return hydrateOrder(orderId);
}

function hydrateOrder(orderId) {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return null;
  const items = db
    .prepare(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`
    )
    .all(orderId);
  return { ...order, items };
}

function createOrder(data, taxPercent) {
  let tableName = data.table_name ?? null;
  const r = db
    .prepare(
      `INSERT INTO orders (table_id, table_name, status, subtotal, tax, total) VALUES (?, ?, 'open', 0, 0, 0)`
    )
    .run(data.table_id ?? null, tableName);
  const id = r.lastInsertRowid;
  if (data.table_id == null && !data.table_name) {
    tableName = `Ticket #${String(id).padStart(3, '0')}`;
    db.prepare(`UPDATE orders SET table_name = ? WHERE id = ?`).run(tableName, id);
  }
  recalcOrderTotals(id, taxPercent);
  return getOrderById(id);
}

function addOrderItem(orderId, item, taxPercent) {
  const order = db.prepare(`SELECT id, status FROM orders WHERE id = ?`).get(orderId);
  if (!order || order.status !== 'open') return null;

  const displayName = item.measure_name
    ? `${item.product_name} — ${item.measure_name}`
    : item.product_name;

  const existing = db
    .prepare(
      `SELECT id, quantity, unit_price FROM order_items WHERE order_id = ? AND product_name = ?`
    )
    .get(orderId, displayName);

  if (existing) {
    const qty = existing.quantity + (item.quantity || 1);
    const sub = Math.round(qty * existing.unit_price * 100) / 100;
    db.prepare(
      `UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?`
    ).run(qty, sub, existing.id);
  } else {
    const qty = item.quantity || 1;
    const unit = item.unit_price;
    const sub = Math.round(qty * unit * 100) / 100;
    db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, measure_name, category_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orderId,
      item.product_id ?? null,
      displayName,
      item.measure_name ?? null,
      item.category_name ?? null,
      unit,
      qty,
      sub
    );
  }
  recalcOrderTotals(orderId, taxPercent);
  return getOrderById(orderId);
}

function updateItemQuantity(itemId, qty, taxPercent) {
  if (qty < 1) return removeOrderItem(itemId, taxPercent);
  const row = db
    .prepare(`SELECT order_id, unit_price FROM order_items WHERE id = ?`)
    .get(itemId);
  if (!row) return null;
  const sub = Math.round(qty * row.unit_price * 100) / 100;
  db.prepare(
    `UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?`
  ).run(qty, sub, itemId);
  recalcOrderTotals(row.order_id, taxPercent);
  return getOrderById(row.order_id);
}

function removeOrderItem(itemId, taxPercent) {
  const row = db.prepare(`SELECT order_id FROM order_items WHERE id = ?`).get(itemId);
  if (!row) return null;
  db.prepare(`DELETE FROM order_items WHERE id = ?`).run(itemId);
  recalcOrderTotals(row.order_id, taxPercent);
  return getOrderById(row.order_id);
}

function closeOrder(orderId, paymentMethod, taxPercent) {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order || order.status !== 'open') return { error: 'Orden no válida.' };
  recalcOrderTotals(orderId, taxPercent);
  const fresh = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  db.prepare(
    `UPDATE orders SET status = 'paid', closed_at = datetime('now'), payment_method = ?, subtotal = ?, tax = ?, total = ? WHERE id = ?`
  ).run(
    paymentMethod,
    fresh.subtotal,
    fresh.tax,
    fresh.total,
    orderId
  );
  return { ok: true, order: db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) };
}

function cancelOrder(orderId) {
  const order = db.prepare(`SELECT status FROM orders WHERE id = ?`).get(orderId);
  if (!order || order.status !== 'open') return { error: 'Solo se pueden cancelar órdenes abiertas.' };
  db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);
  db.prepare(`DELETE FROM orders WHERE id = ?`).run(orderId);
  return { ok: true };
}

function getReportSummary(from, to) {
  const paid = db
    .prepare(
      `SELECT payment_method, total FROM orders WHERE status = 'paid' AND closed_at >= ? AND closed_at <= ?`
    )
    .all(from, to);
  let totalSales = 0;
  const methods = { cash: 0, card: 0 };
  paid.forEach((r) => {
    totalSales += r.total;
    if (r.payment_method === 'cash') methods.cash += 1;
    else if (r.payment_method === 'card') methods.card += 1;
  });
  const n = paid.length;
  const avg = n ? totalSales / n : 0;
  let topMethod = '—';
  if (methods.cash > methods.card) topMethod = 'Efectivo';
  else if (methods.card > methods.cash) topMethod = 'Tarjeta';
  else if (methods.cash > 0) topMethod = 'Empate';
  return {
    totalSales,
    ticketCount: n,
    avgTicket: avg,
    topPaymentMethod: topMethod,
  };
}

function getReportByCategory(from, to) {
  const rows = db
    .prepare(
      `
    SELECT oi.category_name AS category_name, c.color AS color,
           SUM(oi.quantity) AS qty,
           SUM(oi.subtotal) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN categories c ON c.name = oi.category_name
    WHERE o.status = 'paid' AND o.closed_at >= ? AND o.closed_at <= ?
    GROUP BY oi.category_name
    ORDER BY total DESC
  `
    )
    .all(from, to);
  return rows.map((r) => ({
    category: r.category_name || 'Sin categoría',
    color: r.color || '#64748b',
    quantity: r.qty,
    total: r.total,
  }));
}

function getReportProductsInCategory(from, to, categoryName) {
  return db
    .prepare(
      `
    SELECT oi.product_name AS name, SUM(oi.quantity) AS qty, SUM(oi.subtotal) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'paid' AND o.closed_at >= ? AND o.closed_at <= ?
      AND IFNULL(oi.category_name,'') = IFNULL(?,'')
    GROUP BY oi.product_name
    ORDER BY total DESC
  `
    )
    .all(from, to, categoryName);
}

function getReportByProduct(from, to, categoryFilter) {
  let sql = `
    SELECT oi.product_name AS product, oi.category_name AS category,
           SUM(oi.quantity) AS qty,
           AVG(oi.unit_price) AS unit_price,
           SUM(oi.subtotal) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'paid' AND o.closed_at >= ? AND o.closed_at <= ?
  `;
  const params = [from, to];
  if (categoryFilter) {
    sql += ` AND oi.category_name = ?`;
    params.push(categoryFilter);
  }
  sql += ` GROUP BY oi.product_name, oi.category_name ORDER BY total DESC`;
  return db.prepare(sql).all(...params);
}

function getReportByTable(from, to) {
  return db
    .prepare(
      `
    SELECT IFNULL(table_name, 'Sin mesa') AS table_name,
           COUNT(*) AS tickets,
           SUM(total) AS total
    FROM orders
    WHERE status = 'paid' AND closed_at >= ? AND closed_at <= ? AND table_id IS NOT NULL
    GROUP BY table_name
    ORDER BY total DESC
  `
    )
    .all(from, to);
}

module.exports = {
  initDatabase,
  getTables,
  createTable,
  updateTable,
  toggleTable,
  deleteTable,
  getCategories,
  getProducts,
  getMeasures,
  getOpenOrders,
  getOrderByTable,
  getOrderById,
  createOrder,
  addOrderItem,
  updateItemQuantity,
  removeOrderItem,
  closeOrder,
  cancelOrder,
  getReportSummary,
  getReportByCategory,
  getReportProductsInCategory,
  getReportByProduct,
  getReportByTable,
  recalcOrderTotals,
};
