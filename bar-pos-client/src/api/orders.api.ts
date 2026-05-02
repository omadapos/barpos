import { api } from './client';
import type { ApiResponse } from './types.api';
import type { Order } from '../types';

export const ordersApi = {
  getOpen: () =>
    api.get<ApiResponse<Order[]>>('/api/orders/open').then((r) => r.data.data),

  getByTable: (tableId: number) =>
    api.get<ApiResponse<Order>>(`/api/orders/table/${tableId}`).then((r) => r.data.data),

  getById: (id: number) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`).then((r) => r.data.data),

  create: (body: { tableId?: number | null; tableName?: string }) =>
    api.post<ApiResponse<Order>>('/api/orders', body).then((r) => r.data.data),

  addItem: (
    orderId: number,
    item: {
      productId: number;
      productName: string;
      categoryName: string;
      measureName?: string;
      unitPrice: number;
      quantity: number;
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

  /** PATCH notas; si el backend no expone la ruta, fallará con 404. */
  updateNotes: (orderId: number, notes: string) =>
    api
      .patch<ApiResponse<Order>>(`/api/orders/${orderId}`, { notes }, { skipErrorToast: true })
      .then((r) => r.data.data),
};
