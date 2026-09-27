/**
 * Demo recording accounts.
 *   npm run auth:seed-demo
 *
 * Fully resets end-user demos: password, university affiliation, usage/credits.
 * Org/console passwords are kept; only passwordMustChange is cleared.
 *
 * Note: browser localStorage (prefs/campus) is reconciled on next login via SyncStorageScope.
 */
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

const DEMO_END_USERS = [
  { email: "test@nuami.kr", password: "1234" },
  { email: "user@nuami.kr", password: "1234" },
] as const;
const DEMO_EXISTING = ["admin@nuami.kr", "hello@pusan.ac.kr"] as const;
const LEGACY_END_USER = "user@naumi.kr";

async function resetEndUser(
  prisma: Awaited<typeof import("../src/lib/db")>["prisma"],
  hashPassword: (pw: string) => string,
  email: string,
  password: string,
) {
  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hashPassword(password),
      status: "ACTIVE",
      accountType: "END_USER",
      passwordMustChange: false,
      marketingAgreed: false,
      thirdPartyAgreed: false,
    },
    update: {
      passwordHash: hashPassword(password),
      status: "ACTIVE",
      accountType: "END_USER",
      passwordMustChange: false,
      provider: null,
      providerAccountId: null,
    },
  });

  const deletedAffiliations = await prisma.endUserOrganization.deleteMany({ where: { email } });
  const deletedChallenges = await prisma.authChallenge.deleteMany({ where: { email } });
  const deletedUsage = await prisma.usageEvent.deleteMany({ where: { userEmail: email } });

  console.log(
    `ok ${email} (password ${password}, affiliations=${deletedAffiliations.count}, challenges=${deletedChallenges.count}, usage/credits=${deletedUsage.count})`,
  );
}

async function main() {
  const { hashPassword } = await import("../src/lib/auth/password");
  const { prisma } = await import("../src/lib/db");

  for (const row of DEMO_END_USERS) {
    await resetEndUser(prisma, hashPassword, row.email, row.password);
  }

  const legacy = await prisma.authUser.findUnique({ where: { email: LEGACY_END_USER } });
  if (legacy) {
    await prisma.authUser.update({
      where: { email: LEGACY_END_USER },
      data: { status: "INACTIVE" },
    });
    await prisma.endUserOrganization.deleteMany({ where: { email: LEGACY_END_USER } });
    await prisma.usageEvent.deleteMany({ where: { userEmail: LEGACY_END_USER } });
    console.log(`deactivated ${LEGACY_END_USER}`);
  }

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
