import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthService } from './auth.service';

/** Rutas bajo prefijo `/api/auth` → POST /api/auth/login-pin */
export const authRoutesPlugin: FastifyPluginAsync = async (fastify) => {
  const auth = createAuthService(fastify);

  fastify.post('/login-pin', async (request, reply) => {
    const body = z.object({ pin: z.string().min(4).max(6) }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: 'PIN requerido' });
    }

    const result = await auth.loginByPin(body.data.pin);
    if (!result) {
      return reply.status(401).send({ success: false, error: 'PIN incorrecto' });
    }

    return reply.send({ success: true, data: result });
  });
};
