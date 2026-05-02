import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { orders } from '../db/schema';

/**
 * Método de pago más usado en el rango (órdenes pagadas, por closedAt).
 * Úsalo dentro de tu handler de summary existente:
 *
 *   const topPaymentMethod = await getTopPaymentMethod(from, to);
 *   return { ...stats, topPaymentMethod };
 */
export async function getTopPaymentMethod(from: string, to: string): Promise<string> {
  const topMethod = await db
    .select({ method: orders.paymentMethod, count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'paid'),
        gte(orders.closedAt, from),
        lte(orders.closedAt, to)
      )
    )
    .groupBy(orders.paymentMethod)
    .orderBy(desc(count()))
    .limit(1);

  return topMethod[0]?.method ?? '—';
}

/** Útil si ya construyes el objeto summary y solo falta este campo. */
export async function withTopPaymentMethod<T extends Record<string, unknown>>(
  summary: T,
  from: string,
  to: string
): Promise<T & { topPaymentMethod: string }> {
  const topPaymentMethod = await getTopPaymentMethod(from, to);
  return { ...summary, topPaymentMethod };
}
