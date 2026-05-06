import { api } from './client';
import { getAppKey } from '../config/tenant';

type LoginPinData = {
  token: string;
  user: { id: number; username: string; role: string };
};

function unwrapLoginPinPayload(body: unknown): LoginPinData {
  if (!body || typeof body !== 'object') throw new Error('Respuesta invalida');
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
  throw new Error('Respuesta invalida del servidor');
}

export const authApi = {
  loginByPin: (pin: string) => {
    const appKey = getAppKey();
    if (!appKey) {
      return Promise.reject(new Error('Configura el App Key del terminal'));
    }

    return api
      .post<unknown>(
        `/api/auth/login-waiter-pin?appKey=${encodeURIComponent(appKey)}`,
        {
          pin,
          appKey,
          app_key: appKey,
        },
        {
          skipErrorToast: true,
        }
      )
      .then((r) => unwrapLoginPinPayload(r.data));
  },

  login: (username: string, password: string) => {
    const appKey = getAppKey();

    return api
      .post<{ success: boolean; data: unknown }>(
        `/api/auth/login?appKey=${encodeURIComponent(appKey)}`,
        {
          username,
          password,
          appKey,
          app_key: appKey,
        }
      )
      .then((r) => r.data.data);
  },
};
