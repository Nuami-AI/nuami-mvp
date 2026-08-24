/**
 * Demo recording accounts.
 *   npm run auth:seed-demo
 *
 * Creates/updates the end-user demo login. Existing org/console passwords are kept;
 * only passwordMustChange is cleared so the recording is not interrupted.
 */
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

const DEMO_END_USER = "user@naumi.kr";
const DEMO_END_PASSWORD = "1234";
const DEMO_EXISTING = ["admin@nuami.kr", "hello@pusan.ac.kr"] as const;

async function main() {
  const { hashPassword } = await import("../src/lib/auth/password");
  const { prisma } = await import("../src/lib/db");

  await prisma.authUser.upsert({
    where: { email: DEMO_END_USER },
    create: {
      email: DEMO_END_USER,
      passwordHash: hashPassword(DEMO_END_PASSWORD),
      status: "ACTIVE",
      accountType: "END_USER",
      passwordMustChange: false,
    },
    update: {
      passwordHash: hashPassword(DEMO_END_PASSWORD),
      status: "ACTIVE",
      accountType: "END_USER",
      passwordMustChange: false,
    },
  });
  console.log(`ok ${DEMO_END_USER} (END_USER, password 1234, no forced change)`);

  for (const email of DEMO_EXISTING) {
    const existing = await prisma.authUser.findUnique({ where: { email } });
    if (!existing) {
      console.warn(`missing ${email} — create this account before the demo`);
      continue;
    }
    if (existing.passwordMustChange) {
      await prisma.authUser.update({
        where: { email },
        data: { passwordMustChange: false },
      });
      console.log(`ok ${email} — cleared passwordMustChange (password unchanged)`);
    } else {
      console.log(`ok ${email} (${existing.accountType})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
