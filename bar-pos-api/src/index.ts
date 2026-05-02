import 'dotenv/config';
import Fastify from 'fastify';
import { registerAuthModule } from './modules/auth/register-auth';

/**
 * Servidor mínimo para desarrollo (auth + health).
 * En producción, registra `registerAuthModule` en tu app Fastify completa.
 */
async function main() {
  const app = Fastify({ logger: true });
  await registerAuthModule(app);
  app.get('/health', async () => ({ ok: true }));
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Bar POS API http://0.0.0.0:${port}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
