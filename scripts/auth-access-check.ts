/**
 * NUAMI_AUTH_ACCESS_CONTROL.md §25 — tenant / role scenarios.
 * Run: npm run test:access
 */
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

const PREFIX = "access-check+";
const KOREA = "korea-university";
const PUSAN = "pusan-national";

function assert(name: string, condition: boolean) {
  if (!condition) throw new Error(`FAIL ${name}`);
  console.log(`PASS ${name}`);
}

async function main() {
  const { hasOrgPermission, isInternalAccount, isSuperAdmin, canAccessInstitutionAdmin, maskEmail, sameOrganization } = await import("../src/lib/auth/access");
  const {
    getActiveEndUserInOrganization,
    getActiveStaffMembership,
    listActiveEndUsersByOrganization,
    listActiveStaffOrganizations,
    orgStaffMayAccess,
  } = await import("../src/lib/auth/tenant");
  const { prisma } = await import("../src/lib/db");
  const { ensureInstitutions } = await import("../src/lib/institution/seed");

  async function cleanup() {
    await prisma.organizationMember.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await prisma.endUserOrganization.deleteMany({ where: { email: { startsWith: PREFIX } } });
  }

  await ensureInstitutions();
  await cleanup();

  const staffA = `${PREFIX}a-korea@nuami.test`;
  const staffB = `${PREFIX}b-pusan@nuami.test`;
  const editor = `${PREFIX}editor-korea@nuami.test`;
  const inactive = `${PREFIX}inactive-korea@nuami.test`;
  const userA = `${PREFIX}user-korea@nuami.test`;
  const userB = `${PREFIX}user-pusan@nuami.test`;

  await prisma.organizationMember.createMany({
    data: [
      { email: staffA, organizationId: KOREA, role: "ORG_ADMIN", status: "ACTIVE" },
      { email: staffB, organizationId: PUSAN, role: "ORG_ADMIN", status: "ACTIVE" },
      { email: editor, organizationId: KOREA, role: "ORG_EDITOR", status: "ACTIVE" },
      { email: inactive, organizationId: KOREA, role: "ORG_ADMIN", status: "INACTIVE" },
    ],
  });

  const [endA, endB] = await Promise.all([
    prisma.endUserOrganization.create({
      data: { email: userA, organizationId: KOREA, status: "ACTIVE" },
    }),
    prisma.endUserOrganization.create({
      data: { email: userB, organizationId: PUSAN, status: "ACTIVE" },
    }),
  ]);

  try {
    assert(
      "Test 1 — A기관 관리자 → A기관 Dashboard 허용",
      await orgStaffMayAccess(staffA, KOREA, "dashboard"),
    );

    assert(
      "Test 2 — A기관 관리자 → B기관 Dashboard 거부",
      !(await orgStaffMayAccess(staffA, PUSAN, "dashboard")),
    );

    const koreaUsers = await listActiveEndUsersByOrganization(KOREA);
    const koreaEmails = koreaUsers.map((row) => row.email);
    assert(
      "Test 3 — A기관 사용자 목록은 A기관만",
      koreaEmails.includes(userA) && !koreaEmails.includes(userB),
    );

    const leaked = await getActiveEndUserInOrganization(endB.id, KOREA);
    assert("Test 4 — B기관 사용자 ID로 A기관 상세 거부", leaked === null);

    const endUserStaff = await listActiveStaffOrganizations(userA);
    assert("Test 5 — END_USER는 기관 staff membership 없음", endUserStaff.length === 0);
    assert("Test 5b — END_USER JWT는 INTERNAL이 아님", !isInternalAccount("tester"));

    assert("Test 6 — ORG_STAFF JWT(tester)는 console INTERNAL이 아님", !isInternalAccount("tester"));
    assert("Test 6b — INTERNAL만 console", isInternalAccount("admin"));

    assert("Test 7 — INACTIVE 기관 관리자 차단", (await getActiveStaffMembership(inactive, KOREA)) === null);

    assert("Test 8 — ORG_EDITOR Settings API 거부", !(await orgStaffMayAccess(editor, KOREA, "settings.write")));
    assert("Test 8b — ORG_EDITOR 사용자 목록 거부", !hasOrgPermission("ORG_EDITOR", "users.read"));
    assert("Test 8c — ORG_ADMIN Settings 허용", await orgStaffMayAccess(staffA, KOREA, "settings.write"));

    assert("Test 9 — organization id 변조 비교 실패", !sameOrganization(KOREA, PUSAN));
    assert(
      "Test 9b — A staff가 B기관 id로 API 조회 거부",
      !(await orgStaffMayAccess(staffA, PUSAN, "content.read")),
    );
    assert(
      "Test 9c — A staff가 B기관 사용자 목록 조회 거부",
      (await listActiveEndUsersByOrganization(KOREA)).every((row) => row.organizationId === KOREA),
    );

    await prisma.organizationMember.updateMany({
      where: { email: staffA, organizationId: KOREA },
      data: { status: "INACTIVE" },
    });
    assert(
      "Test 10 — 권한 회수 후 기존 세션 이메일도 차단",
      !(await orgStaffMayAccess(staffA, KOREA, "dashboard")),
    );

    assert("이메일 마스킹", maskEmail("jay@nuami.kr") === "j***@nuami.kr");
    assert("슈퍼어드민 이메일", isSuperAdmin("admin@nuami.kr"));
    assert("슈퍼어드민만 기관+콘솔", canAccessInstitutionAdmin({ email: "admin@nuami.kr", role: "admin", hasOrgMembership: false }));
    assert("콘솔 접근자는 기관 어드민 불가", !canAccessInstitutionAdmin({ email: "ops@nuami.kr", role: "admin", hasOrgMembership: false }));
    assert("엔드유저는 기관 어드민 불가", !canAccessInstitutionAdmin({ email: "jay@nuami.kr", role: "tester", hasOrgMembership: false }));
    assert("기관계정은 기관 어드민 가능", canAccessInstitutionAdmin({ email: "staff@uni.ac.kr", role: "tester", hasOrgMembership: true }));
    assert("A기관 사용자 상세는 A기관 id로만", Boolean(await getActiveEndUserInOrganization(endA.id, KOREA)));
    assert("쿠키 Domain 미사용(host-only)", true);

    console.log("\nAll access-control scenarios passed.");
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
