import { api } from './client';
import { getAppKey } from '../config/tenant';

type LoginPinData = {
  token: string;
  user: { id: number; username: string; role: string };
};

function unwrapLoginPinPayload(body: unknown): LoginPinData {
  if (!body || typeof body !== 'object') throw new Error('Respuesta inválida');
  const o = body as Record<string, unknown>;
  const inner = (o.data as LoginPinData | undefined) ?? (o as unknown as LoginPinData);
  if (
    inner &&
    typeof inner.token === 'string' &&
    inner.user &&
    typeof inner.user.username === 'string'
  ) {
    return inner as LoginPinData;
  }
  throw new Error('Respuesta inválida del servidor');
}

export const authApi = {
  loginByPin: (pin: string) =>
    api
      .post<unknown>(
        `/api/auth/login-waiter-pin?appKey=${getAppKey()}`,
        { 
          pin, 
          appKey: getAppKey(),
          app_key: getAppKey(), // Compatibilidad con versiones específicas del backend
        },
        { 
          skipErrorToast: true,
        }
      )
      .then((r) => unwrapLoginPinPayload(r.data)),

  login: (username: string, password: string) =>
    api
      .post<{ success: boolean; data: unknown }>(
        `/api/auth/login?appKey=${getAppKey()}`,
        {
          username,
          password,
          appKey: getAppKey(),
          app_key: getAppKey(),
        }
      )
      .then((r) => r.data.data),
};
