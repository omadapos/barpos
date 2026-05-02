import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../../db';
import { users } from '../../db/schema';

export function createAuthService(fastify: FastifyInstance) {
  return {
    loginByPin: async (pin: string) => {
      const activeUsers = await db.select().from(users).where(eq(users.active, true));

      for (const user of activeUsers) {
        const stored = user.pin?.trim() ?? '';
        if (!stored) continue;

        let valid = false;
        if (stored.startsWith('$2')) {
          try {
            valid = await bcrypt.compare(pin, stored);
          } catch {
            valid = false;
          }
        } else {
          /** Compat: PIN en texto plano en BD (migraciones antiguas). */
          valid = stored === pin;
        }

        if (valid) {
          const token = fastify.jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            { expiresIn: '8h' }
          );
          return {
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role ?? 'admin',
            },
          };
        }
      }
      return null;
    },
  };
}
