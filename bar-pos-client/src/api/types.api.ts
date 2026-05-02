/** Respuesta estándar del backend Fastify */
export type ApiResponse<T> = { success: boolean; data: T };
