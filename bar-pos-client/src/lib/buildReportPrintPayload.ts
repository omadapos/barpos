import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  CategoryReport,
  ProductReport,
  ReportSummary,
  TableReport,
} from '@/types';
import type { ThermalPrinterSettings } from '@/lib/thermalPrinterConfig';

function fmtRangeLabel(from: string, to: string) {
  const a = parseISO(`${from}T12:00:00`);
  const b = parseISO(`${to}T12:00:00`);
  return {
    rangeFrom: format(a, 'dd/MM/yyyy', { locale: es }),
    rangeTo: format(b, 'dd/MM/yyyy', { locale: es }),
  };
}

export function buildReportPrintPayload(
  settings: ThermalPrinterSettings,
  from: string,
  to: string,
  summary: ReportSummary | undefined,
  categories: CategoryReport[],
  products: ProductReport[],
  tables: TableReport[]
) {
  const { rangeFrom, rangeTo } = fmtRangeLabel(from, to);
  return {
    documentKind: 'report' as const,
    businessName: (settings.businessName || 'Bar POS').trim(),
    businessAddress: (settings.businessAddress || '').trim(),
    businessPhone: (settings.businessPhone || '').trim(),
    footerThanks: (settings.footerThanks || '').trim(),
    rangeFrom,
    rangeTo,
    summary: summary
      ? {
          totalSales: summary.totalSales,
          totalTickets: summary.totalTickets,
          avgTicket: summary.avgTicket,
          topPaymentMethod: summary.topPaymentMethod || '—',
        }
      : {
          totalSales: 0,
          totalTickets: 0,
          avgTicket: 0,
          topPaymentMethod: '—',
        },
    categories: categories.map((c) => ({
      name: c.categoryName,
      itemsSold: c.itemsSold,
      total: c.total,
    })),
    products: products.map((p) => ({
      name: p.productName,
      categoryName: p.categoryName,
      itemsSold: p.itemsSold,
      total: p.total,
    })),
    tables: tables.map((t) => ({
      name: t.tableName,
      ticketCount: t.ticketCount,
      total: t.total,
    })),
  };
}
