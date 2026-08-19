/**
 * Reset super-admin password to the shared temp password (1234).
 *   npm run auth:reset-admin
 */
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

async function main() {
  const { SUPER_ADMIN_EMAIL } = await import("../src/lib/auth/access");
  const { TEMP_ORG_PASSWORD } = await import("../src/lib/auth/issue-org-staff");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { prisma } = await import("../src/lib/db");
  const email = SUPER_ADMIN_EMAIL;

  const existing = await prisma.authUser.findUnique({ where: { email } });
  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hashPassword(TEMP_ORG_PASSWORD),
      status: "ACTIVE",
      accountType: "INTERNAL",
      passwordMustChange: true,
    },
    update: {
      passwordHash: hashPassword(TEMP_ORG_PASSWORD),
      status: "ACTIVE",
      accountType: "INTERNAL",
      passwordMustChange: true,
    },
  });

  await prisma.$disconnect();
  console.log(`${existing ? "updated" : "created"} ${email} — temp password set, must change on next login.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
