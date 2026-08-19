import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail } from "@/lib/auth/password";
import { getInstitution } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export const TEMP_ORG_PASSWORD = "1234";

const STAFF_ROLES = new Set(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"]);

export async function issueOrgStaffAccount(input: {
  organizationId: string;
  email: string;
  role?: string;
}): Promise<{ email: string; organizationId: string; role: string; tempPassword: string }> {
  await ensureInstitutions();
  const organizationId = input.organizationId.trim();
  const email = input.email.trim().toLowerCase();
  const role = STAFF_ROLES.has(input.role ?? "") ? input.role as string : "ORG_ADMIN";

  if (!getInstitution(organizationId)) {
    throw new Error("등록되지 않은 기관입니다.");
  }
  if (!isValidEmail(email)) {
    throw new Error("올바른 이메일을 입력하세요.");
  }

  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId, email },
  });
  if (existingMember?.status === "ACTIVE") {
    throw new Error("이미 이 기관에 발급된 계정입니다.");
  }

  const passwordHash = hashPassword(TEMP_ORG_PASSWORD);
  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      status: "ACTIVE",
      passwordMustChange: true,
    },
    update: {
      passwordHash,
      status: "ACTIVE",
      passwordMustChange: true,
    },
  });

  if (existingMember) {
    await prisma.organizationMember.update({
      where: { id: existingMember.id },
      data: { status: "ACTIVE", role },
    });
  } else {
    await prisma.organizationMember.create({
      data: {
        organizationId,
        email,
        role,
        status: "ACTIVE",
      },
    });
  }

  return { email, organizationId, role, tempPassword: TEMP_ORG_PASSWORD };
}
