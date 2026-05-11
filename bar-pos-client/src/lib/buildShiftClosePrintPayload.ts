import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  Shift,
  ShiftAdjustmentItem,
  ShiftCategorySummary,
  ShiftProductSummary,
  ShiftSummary,
} from '@/api/shifts.api';
import type { ThermalPrinterSettings } from '@/lib/thermalPrinterConfig';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dateLabel(v: unknown): string {
  if (!v) return '';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
}

function itemName(row: { productName?: string; name?: string }): string {
  return String(row.productName ?? row.name ?? 'Producto').trim() || 'Producto';
}

function categoryName(row: { categoryName?: string; name?: string }): string {
  return String(row.categoryName ?? row.name ?? 'Sin categoria').trim() || 'Sin categoria';
}

function qty(row: { quantity?: number; itemsSold?: number }): number {
  return num(row.quantity ?? row.itemsSold);
}

function net(row: { netTotal?: number; total?: number; grossTotal?: number }): number {
  return num(row.netTotal ?? row.total ?? row.grossTotal);
}

function mapCategory(row: ShiftCategorySummary) {
  return {
    name: categoryName(row),
    quantity: qty(row),
    grossTotal: num(row.grossTotal ?? row.total ?? row.netTotal),
    netTotal: net(row),
  };
}

function mapProduct(row: ShiftProductSummary) {
  return {
    name: itemName(row),
    categoryName: row.categoryName ?? '',
    quantity: qty(row),
    grossTotal: num(row.grossTotal ?? row.total ?? row.netTotal),
    netTotal: net(row),
  };
}

function mapAdjustment(row: ShiftAdjustmentItem) {
  return {
    name: itemName(row),
    quantity: num(row.quantity || 1),
    amount: num(row.amount),
    reason: row.reason ?? row.compType ?? '',
    approvedBy: row.approvedBy ?? '',
  };
}

export function buildShiftClosePrintPayload(
  settings: ThermalPrinterSettings,
  currentShift: Shift | null,
  summary: ShiftSummary | null,
  closingCash: number,
  notes?: string
) {
  const shift = summary?.shift ?? currentShift ?? undefined;
  const totals = summary?.totals ?? {};
  const openingCash = num(shift?.openingCash);
  const cashSales = num(totals.cashSales ?? summary?.cashSales ?? summary?.totalCash);
  const expectedCash = num(totals.expectedCash) || openingCash + cashSales;
  const cashDifference =
    totals.cashDifference != null ? num(totals.cashDifference) : closingCash - expectedCash;

  return {
    documentKind: 'shift-close' as const,
    businessName: (settings.businessName || 'Bar POS').trim(),
    businessAddress: (settings.businessAddress || '').trim(),
    businessPhone: (settings.businessPhone || '').trim(),
    footerThanks: (settings.footerThanks || '').trim(),
    shift: {
      id: shift?.id ?? '',
      openedAt: dateLabel(shift?.openedAt ?? shift?.createdAt),
      closedAt: dateLabel(shift?.closedAt ?? new Date().toISOString()),
      openedBy: shift?.openedBy ?? '',
      closedBy: shift?.closedBy ?? '',
      openingCash,
      closingCash,
      notes: notes?.trim() || shift?.notes || '',
    },
    totals: {
      orderCount: num(totals.orderCount ?? summary?.orderCount ?? summary?.totalOrders),
      itemCount: num(totals.itemCount ?? summary?.itemCount),
      subtotal: num(totals.subtotal),
      tax: num(totals.tax),
      tips: num(totals.tips ?? summary?.tips ?? summary?.totalTips ?? summary?.tipAmount),
      totalSales: num(totals.totalSales ?? summary?.totalSales ?? summary?.totalSold ?? summary?.total),
      cashSales,
      cardSales: num(totals.cardSales ?? summary?.cardSales ?? summary?.totalCard),
      expectedCash,
      cashDifference,
    },
    byCategory: (summary?.byCategory ?? []).map(mapCategory),
    byProduct: (summary?.byProduct ?? []).map(mapProduct),
    adjustments: {
      voidedItems: (summary?.adjustments?.voidedItems ?? []).map(mapAdjustment),
      compedItems: (summary?.adjustments?.compedItems ?? []).map(mapAdjustment),
    },
  };
}
