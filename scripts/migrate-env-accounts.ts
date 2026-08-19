/**
 * One-shot: copy ADMIN_* / TESTER*_ env accounts into AuthUser, hashed.
 * Run while those env vars still exist, then delete them.
 *   npm run auth:migrate-env
 */
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

type Seed = { email: string; password: string; accountType: "INTERNAL" | "END_USER" };

function seedsFromEnv(): Seed[] {
  const rows: Seed[] = [];
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (adminEmail && adminPassword) {
    rows.push({ email: adminEmail, password: adminPassword, accountType: "INTERNAL" });
  }
  for (const n of [1, 2, 3, 4, 5] as const) {
    const email = process.env[`TESTER${n}_EMAIL`]?.trim().toLowerCase() ?? "";
    const password = process.env[`TESTER${n}_PASSWORD`] ?? "";
    if (email && password) rows.push({ email, password, accountType: "END_USER" });
  }
  return rows;
}

async function main() {
  const { hashPassword } = await import("../src/lib/auth/password");
  const { prisma } = await import("../src/lib/db");

  const seeds = seedsFromEnv();
  if (seeds.length === 0) {
    console.log("No ADMIN_* / TESTER*_ env accounts found. Nothing to migrate.");
    return;
  }

  try {
    for (const seed of seeds) {
      const existing = await prisma.authUser.findUnique({ where: { email: seed.email } });
      const passwordHash = existing?.passwordHash ? existing.passwordHash : hashPassword(seed.password);
      await prisma.authUser.upsert({
        where: { email: seed.email },
        create: {
          email: seed.email,
          passwordHash,
          status: "ACTIVE",
          accountType: seed.accountType,
          passwordMustChange: false,
        },
        update: {
          status: "ACTIVE",
          accountType: seed.accountType,
          ...(existing?.passwordHash ? {} : { passwordHash }),
        },
      });
      console.log(`upserted ${seed.email} (${seed.accountType})${existing?.passwordHash ? " — kept existing password hash" : ""}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
