import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/db");
  const rows = await prisma.authUser.findMany({
    select: {
      email: true,
      accountType: true,
      status: true,
      provider: true,
      passwordMustChange: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) {
    console.log("AuthUser is empty.");
    return;
  }
  console.table(
    rows.map((row) => ({
      email: row.email,
      accountType: row.accountType,
      status: row.status,
      provider: row.provider ?? "",
      mustChange: row.passwordMustChange,
      createdAt: row.createdAt.toISOString(),
    })),
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
