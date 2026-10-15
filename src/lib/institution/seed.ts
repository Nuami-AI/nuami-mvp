import { prisma, prismaAccounts } from "@/lib/db";
import { getInstitution, INSTITUTION_CATALOG } from "./catalog";
import { KOREA_UNIVERSITY_SAMPLE } from "./samples";

let seedPromise: Promise<void> | null = null;
let seedBlockedUntil = 0;

/** Insert missing catalog rows once per process. Never upsert the full list on every request. */
export function ensureInstitutions(): Promise<void> {
  if (seedPromise) return seedPromise;
  if (Date.now() < seedBlockedUntil) return Promise.resolve();
  seedPromise = seedOnce().catch((error) => {
    seedPromise = null;
    seedBlockedUntil = Date.now() + 15_000;
    throw error;
  });
  return seedPromise;
}

async function insertInstitutionIfMissing(
  client: typeof prisma,
  row: NonNullable<ReturnType<typeof getInstitution>>,
): Promise<void> {
  const exists = await client.institution.findUnique({ where: { id: row.id }, select: { id: true } });
  if (exists) return;
  try {
    await client.institution.create({
      data: {
        id: row.id,
        nameKo: row.nameKo,
        nameEn: row.nameEn,
        aliases: JSON.stringify(row.aliases),
        city: row.city,
        type: row.type,
      },
    });
  } catch {
    // 동시에 만든 경우
  }
}

/** 카탈로그에 있는 기관 한 건을 DB에 없으면 넣습니다. 계정 발급 시 FK를 맞춥니다. */
export async function ensureOrganization(id: string): Promise<void> {
  const row = getInstitution(id);
  if (!row) return;
  await insertInstitutionIfMissing(prisma, row);
  if (prismaAccounts !== prisma) await insertInstitutionIfMissing(prismaAccounts, row);
}

async function seedCatalogInstitutions(client: typeof prisma): Promise<void> {
  const existing = await client.institution.findMany({ select: { id: true } });
  const have = new Set(existing.map((row) => row.id));
  const missing = INSTITUTION_CATALOG.filter((row) => !have.has(row.id));
  if (missing.length === 0) return;
  await client.institution.createMany({
    data: missing.map((row) => ({
      id: row.id,
      nameKo: row.nameKo,
      nameEn: row.nameEn,
      aliases: JSON.stringify(row.aliases),
      city: row.city,
      type: row.type,
    })),
    skipDuplicates: true,
  });
}

async function seedOnce(): Promise<void> {
  await seedCatalogInstitutions(prisma);
  if (prismaAccounts !== prisma) await seedCatalogInstitutions(prismaAccounts);

  await seedStaffFromEnv();

  const sampleCount = await prisma.institutionKnowledge.count({
    where: { institutionId: "korea-university", source: "upload" },
  });
  if (sampleCount > 0) return;

  await prisma.institutionKnowledge.create({
    data: {
      institutionId: KOREA_UNIVERSITY_SAMPLE.institutionId,
      category: "admin",
      title: KOREA_UNIVERSITY_SAMPLE.title,
      summary: KOREA_UNIVERSITY_SAMPLE.summary,
      factsJson: JSON.stringify(KOREA_UNIVERSITY_SAMPLE.facts),
      documentsJson: JSON.stringify(KOREA_UNIVERSITY_SAMPLE.documents),
      whereToJson: JSON.stringify(KOREA_UNIVERSITY_SAMPLE.whereTo),
      keywordsJson: JSON.stringify(KOREA_UNIVERSITY_SAMPLE.keywords),
      source: "upload",
      verified: true,
      publicDataNote: KOREA_UNIVERSITY_SAMPLE.publicDataNote,
    },
  });
}

async function seedStaffFromEnv(): Promise<void> {
  const email = process.env.ORG_STAFF_EMAIL?.trim().toLowerCase();
  const organizationId = process.env.ORG_STAFF_ORG?.trim() || "korea-university";
  const role = process.env.ORG_STAFF_ROLE?.trim() || "ORG_ADMIN";
  if (!email) return;
  if (!INSTITUTION_CATALOG.some((row) => row.id === organizationId)) return;
  const user = await prismaAccounts.authUser.findUnique({ where: { email }, select: { accountType: true } });
  if (!user || user.accountType !== "ORG_STAFF") return;
  const existing = await prismaAccounts.organizationMember.findUnique({
    where: { organizationId_email: { organizationId, email } },
  });
  if (existing) return;
  await prismaAccounts.organizationMember.create({
    data: { organizationId, email, role, status: "ACTIVE" },
  });
}
