import { claudeExtract, type ClaudeExtractResult } from "@/lib/extract/claude/client";
import type { PromptInput } from "@/lib/extract/claude/prompt";
import type { ExtractionResult } from "@/types/extraction";
import { regionFromCoords } from "@/lib/geo/region";
import { formatInstitutionFacts, searchInstitutionKnowledge } from "@/lib/institution/search";
import { learnFromOfficialSourcesOnMiss } from "@/lib/institution/sources";
import { fetchOpenDataForScenario } from "@/lib/opendata/search";
import { reasonGuide } from "./reason";
import { searchVerifiedData } from "./search";
import { buildVerifiedTemplate } from "./templates";
import type { GuideRegion, PipelineMeta, StayType } from "./types";

export interface GuidePipelineInput extends PromptInput {
  stayType?: StayType;
  lat?: number;
  lng?: number;
  universityId?: string;
  knowledgeId?: string;
}

export interface GuidePipelineOutput {
  claude: ClaudeExtractResult | null;
  template: ExtractionResult | null;
  meta: PipelineMeta;
  shouldLearn: boolean;
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export async function runGuidePipeline(input: GuidePipelineInput): Promise<GuidePipelineOutput> {
  const search = searchVerifiedData(input.situation);
  const stayType = input.stayType ?? "other";
  const coords =
    typeof input.lat === "number" && typeof input.lng === "number"
      ? { lat: input.lat, lng: input.lng }
      : undefined;
  const city = coords ? regionFromCoords(coords.lat, coords.lng) : "other";
  const region: GuideRegion = city === "busan" ? "busan" : "other";
  let institutionHits = input.universityId
    ? await searchInstitutionKnowledge(input.universityId, input.situation, input.knowledgeId)
    : [];
  let learnedOnMiss = false;
  if (input.universityId && institutionHits.length === 0 && !input.knowledgeId) {
    const added = await learnFromOfficialSourcesOnMiss({
      institutionId: input.universityId,
      situation: input.situation,
    });
    if (added > 0) {
      learnedOnMiss = true;
      institutionHits = await searchInstitutionKnowledge(input.universityId, input.situation);
    }
  }
  const openData = await fetchOpenDataForScenario(search.primary?.id, coords);
  const liveAgencies = unique([
    ...institutionHits.flatMap((hit) => hit.whereTo),
    ...openData.facilities
      .filter((row) => !/하이코리아|전자민원|온라인/i.test(`${row.name} ${row.address ?? ""}`))
      .map((row) => row.name),
  ]).slice(0, 4);
  const reasoned = reasonGuide({
    search,
    stayType,
    region,
    lifeStage: input.lifeStage,
    liveAgencies,
  });
  if (institutionHits.length > 0) {
    reasoned.documents = unique([
      ...institutionHits.flatMap((hit) => hit.documents),
      ...reasoned.documents,
    ]);
    reasoned.notes.unshift(`${institutionHits[0].institutionName} 공식 안내를 우선 사용합니다.`);
  }

  const visitFacilities = openData.facilities.filter(
    (row) => !/하이코리아|전자민원|온라인/i.test(`${row.name} ${row.address ?? ""}`),
  );
  const facilityLines = visitFacilities
    .slice(0, 6)
    .map((row) => `- ${row.name} | ${row.address ?? ""} | ${row.phone ?? ""} | ${row.provider} (${row.live ? "LIVE OpenAPI" : "official list"})`)
    .join("\n");
  const institutionFacts = formatInstitutionFacts(institutionHits);

  const verifiedFacts = [
    institutionFacts,
    reasoned.scenario
      ? [
          "[VERIFIED PUBLIC DATA — do not contradict these facts]",
          `scenario: ${reasoned.scenario.id}`,
          `asOf: ${reasoned.scenario.asOf}`,
          `sources: ${reasoned.scenario.sources.map((s) => s.name).join("; ")}`,
          `deadline: ${reasoned.scenario.deadline ?? "(none)"}`,
          `documents: ${reasoned.documents.join(" | ")}`,
          `agencies: ${reasoned.agencies.join(" | ")}`,
          `conditions: ${reasoned.conditions.join(" | ")}`,
          `facts: ${reasoned.scenario.facts.join(" | ")}`,
          `reasoning notes: ${reasoned.notes.join(" | ")}`,
        ].join("\n")
      : "",
    facilityLines
      ? `[NEARBY PHYSICAL OFFICES]\n${facilityLines}\nwhereTo MUST list only these nearby offices (or closer equivalents). Never put HiKorea/전자민원/온라인 in whereTo — that is an online option for checklist/context only.`
      : "whereTo MUST be physical places near the user. Never list HiKorea/전자민원 as a place to visit on a map.",
    "Action steps MUST use stage values prepare → move → apply → confirm in that order.",
  ].filter(Boolean).join("\n");

  const promptInput: PromptInput = { ...input, verifiedFacts, stayType };

  const openDataMeta = {
    live: openData.live,
    queriedAt: openData.queriedAt,
    facilities: visitFacilities.slice(0, 6).map((row) => ({
      name: row.name,
      address: row.address,
      phone: row.phone,
      category: row.category,
      provider: row.provider,
      dataset: row.dataset,
      datasetUrl: row.datasetUrl,
      live: row.live,
    })),
  };

  const metaBase: Omit<PipelineMeta, "generate"> = {
    search: {
      matched: Boolean(reasoned.scenario) || institutionHits.length > 0,
      scenarioId: reasoned.scenario?.id,
      keywords: search.keywords,
    },
    reason: {
      stayType,
      region: reasoned.region,
      agencies: reasoned.agencies,
    },
    sources: [
      ...(reasoned.scenario?.sources ?? []),
      ...institutionHits.map((hit) => ({ name: `${hit.institutionName} · ${hit.title}` })),
      ...openData.facilities
        .map((row) => ({ name: `${row.provider} · ${row.dataset}`, url: row.datasetUrl }))
        .filter((row, idx, arr) => arr.findIndex((item) => item.name === row.name) === idx),
    ],
    asOf: reasoned.scenario?.asOf,
    openData: openDataMeta,
    institution: institutionHits[0]
      ? {
          id: institutionHits[0].institutionId,
          name: institutionHits[0].institutionName,
          reused: !learnedOnMiss,
          titles: institutionHits.map((hit) => hit.title),
        }
      : undefined,
  };

  const shouldLearn = false;

  if (institutionHits.length > 0 && reasoned.scenario) {
    const template = buildVerifiedTemplate(reasoned, {
      situation: input.situation,
      userLanguage: input.userLanguage,
    });
    if (template) {
      return {
        claude: null,
        template,
        shouldLearn: false,
        meta: { ...metaBase, generate: { mode: "institution-cache", grounded: true } },
      };
    }
  }

  try {
    const claude = await claudeExtract(promptInput);
    return {
      claude,
      template: null,
      shouldLearn,
      meta: {
        ...metaBase,
        generate: {
          mode: "llm",
          grounded: Boolean(reasoned.scenario) || institutionHits.length > 0,
        },
      },
    };
  } catch (err) {
    const template = buildVerifiedTemplate(reasoned, {
      situation: input.situation,
      userLanguage: input.userLanguage,
    });
    if (template) {
      console.warn("[guide-pipeline] LLM unavailable, using verified template:", err instanceof Error ? err.message : err);
      return {
        claude: null,
        template,
        shouldLearn,
        meta: { ...metaBase, generate: { mode: "verified-template", grounded: true } },
      };
    }
    throw err;
  }
}
