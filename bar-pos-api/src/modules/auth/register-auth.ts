import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { authRoutesPlugin } from './auth.routes';

/**
 * Registra CORS (Electron/Vite → otro puerto), JWT y POST /api/auth/login-pin.
 * En tu servidor Fastify principal:
 *
 *   import { registerAuthModule } from './modules/auth/register-auth';
 *   await registerAuthModule(app);
 */
export async function registerAuthModule(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await fastify.register(fjwt, {
    secret: process.env.JWT_SECRET ?? 'bar-pos-dev-change-me',
  });
  await fastify.register(authRoutesPlugin, { prefix: '/api/auth' });
}
