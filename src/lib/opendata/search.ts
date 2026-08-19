import { regionFromCoords, type CityRegion, type UserCoords } from "@/lib/geo/region";
import { fetchNearbyBanks, fetchNearbyImmigration } from "./agencies";
import { fetchNearbyHospitals, fetchNearbyPharmacies } from "./health";
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
    const [hospitals, pharmacies] = await Promise.all([
      fetchNearbyHospitals(coords, region),
      fetchNearbyPharmacies(coords, region),
    ]);
    facilities = [...hospitals.facilities, ...pharmacies.facilities];
    if (hospitals.error) errors.push(`hospital:${hospitals.error}`);
    if (pharmacies.error) errors.push(`pharmacy:${pharmacies.error}`);
  } else if (scenarioId === "residence-change") {
    const immigration = await fetchNearbyImmigration(coords, region);
    facilities = immigration.facilities;
    if (immigration.error) errors.push(`immigration:${immigration.error}`);
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
