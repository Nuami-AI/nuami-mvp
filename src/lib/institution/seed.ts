import { prisma } from "@/lib/db";
import { INSTITUTION_CATALOG } from "./catalog";
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

async function seedOnce(): Promise<void> {
  const existing = await prisma.institution.findMany({ select: { id: true } });
  const have = new Set(existing.map((row) => row.id));
  const missing = INSTITUTION_CATALOG.filter((row) => !have.has(row.id));

  if (missing.length > 0) {
    await prisma.institution.createMany({
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
  await prisma.organizationMember.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: { organizationId, email, role, status: "ACTIVE" },
    update: { role, status: "ACTIVE" },
  });
}
