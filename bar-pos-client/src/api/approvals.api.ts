import { api } from './client';
import type { ApiResponse } from './types.api';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'failed';

export type ApprovalRequestBody = {
  actionType: 'void_item' | 'comp_item';
  orderId?: number;
  orderItemId?: number;
  quantity?: number;
  reason: string;
  payload?: Record<string, unknown>;
};

export type ApprovalRequest = {
  id: number;
  status: ApprovalStatus;
  expiresAt?: string;
  result?: unknown;
  error?: string;
};

export const approvalsApi = {
  create: (body: ApprovalRequestBody) =>
    api
      .post<ApiResponse<ApprovalRequest>>('/api/approval-requests', body)
      .then((r) => r.data.data),

  getById: (id: number) =>
    api
      .get<ApiResponse<ApprovalRequest>>(`/api/approval-requests/${id}`)
      .then((r) => r.data.data),
};
