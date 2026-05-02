import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/** Usuarios: login web (password) y POS Electron (PIN hasheado). */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('admin'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Tabla mínima de órdenes (reportes / stub).
 * Fusiona con tu schema real si ya existe.
 */
export const orders = pgTable('orders', {
  id: integer('id').primaryKey(),
  status: text('status').notNull(),
  paymentMethod: text('payment_method'),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
  total: real('total'),
  itemCount: integer('item_count'),
});
