import { api } from './client';
import type { ApiResponse } from './types.api';
import type { CategoryReport, ProductReport, ReportSummary, TableReport } from '../types';

/** Payload real de GET /api/reports/summary */
type SummaryDto = {
  from?: string;
  to?: string;
  orderCount?: number;
  totalTickets?: number;
  itemCount?: number;
  totalRevenue?: number;
  totalSales?: number;
  averageTicket?: number;
  avgTicket?: number;
  topPaymentMethod?: string | null;
};

/** Fila real de GET /api/reports/by-table */
type TableReportDto = {
  tableName: string;
  total: number;
  ordersCount?: number;
  ticketCount?: number;
  itemsSold?: number;
};

function humanizeTopPayment(raw?: string | null): string {
  if (raw == null || raw === '' || raw === '—') return '—';
  if (raw === 'cash') return 'Efectivo';
  if (raw === 'card') return 'Tarjeta';
  return raw;
}

function mapSummary(d: SummaryDto): ReportSummary {
  return {
    totalSales: d.totalRevenue ?? d.totalSales ?? 0,
    totalTickets: d.orderCount ?? d.totalTickets ?? 0,
    avgTicket: d.averageTicket ?? d.avgTicket ?? 0,
    topPaymentMethod: humanizeTopPayment(d.topPaymentMethod),
  };
}

function mapTableRows(rows: TableReportDto[]): TableReport[] {
  return rows.map((row) => ({
    tableName: row.tableName,
    total: row.total,
    ticketCount: row.ordersCount ?? row.ticketCount ?? 0,
    itemsSold: row.itemsSold,
  }));
}

export const reportsApi = {
  getSummary: (from: string, to: string) =>
    api
      .get<ApiResponse<SummaryDto>>(
        `/api/reports/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      .then((r) => mapSummary(r.data.data)),

  getByCategory: (from: string, to: string) =>
    api
      .get<ApiResponse<CategoryReport[]>>(
        `/api/reports/by-category?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      .then((r) => r.data.data),

  getByProduct: (from: string, to: string) =>
    api
      .get<ApiResponse<ProductReport[]>>(
        `/api/reports/by-product?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      .then((r) => r.data.data),

  getByTable: (from: string, to: string) =>
    api
      .get<ApiResponse<TableReportDto[]>>(
        `/api/reports/by-table?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      .then((r) => mapTableRows(r.data.data)),

  getByHour: (date: string) =>
    api
      .get<ApiResponse<unknown[]>>(`/api/reports/by-hour?date=${encodeURIComponent(date)}`)
      .then((r) => r.data.data),
};
