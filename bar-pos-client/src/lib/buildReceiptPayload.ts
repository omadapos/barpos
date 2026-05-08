import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ThermalPrinterSettings } from '@/lib/thermalPrinterConfig';
import type { Order } from '@/types';
import {
  computeTipAmount,
  DEFAULT_TIP_PERCENT,
  orderTotalForTip,
  parseAmount,
} from '@/lib/tip';

export type ReceiptPaymentMethod = 'cash' | 'card';

/** Ticket final de cobro o pre-cuenta antes de pagar */
export type ReceiptDocumentKind = 'final' | 'prebill';

export interface ReceiptPayload {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  footerThanks?: string;
  documentKind?: ReceiptDocumentKind;
  tableName: string;
  orderId: number;
  createdAt: string;
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    measure?: string | null;
  }[];
  subtotal: number;
  tax: number;
  /** Total cuenta (sin propina) */
  total: number;
  /** Si hay propina */
  tipPercent?: number;
  tipAmount?: number;
  /** total + tipAmount */
  grandTotal?: number;
  /** Eleccion del mesero (para texto en el ticket aunque el monto sea 0) */
  includesTip?: boolean;
  paymentMethod: ReceiptPaymentMethod;
  notes?: string | null;
}

function receiptFieldsFromSettings(settings: ThermalPrinterSettings) {
  return {
    businessName: (settings.businessName || 'nfarra2').trim(),
    businessAddress: (settings.businessAddress || '').trim(),
    businessPhone: (settings.businessPhone || '').trim(),
    footerThanks: (settings.footerThanks || 'Gracias por su visita!').trim(),
  };
}

export function buildReceiptPayload(
  order: Order,
  paymentMethod: ReceiptPaymentMethod,
  settings: ThermalPrinterSettings,
  documentKind: ReceiptDocumentKind = 'final',
  tip?: { include: boolean; percent?: number }
): ReceiptPayload {
  const tipPct = tip?.percent ?? DEFAULT_TIP_PERCENT;
  const includeRequested = tip?.include === true;
  const baseTotal = orderTotalForTip(order);
  const tipAmount = includeRequested ? computeTipAmount(order, tipPct) : 0;
  const grandTotal = baseTotal + tipAmount;

  const items = (order.items ?? [])
    .filter((it) => (it.status ?? 'pending') !== 'voided' && !it.compType)
    .map((it) => {
      const name =
        it.measureName && !it.productName.includes(' - ')
          ? `${it.productName} - ${it.measureName}`
          : it.productName;
      return {
        name,
        qty: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        measure: it.measureName,
      };
    });

  return {
    ...receiptFieldsFromSettings(settings),
    documentKind,
    tableName: order.tableName || 'Orden',
    orderId: order.id,
    createdAt: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
    items,
    subtotal: parseAmount(order.subtotal),
    tax: parseAmount(order.tax),
    total: baseTotal,
    includesTip: includeRequested,
    ...(tipAmount > 0 ? { tipPercent: tipPct, tipAmount, grandTotal } : {}),
    paymentMethod,
    notes: order.notes,
  };
}

/** Pre-cuenta para el cliente (mismo detalle, sin linea de pago). */
export function buildPreBillPayload(
  order: Order,
  settings: ThermalPrinterSettings,
  includeTip18: boolean,
  tipPercent: number = DEFAULT_TIP_PERCENT
): ReceiptPayload {
  return buildReceiptPayload(order, 'cash', settings, 'prebill', {
    include: includeTip18,
    percent: tipPercent,
  });
}
