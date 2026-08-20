import { prisma } from "@/lib/db";
import { hashPassword, isValidEmail } from "@/lib/auth/password";
import { getInstitution } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export const TEMP_ORG_PASSWORD = "1234";

export const STAFF_ROLES = new Set(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"]);
/** 기관 대표/어드민이 기관 안에서 추가할 수 있는 멤버 역할. 대표(OWNER)는 콘솔만 발급. */
export const INSTITUTION_MEMBER_ROLES = new Set(["ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"]);

export async function issueOrgStaffAccount(input: {
  organizationId: string;
  email: string;
  role?: string;
  allowedRoles?: Set<string>;
  defaultRole?: string;
  /** 재활성화 시 역할을 바꾸지 않음. 기관 어드민은 true. */
  preserveRoleOnReactivate?: boolean;
}): Promise<{ email: string; organizationId: string; role: string; tempPassword: string }> {
  await ensureInstitutions();
  const organizationId = input.organizationId.trim();
  const email = input.email.trim().toLowerCase();
  const allowed = input.allowedRoles ?? STAFF_ROLES;
  const fallback = input.defaultRole && allowed.has(input.defaultRole) ? input.defaultRole : "ORG_ADMIN";
  const role = allowed.has(input.role ?? "") ? (input.role as string) : fallback;

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

  const existingUser = await prisma.authUser.findUnique({ where: { email } });
  if (existingUser?.accountType === "INTERNAL") {
    throw new Error("내부 운영 계정에는 기관 권한을 붙일 수 없습니다.");
  }
  if (input.preserveRoleOnReactivate && existingUser?.accountType === "END_USER") {
    throw new Error("이미 서비스 이용자로 등록된 이메일입니다.");
  }

  const passwordHash = hashPassword(TEMP_ORG_PASSWORD);
  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      status: "ACTIVE",
      accountType: "ORG_STAFF",
      passwordMustChange: true,
    },
    update: {
      passwordHash,
      status: "ACTIVE",
      accountType: "ORG_STAFF",
      passwordMustChange: true,
    },
  });

  const assignedRole =
    existingMember && input.preserveRoleOnReactivate ? existingMember.role : role;

  if (existingMember) {
    await prisma.organizationMember.update({
      where: { id: existingMember.id },
      data: {
        status: "ACTIVE",
        ...(input.preserveRoleOnReactivate ? {} : { role }),
      },
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

  return { email, organizationId, role: assignedRole, tempPassword: TEMP_ORG_PASSWORD };
}

export async function resetOrgStaffPassword(organizationId: string, memberId: string): Promise<{ email: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다.");
  if (member.status !== "ACTIVE") throw new Error("비활성화된 계정은 초기화할 수 없습니다.");
  const user = await prisma.authUser.findUnique({ where: { email: member.email } });
  if (!user || user.accountType === "INTERNAL") {
    throw new Error("이 계정은 초기화할 수 없습니다.");
  }
  await prisma.authUser.update({
    where: { email: member.email },
    data: {
      passwordHash: hashPassword(TEMP_ORG_PASSWORD),
      passwordMustChange: true,
      status: "ACTIVE",
    },
  });
  return { email: member.email };
}

export async function deactivateOrgStaffMember(input: {
  organizationId: string;
  memberId: string;
  actorEmail: string;
  actorIsSuperAdmin: boolean;
}): Promise<{ email: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다.");
  if (member.email === input.actorEmail.trim().toLowerCase()) {
    throw new Error("자기 계정은 비활성화할 수 없습니다.");
  }
  if (member.role === "ORG_OWNER" && !input.actorIsSuperAdmin) {
    throw new Error("기관 대표 계정은 비활성화할 수 없습니다.");
  }
  if (member.status !== "ACTIVE") {
    throw new Error("이미 비활성화된 계정입니다.");
  }

  if (member.role === "ORG_OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId: input.organizationId, role: "ORG_OWNER", status: "ACTIVE" },
    });
    if (owners <= 1) throw new Error("마지막 대표 계정은 비활성화할 수 없습니다.");
  }

  await prisma.organizationMember.update({
    where: { id: member.id },
    data: { status: "INACTIVE" },
  });

  const other = await prisma.organizationMember.findFirst({
    where: { email: member.email, status: "ACTIVE", id: { not: member.id } },
  });
  if (!other) {
    const user = await prisma.authUser.findUnique({ where: { email: member.email } });
    if (user?.accountType === "ORG_STAFF") {
      await prisma.authUser.update({
        where: { email: member.email },
        data: { status: "INACTIVE" },
      });
    }
  }

  return { email: member.email };
}

export async function reactivateOrgStaffMember(input: {
  organizationId: string;
  memberId: string;
}): Promise<{ email: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다.");
  if (member.status === "ACTIVE") {
    throw new Error("이미 활성화된 계정입니다.");
  }

  await prisma.organizationMember.update({
    where: { id: member.id },
    data: { status: "ACTIVE" },
  });

  const user = await prisma.authUser.findUnique({ where: { email: member.email } });
  if (user && user.accountType !== "INTERNAL") {
    await prisma.authUser.update({
      where: { email: member.email },
      data: { status: "ACTIVE", accountType: "ORG_STAFF" },
    });
  }

  return { email: member.email };
}

export async function pruneStaleOrgMemberships(organizationId: string): Promise<number> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { id: true, email: true },
  });
  if (members.length === 0) return 0;
  const users = await prisma.authUser.findMany({
    where: { email: { in: members.map((row) => row.email) } },
    select: { email: true, accountType: true },
  });
  const byEmail = new Map(users.map((row) => [row.email, row.accountType]));
  const staleIds = members
    .filter((row) => {
      const type = byEmail.get(row.email);
      return !type || type === "INTERNAL";
    })
    .map((row) => row.id);
  if (staleIds.length === 0) return 0;
  await prisma.organizationMember.deleteMany({ where: { id: { in: staleIds } } });
  return staleIds.length;
}

export async function listVisibleOrgStaff(organizationId: string) {
  await pruneStaleOrgMemberships(organizationId);
  return prisma.organizationMember.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteOrgStaffMember(input: {
  organizationId: string;
  memberId: string;
  actorEmail: string;
  actorIsSuperAdmin: boolean;
}): Promise<{ email: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다.");
  if (member.email === input.actorEmail.trim().toLowerCase()) {
    throw new Error("자기 계정은 삭제할 수 없습니다.");
  }
  if (member.role === "ORG_OWNER" && !input.actorIsSuperAdmin) {
    throw new Error("기관 대표 계정은 삭제할 수 없습니다.");
  }
  if (member.role === "ORG_OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId: input.organizationId, role: "ORG_OWNER", status: "ACTIVE" },
    });
    if (owners <= 1) throw new Error("마지막 대표 계정은 삭제할 수 없습니다.");
  }

  await prisma.organizationMember.delete({ where: { id: member.id } });

  const other = await prisma.organizationMember.findFirst({
    where: { email: member.email },
  });
  if (!other) {
    const user = await prisma.authUser.findUnique({ where: { email: member.email } });
    if (user?.accountType === "ORG_STAFF") {
      await prisma.authUser.delete({ where: { email: member.email } });
    }
  }

  return { email: member.email };
}

export async function changeOrgStaffRole(input: {
  organizationId: string;
  memberId: string;
  role: string;
  actorEmail: string;
  allowedRoles: Set<string>;
}): Promise<{ email: string; role: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다.");
  if (member.email === input.actorEmail.trim().toLowerCase()) {
    throw new Error("자기 역할은 바꿀 수 없습니다.");
  }
  if (member.status !== "ACTIVE") {
    throw new Error("비활성 계정의 역할은 바꿀 수 없습니다.");
  }
  if (!input.allowedRoles.has(input.role)) {
    throw new Error("지정할 수 없는 역할입니다.");
  }
  if (member.role === "ORG_OWNER" && !input.allowedRoles.has("ORG_OWNER")) {
    throw new Error("기관 대표의 역할은 콘솔에서만 바꿀 수 있습니다.");
  }
  if (member.role === "ORG_OWNER" && input.role !== "ORG_OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId: input.organizationId, role: "ORG_OWNER", status: "ACTIVE" },
    });
    if (owners <= 1) throw new Error("마지막 대표 역할은 바꿀 수 없습니다.");
  }

  await prisma.organizationMember.update({
    where: { id: member.id },
    data: { role: input.role },
  });
  return { email: member.email, role: input.role };
}
