export type StayType = "D-2" | "D-4" | "other";
export type BehaviorStage = "prepare" | "move" | "apply" | "confirm";
export type GuideRegion = "busan" | "other";

export interface VerifiedSource {
  name: string;
  url?: string;
}

export interface VerifiedScenario {
  id: "bank-account" | "residence-change" | "hospital";
  keywords: string[];
  asOf: string;
  sources: VerifiedSource[];
  region: GuideRegion;
  stayTypes: StayType[];
  location: string;
  procedure: string[];
  conditions: string[];
  documents: string[];
  agencies: string[];
  deadline?: string;
  facts: string[];
}

export interface SearchHit {
  scenario: VerifiedScenario;
  score: number;
}

export interface SearchResult {
  keywords: string[];
  hits: SearchHit[];
  primary: VerifiedScenario | null;
}

export interface ReasonedGuide {
  stayType: StayType;
  region: GuideRegion;
  scenario: VerifiedScenario | null;
  agencies: string[];
  documents: string[];
  conditions: string[];
  behaviorOrder: BehaviorStage[];
  notes: string[];
}

export interface PipelineMeta {
  search: { matched: boolean; scenarioId?: string; keywords: string[] };
  reason: { stayType: StayType; region: GuideRegion; agencies: string[] };
  generate: { mode: "llm" | "verified-template" | "institution-cache"; grounded: boolean };
  sources: VerifiedSource[];
  asOf?: string;
  institution?: {
    id: string;
    name: string;
    reused: boolean;
    titles: string[];
  };
  /** Console knowledge base sources used for this guide (PUBLISHED only). */
  knowledgeSources?: Array<{
    id: string;
    title: string;
    providerName: string;
    version: number;
    domain: string;
  }>;
  openData?: {
    live: boolean;
    queriedAt: string;
    needAddressPrompt?: string;
    taskLabel?: string;
    facilities: Array<{
      name: string;
      address?: string;
      phone?: string;
      category?: string;
      provider: string;
      dataset: string;
      datasetUrl?: string;
      live: boolean;
      processableTasks?: string[];
      hours?: string;
      asOf?: string;
      distanceMeters?: number;
    }>;
  };
}
