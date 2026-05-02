import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';

async function seed() {
  const pinHash = await bcrypt.hash('1234', 10);
  const passwordHash = await bcrypt.hash('admin123', 10);

  await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash,
      pin: pinHash,
      role: 'admin',
      active: true,
    })
    .onConflictDoNothing({ target: users.username });

  /** Si admin ya existía (sin PIN bcrypt o columna nueva), fija PIN 1234. */
  await db.update(users).set({ pin: pinHash, active: true }).where(eq(users.username, 'admin'));

  console.log('✅ admin — password: admin123 | PIN: 1234 (PIN actualizado si el usuario ya existía)');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
