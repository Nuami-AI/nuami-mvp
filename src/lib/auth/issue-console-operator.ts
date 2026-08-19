import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail } from "@/lib/auth/password";
import { SUPER_ADMIN_EMAIL } from "@/lib/auth/access";
import { TEMP_ORG_PASSWORD } from "@/lib/auth/issue-org-staff";

export async function issueConsoleOperator(emailRaw: string): Promise<{
  email: string;
  tempPassword: string;
  created: boolean;
}> {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error("올바른 이메일을 입력하세요.");
  }
  if (email === SUPER_ADMIN_EMAIL) {
    throw new Error("슈퍼 어드민 계정은 이미 콘솔 권한이 있습니다.");
  }

  const existing = await prisma.authUser.findUnique({ where: { email } });
  if (existing?.accountType === "INTERNAL" && existing.status === "ACTIVE") {
    throw new Error("이미 콘솔 접근자입니다.");
  }

  const passwordHash = existing?.passwordHash ?? hashPassword(TEMP_ORG_PASSWORD);
  const created = !existing;

  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      status: "ACTIVE",
      accountType: "INTERNAL",
      passwordMustChange: true,
    },
    update: {
      status: "ACTIVE",
      accountType: "INTERNAL",
      ...(existing?.passwordHash ? {} : { passwordHash, passwordMustChange: true }),
    },
  });

  return { email, tempPassword: TEMP_ORG_PASSWORD, created };
}

export async function revokeConsoleOperator(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) {
    throw new Error("슈퍼 어드민 권한은 회수할 수 없습니다.");
  }
  const existing = await prisma.authUser.findUnique({ where: { email } });
  if (!existing || existing.accountType !== "INTERNAL") {
    throw new Error("콘솔 접근자가 아닙니다.");
  }
  const staff = await prisma.organizationMember.findFirst({
    where: { email, status: "ACTIVE" },
  });
  await prisma.authUser.update({
    where: { email },
    data: { accountType: staff ? "ORG_STAFF" : "END_USER" },
  });
}

export async function listConsoleOperators() {
  return prisma.authUser.findMany({
    where: { status: "ACTIVE", accountType: "INTERNAL" },
    select: { email: true, createdAt: true, passwordMustChange: true },
    orderBy: { createdAt: "asc" },
  });
}
