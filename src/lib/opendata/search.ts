import { regionFromCoords, type CityRegion, type UserCoords } from "@/lib/geo/region";
import { fetchNearbyBanks, fetchNearbyImmigration } from "./agencies";
import { fetchNearbyCommunityCenters } from "./admin";
import { fetchNearbyHospitals, fetchNearbyPharmacies, fetchNearbyPublicHealthCenters } from "./health";
import type { OpenDataResult, PublicFacility } from "./types";

export async function fetchOpenDataForScenario(
  scenarioId?: "bank-account" | "residence-change" | "hospital",
  coords?: UserCoords,
): Promise<OpenDataResult> {
  const queriedAt = new Date().toISOString();
  if (!scenarioId) {
    return { live: false, queriedAt, facilities: [], errors: [] };
  }

  const region: CityRegion = coords ? regionFromCoords(coords.lat, coords.lng) : "other";
  const errors: string[] = [];
  let facilities: PublicFacility[] = [];

  if (scenarioId === "hospital") {
    const [hospitals, pharmacies, healthCenters] = await Promise.all([
      fetchNearbyHospitals(coords, region),
      fetchNearbyPharmacies(coords, region),
      fetchNearbyPublicHealthCenters(coords, region),
    ]);
    facilities = [
      ...hospitals.facilities,
      ...pharmacies.facilities,
      ...healthCenters.facilities.slice(0, 2),
    ];
    if (hospitals.error) errors.push(`hospital:${hospitals.error}`);
    if (pharmacies.error) errors.push(`pharmacy:${pharmacies.error}`);
    if (healthCenters.error) errors.push(`public-health:${healthCenters.error}`);
  } else if (scenarioId === "residence-change") {
    const [immigration, communityCenters] = await Promise.all([
      fetchNearbyImmigration(coords, region),
      fetchNearbyCommunityCenters(coords, region),
    ]);
    facilities = [...immigration.facilities, ...communityCenters.facilities];
    if (immigration.error) errors.push(`immigration:${immigration.error}`);
    if (communityCenters.error) errors.push(`community:${communityCenters.error}`);
  } else if (scenarioId === "bank-account") {
    const banks = await fetchNearbyBanks(coords, region);
    facilities = banks.facilities;
    if (banks.error) errors.push(`bank:${banks.error}`);
  }

  return {
    live: facilities.some((row) => row.live),
    queriedAt,
    facilities,
    errors,
  };
}
