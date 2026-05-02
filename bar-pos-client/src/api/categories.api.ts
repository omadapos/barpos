import { api } from './client';
import type { ApiResponse } from './types.api';
import type { Category } from '../types';

export const categoriesApi = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>('/api/categories').then((r) => r.data.data),
};
