import { api } from './client';
import type { ApiResponse } from './types.api';

export type Shift = {
  id: number;
  openedAt?: string;
  createdAt?: string;
  openingCash?: number;
  status?: string;
};

export type ShiftSummary = {
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

export const shiftsApi = {
  current: () =>
    api
      .get<ApiResponse<Shift | null>>('/api/shifts/current', { skipErrorToast: true })
      .then((r) => r.data.data),

  open: (body: { openingCash: number }) =>
    api.post<ApiResponse<Shift>>('/api/shifts/open', body).then((r) => r.data.data),

  close: (body: { closingCash: number; notes?: string }) =>
    api.post<ApiResponse<Shift>>('/api/shifts/close', body).then((r) => r.data.data),

  summary: (id: number) =>
    api.get<ApiResponse<ShiftSummary>>(`/api/shifts/${id}/summary`).then((r) => r.data.data),
};
