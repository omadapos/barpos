import { api } from './client';
import type { ApiResponse } from './types.api';
import type { Table } from '../types';

export const tablesApi = {
  getAll: () =>
    api.get<ApiResponse<Table[]>>('/api/tables').then((r) => r.data.data),

  create: (body: { name: string; capacity: number }) =>
    api.post<ApiResponse<Table>>('/api/tables', body).then((r) => r.data.data),

  update: (id: number, body: { name: string; capacity: number }) =>
    api.put<ApiResponse<Table>>(`/api/tables/${id}`, body).then((r) => r.data.data),

  toggle: (id: number) =>
    api.patch<ApiResponse<Table>>(`/api/tables/${id}/toggle`).then((r) => r.data.data),
};
