import { claudeExtract, type ClaudeExtractResult } from "@/lib/extract/claude/client";
import type { PromptInput } from "@/lib/extract/claude/prompt";
import type { ExtractionResult } from "@/types/extraction";
import {
  formatPublishedKnowledgeFacts,
  searchPublishedKnowledge,
} from "@/lib/console-knowledge/service";
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

/** Warm knowledge in background — never block the user response. */
function scheduleMissLearn(institutionId: string, situation: string): void {
  void learnFromOfficialSourcesOnMiss({ institutionId, situation }).catch((err) => {
    console.warn(
      "[guide-pipeline] background learn failed:",
      err instanceof Error ? err.message : err,
    );
  });
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

  const [institutionHits, openData, publishedHits] = await Promise.all([
    input.universityId
      ? searchInstitutionKnowledge(input.universityId, input.situation, input.knowledgeId)
      : Promise.resolve([]),
    fetchOpenDataForScenario(search.primary?.id, coords, input.situation),
    searchPublishedKnowledge({
      situation: input.situation,
      institutionId: input.universityId,
      limit: 4,
    }).catch(() => []),
  ]);

  if (input.universityId && institutionHits.length === 0 && !input.knowledgeId) {
    scheduleMissLearn(input.universityId, input.situation);
  }

  const isResidenceChange = search.primary?.id === "residence-change";

  // Residence jurisdiction must come from the user's new address / open-data offices —
  // never from university affiliation whereTo (e.g. international student center).
  const liveAgencies = unique([
    ...(isResidenceChange ? [] : institutionHits.flatMap((hit) => hit.whereTo)),
    ...openData.facilities
      .filter((row) => !/하이코리아|전자민원|온라인/i.test(`${row.name} ${row.address ?? ""}`))
      .filter((row) => !/국제학생|국제처|international\s*(student|office)|유학생\s*지원/i.test(row.name))
      .map((row) => row.name),
  ]).slice(0, 6);

  const reasoned = reasonGuide({
    search,
    stayType,
    region,
    lifeStage: input.lifeStage,
    liveAgencies,
  });

  if (institutionHits.length > 0) {
    if (isResidenceChange) {
      // Source priority: law / HiKorea first; campus guides are supplementary only.
      reasoned.notes.push(
        `${institutionHits[0].institutionName} 안내는 참고용입니다. 체류·관할은 법령·HiKorea·지자체 공식 기준을 우선하며, 학교 주소로 관할을 추정하지 않습니다.`,
      );
      reasoned.documents = unique([
        ...reasoned.documents,
        ...institutionHits.flatMap((hit) => hit.documents),
      ]);
    } else {
      reasoned.documents = unique([
        ...institutionHits.flatMap((hit) => hit.documents),
        ...reasoned.documents,
      ]);
      reasoned.notes.unshift(`${institutionHits[0].institutionName} 공식 안내를 우선 사용합니다.`);
    }
  }

  // When address is unknown, do not fall back to scenario placeholder agencies as visit places.
  if (isResidenceChange && openData.needAddressPrompt) {
    reasoned.agencies = [];
  }

  const visitFacilities = openData.facilities.filter(
    (row) => !/하이코리아|전자민원|온라인/i.test(`${row.name} ${row.address ?? ""}`),
  );
  const facilityLines = visitFacilities
    .slice(0, 6)
    .map((row) => `- ${row.name} | ${row.address ?? ""} | ${row.phone ?? ""} | ${row.provider} (${row.live ? "LIVE OpenAPI" : "official list"})`)
    .join("\n");
  const institutionFacts = formatInstitutionFacts(institutionHits);
  const publishedFacts = formatPublishedKnowledgeFacts(publishedHits);

  const verifiedFacts = [
    institutionFacts,
    publishedFacts,
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
      ? `[NEARBY PHYSICAL OFFICES — task-capable jurisdiction offices only]\n${facilityLines}\nwhereTo MUST list only these offices. Never put airport/port immigration checkpoints, university international centers, or HiKorea/전자민원 in whereTo.`
      : openData.needAddressPrompt
        ? `[ADDRESS NEEDED]\n${openData.needAddressPrompt}\nwhereTo MUST be empty. Do NOT invent nearby immigration offices from GPS or university affiliation.`
        : "whereTo MUST be physical places that can handle the user's admin task. Never list HiKorea/전자민원, university international centers, or airport/port checkpoints as visit places.",
    isResidenceChange
      ? "For residence-change Action steps MUST be prepare → move(방법 선택) → apply(신고) → confirm. Step titles: prepare documents; choose online(HiKorea) or visit jurisdiction offices; submit report; confirm result. Never send users to university international student centers as filing offices."
      : "Action steps MUST use stage values prepare → move → apply → confirm in that order.",
    "Source priority for stay/admin facts: current law/government → Ministry of Justice/HiKorea → local government → university guides (campus guides must not override official jurisdiction rules).",
  ].filter(Boolean).join("\n");

  const promptInput: PromptInput = { ...input, verifiedFacts, stayType };

  const openDataMeta = {
    live: openData.live,
    queriedAt: openData.queriedAt,
    needAddressPrompt: openData.needAddressPrompt,
    taskLabel: openData.taskLabel,
    facilities: visitFacilities.slice(0, 6).map((row) => ({
      name: row.name,
      address: row.address,
      phone: row.phone,
      category: row.category,
      provider: row.provider,
      dataset: row.dataset,
      datasetUrl: row.datasetUrl,
      live: row.live,
      processableTasks: row.processableTasks,
      hours: row.hours,
      asOf: row.asOf,
      distanceMeters: row.distanceMeters,
    })),
  };

  const metaBase: Omit<PipelineMeta, "generate"> = {
    search: {
      matched:
        Boolean(reasoned.scenario) || institutionHits.length > 0 || publishedHits.length > 0,
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
      ...openData.facilities
        .map((row) => ({ name: `${row.provider} · ${row.dataset}`, url: row.datasetUrl }))
        .filter((row, idx, arr) => arr.findIndex((item) => item.name === row.name) === idx),
      ...publishedHits.map((hit) => ({
        name: `${hit.providerName} · ${hit.title}`,
        url: hit.sourceUrl ?? undefined,
      })),
      // University guides last for residence-change (official rules first).
      ...institutionHits.map((hit) => ({ name: `${hit.institutionName} · ${hit.title}` })),
    ],
    asOf: reasoned.scenario?.asOf,
    openData: openDataMeta,
    institution: institutionHits[0]
      ? {
          id: institutionHits[0].institutionId,
          name: institutionHits[0].institutionName,
          reused: true,
          titles: institutionHits.map((hit) => hit.title),
        }
      : undefined,
    knowledgeSources: publishedHits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      providerName: hit.providerName,
      version: hit.version,
      domain: hit.domain,
    })),
  };

  // Known scenarios (bank / residence / hospital): skip LLM entirely.
  if (reasoned.scenario) {
    const template = buildVerifiedTemplate(reasoned, {
      situation: input.situation,
      userLanguage: input.userLanguage,
      needAddressPrompt: openData.needAddressPrompt,
    });
    if (template) {
      const mode = institutionHits.length > 0 ? "institution-cache" : "verified-template";
      return {
        claude: null,
        template,
        shouldLearn: false,
        meta: { ...metaBase, generate: { mode, grounded: true } },
      };
    }
  }

  try {
    const claude = await claudeExtract(promptInput);
    return {
      claude,
      template: null,
      shouldLearn: false,
      meta: {
        ...metaBase,
        generate: {
          mode: "llm",
          grounded:
            Boolean(reasoned.scenario) ||
            institutionHits.length > 0 ||
            publishedHits.length > 0,
        },
      },
    };
  } catch (err) {
    const template = buildVerifiedTemplate(reasoned, {
      situation: input.situation,
      userLanguage: input.userLanguage,
      needAddressPrompt: openData.needAddressPrompt,
    });
    if (template) {
      console.warn("[guide-pipeline] LLM unavailable, using verified template:", err instanceof Error ? err.message : err);
      return {
        claude: null,
        template,
        shouldLearn: false,
        meta: { ...metaBase, generate: { mode: "verified-template", grounded: true } },
      };
    }
    throw err;
  }
}
