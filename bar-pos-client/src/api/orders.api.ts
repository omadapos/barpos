import { api } from './client';
import type { ApiResponse } from './types.api';
import type { Order, StationPrintJob } from '../types';

export type SendOrderResult = {
  order: Order;
  printJobs: StationPrintJob[];
};

function normalizeSendOrderPayload(data: Order | SendOrderResult): SendOrderResult {
  if (data && typeof data === 'object' && 'order' in data) {
    return {
      order: data.order,
      printJobs: Array.isArray(data.printJobs) ? data.printJobs : [],
    };
  }
  return { order: data as Order, printJobs: [] };
}

export const ordersApi = {
  getOpen: () =>
    api.get<ApiResponse<Order[]>>('/api/orders/open').then((r) => r.data.data),

  getByTable: (tableId: number) =>
    api
      .get<ApiResponse<Order>>(`/api/orders/table/${tableId}`, { skipErrorToast: true })
      .then((r) => r.data.data),

  getById: (id: number) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`).then((r) => r.data.data),

  create: (body: { tableId?: number | null; notes?: string }) =>
    api.post<ApiResponse<Order>>('/api/orders', body).then((r) => r.data.data),

  addItem: (
    orderId: number,
    item: {
      productId: number;
      quantity: number;
      measureName?: string;
      notes?: string;
    }
  ) =>
    api.post<ApiResponse<Order>>(`/api/orders/${orderId}/items`, item).then((r) => r.data.data),

  updateQty: (orderId: number, itemId: number, quantity: number) =>
    api
      .patch<ApiResponse<Order>>(`/api/orders/${orderId}/items/${itemId}`, { quantity })
      .then((r) => r.data.data),

  removeItem: (orderId: number, itemId: number) =>
    api
      .delete<ApiResponse<Order>>(`/api/orders/${orderId}/items/${itemId}`)
      .then((r) => r.data.data),

  pay: (orderId: number, paymentMethod: 'cash' | 'card') =>
    api
      .post<ApiResponse<Order>>(`/api/orders/${orderId}/pay`, { paymentMethod })
      .then((r) => r.data.data),

  cancel: (orderId: number) =>
    api.delete<ApiResponse<unknown>>(`/api/orders/${orderId}`).then((r) => r.data.data),

  send: (orderId: number) =>
    api
      .post<ApiResponse<Order | SendOrderResult>>(`/api/orders/${orderId}/send`)
      .then((r) => normalizeSendOrderPayload(r.data.data)),

  moveItems: (
    orderId: number,
    body: { targetTableId: number; items: Array<{ orderItemId: number; quantity: number }> }
  ) =>
    api
      .post<ApiResponse<{ sourceOrder: Order | null; targetOrder: Order }>>(
        `/api/orders/${orderId}/move-items`,
        body
      )
      .then((r) => r.data.data),

  merge: (orderId: number, body: { targetTableId: number }) =>
    api
      .post<ApiResponse<{ targetOrder: Order }>>(`/api/orders/${orderId}/merge`, body)
      .then((r) => r.data.data),

  updateNotes: (orderId: number, notes: string) =>
    api
      .patch<ApiResponse<Order>>(`/api/orders/${orderId}`, { notes }, { skipErrorToast: true })
      .then((r) => r.data.data),
};
