import { detectAdminTask } from "./detect-task";
import { parseResidenceHint } from "./parse-residence";
import {
  recommendResidenceChangePlaces,
  residenceChangeMapQueries,
} from "./residence-change";
import type { PlaceRecommendResult } from "./types";
import type { UserCoords } from "@/lib/geo/region";

export type { AdminTaskId, PlaceRecommendResult, RecommendedPlace, ResidenceHint } from "./types";
export { detectAdminTask } from "./detect-task";
export { parseResidenceHint, NEED_ADDRESS_PROMPT_KO } from "./parse-residence";
export { isImmigrationCheckpoint, isCivilImmigrationOffice } from "./filters";
export { residenceChangeMapQueries } from "./residence-change";

/**
 * Task-aware place recommendation.
 * University affiliation must NOT be passed as residence — only situation text (+ optional GPS for distance).
 */
export async function recommendPlacesForSituation(input: {
  situation: string;
  coords?: UserCoords;
}): Promise<PlaceRecommendResult> {
  const queriedAt = new Date().toISOString();
  const task = detectAdminTask(input.situation);

  if (task.id === "residence-change") {
    const result = await recommendResidenceChangePlaces({
      situation: input.situation,
      coords: input.coords,
    });
    return {
      taskId: task.id,
      taskLabel: task.label,
      residenceHint: result.residenceHint,
      places: result.places,
      needAddressPrompt: result.needAddressPrompt,
      queriedAt,
      errors: result.errors,
    };
  }

  // Other tasks keep existing open-data / kakao paths for now.
  return {
    taskId: task.id,
    taskLabel: task.label,
    residenceHint: parseResidenceHint(input.situation),
    places: [],
    queriedAt,
    errors: [],
  };
}

export function mapQueriesForSituation(situation: string, venue?: string): string[] | null {
  const task = detectAdminTask(situation);
  if (task.id === "residence-change" || venue === "immigration") {
    const queries = residenceChangeMapQueries(situation);
    return queries.length > 0 ? queries : [];
  }
  return null;
}
