/** Reusable admin-task place recommendation types. */

export type AdminTaskId =
  | "residence-change"
  | "bank-account"
  | "hospital"
  | "unknown";

export interface ResidenceHint {
  /** e.g. busan | seoul */
  city?: "seoul" | "busan" | "incheon" | "daegu" | "other";
  /** e.g. 금정구 */
  district?: string;
  /** Raw matched fragment from the user text */
  matchedText?: string;
  /** True when we have enough to look up jurisdiction (district or clear city+area) */
  enoughForJurisdiction: boolean;
}

export interface RecommendedPlace {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  category?: string;
  /** What admin work this office can handle for the detected task */
  processableTasks: string[];
  /** Why this place was ranked */
  role: "community-center" | "district-office" | "immigration-civil" | "other";
  jurisdictionMatch: boolean;
  canHandleTask: boolean;
  distanceMeters?: number;
  hours?: string;
  provider: string;
  dataset: string;
  datasetUrl?: string;
  asOf?: string;
  live: boolean;
  placeUrl?: string;
}

export interface PlaceRecommendResult {
  taskId: AdminTaskId;
  taskLabel: string;
  residenceHint: ResidenceHint | null;
  places: RecommendedPlace[];
  /** When set, UI should ask the user for address/region instead of listing GPS-near offices */
  needAddressPrompt?: string;
  queriedAt: string;
  errors: string[];
}
