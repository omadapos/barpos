import { api } from './client';
import type { ApiResponse } from './types.api';

export type Shift = {
  id: number;
  openedAt?: string;
  createdAt?: string;
  closedAt?: string | null;
  openedBy?: string | null;
  closedBy?: string | null;
  openingCash?: number;
  closingCash?: number | null;
  notes?: string | null;
  status?: string;
};

export type ShiftCategorySummary = {
  categoryId?: number | null;
  categoryName?: string;
  name?: string;
  quantity?: number;
  itemsSold?: number;
  grossTotal?: number;
  netTotal?: number;
  total?: number;
};

export type ShiftProductSummary = {
  productId?: number | null;
  productName?: string;
  name?: string;
  categoryName?: string;
  quantity?: number;
  itemsSold?: number;
  grossTotal?: number;
  netTotal?: number;
  total?: number;
};

export type ShiftAdjustmentItem = {
  productName?: string;
  name?: string;
  quantity?: number;
  amount?: number;
  reason?: string | null;
  compType?: string | null;
  approvedBy?: string | null;
};

export type ShiftSummary = {
  shift?: Shift;
  totals?: {
    orderCount?: number;
    itemCount?: number;
    subtotal?: number;
    tax?: number;
    tips?: number;
    totalSales?: number;
    cashSales?: number;
    cardSales?: number;
    expectedCash?: number;
    cashDifference?: number;
    [key: string]: unknown;
  };
  byCategory?: ShiftCategorySummary[];
  byProduct?: ShiftProductSummary[];
  adjustments?: {
    voidedItems?: ShiftAdjustmentItem[];
    compedItems?: ShiftAdjustmentItem[];
  };
  totalSales?: number;
  totalSold?: number;
  total?: number;
  cashSales?: number;
  totalCash?: number;
  cashTotal?: number;
  salesCash?: number;
  cardSales?: number;
  totalCard?: number;
  cardTotal?: number;
  salesCard?: number;
  orderCount?: number;
  totalOrders?: number;
  tips?: number;
  totalTips?: number;
  tipAmount?: number;
  totalTipAmount?: number;
  gratuity?: number;
  gratuityTotal?: number;
  serviceCharge?: number;
  [key: string]: unknown;
};

export type CloseShiftResult = Shift | { shift?: Shift; summary?: ShiftSummary; [key: string]: unknown };

export const shiftsApi = {
  current: () =>
    api
      .get<ApiResponse<Shift | null>>('/api/shifts/current', { skipErrorToast: true })
      .then((r) => r.data.data),

  open: (body: { openingCash: number }) =>
    api.post<ApiResponse<Shift>>('/api/shifts/open', body).then((r) => r.data.data),

  close: (body: { closingCash: number; notes?: string }) =>
    api.post<ApiResponse<CloseShiftResult>>('/api/shifts/close', body).then((r) => r.data.data),

  summary: (id: number) =>
    api.get<ApiResponse<ShiftSummary>>(`/api/shifts/${id}/summary`).then((r) => r.data.data),
};
