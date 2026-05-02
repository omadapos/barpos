import { api } from './client';
import type { ApiResponse } from './types.api';
import type { BottleMeasure, Product } from '../types';

export const productsApi = {
  getByCategory: (categoryId: number) =>
    api
      .get<ApiResponse<Product[]>>(`/api/products?categoryId=${categoryId}`)
      .then((r) => r.data.data),

  getMeasures: (productId: number) =>
    api
      .get<ApiResponse<BottleMeasure[]>>(`/api/products/${productId}/measures`)
      .then((r) => r.data.data),
};
