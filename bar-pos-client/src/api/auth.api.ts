import { api } from './client';

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
      .post<unknown>('/api/auth/login-pin', { pin }, { skipErrorToast: true })
      .then((r) => unwrapLoginPinPayload(r.data)),

  login: (username: string, password: string) =>
    api
      .post<{ success: boolean; data: unknown }>('/api/auth/login', {
        username,
        password,
      })
      .then((r) => r.data.data),
};
