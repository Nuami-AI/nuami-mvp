import { prisma } from "@/lib/db";

/** 이용 중 질의 캐시용. 공식 안내는 기관이 입력한 홈페이지 학습(sources.ts)만 사용한다. */

export async function persistLearnedKnowledge(input: {
  institutionId: string;
  situation: string;
  summary: string;
  documents: string[];
  whereTo: string[];
  facts: string[];
}): Promise<void> {
  const title = input.situation.trim().slice(0, 80);
  const existing = await prisma.institutionKnowledge.findFirst({
    where: {
      institutionId: input.institutionId,
      source: "learned",
      title,
    },
  });
  if (existing) return;

  await prisma.institutionKnowledge.create({
    data: {
      institutionId: input.institutionId,
      category: "learned",
      title,
      summary: input.summary.slice(0, 500),
      factsJson: JSON.stringify(input.facts.slice(0, 8)),
      documentsJson: JSON.stringify(input.documents.slice(0, 8)),
      whereToJson: JSON.stringify(input.whereTo.slice(0, 6)),
      keywordsJson: JSON.stringify(
        input.situation
          .split(/[\s,./]+/)
          .map((part) => part.trim())
          .filter((part) => part.length >= 2)
          .slice(0, 10),
      ),
      source: "learned",
      verified: true,
      publicDataNote: "이용 중 AI + 공공데이터로 추가된 안내",
    },
  });
}
