import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order, StationPrintJob } from '@/types';

export function buildStationPrintPayload(order: Order, job: StationPrintJob) {
  return {
    documentKind: 'station',
    station: job.station,
    stationName: job.stationName || job.station,
    tableName: order.tableName,
    orderId: order.id,
    createdAt: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es }),
    items: (job.items ?? []).map((it) => ({
      orderItemId: it.orderItemId,
      name: it.productName,
      qty: it.quantity,
      measure: it.measureName ?? null,
      notes: it.notes ?? null,
    })),
  };
}
