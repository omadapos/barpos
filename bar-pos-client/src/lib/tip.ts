import type { Order } from '@/types';

export const DEFAULT_TIP_PERCENT = 18;

/** Convierte montos del API (número, string, "1,234.56", etc.) */
export function parseAmount(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const t = v.trim().replace(/\s/g, '').replace(/,/g, '');
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Base para propina y total a cobrar: `total` de la orden si es válido; si no, subtotal + impuesto.
 */
export function orderTotalForTip(
  order: Pick<Order, 'total' | 'subtotal' | 'tax'>
): number {
  const fromTotal = parseAmount(order.total);
  if (fromTotal > 0) return fromTotal;
  return parseAmount(order.subtotal) + parseAmount(order.tax);
}

/**
 * Propina sobre el total de la cuenta (según `orderTotalForTip`).
 */
export function computeTipAmount(
  order: Pick<Order, 'total' | 'subtotal' | 'tax'>,
  percent: number = DEFAULT_TIP_PERCENT
): number {
  const base = orderTotalForTip(order);
  if (base <= 0 || percent <= 0) return 0;
  const raw = (base * percent) / 100;
  return Math.round(raw * 100) / 100;
}

export function grandTotalWithTip(
  order: Pick<Order, 'total' | 'subtotal' | 'tax'>,
  includeTip: boolean,
  percent: number = DEFAULT_TIP_PERCENT
): number {
  const base = orderTotalForTip(order);
  if (!includeTip) return base;
  return base + computeTipAmount(order, percent);
}
