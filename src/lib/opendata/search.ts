import { regionFromCoords, type CityRegion, type UserCoords } from "@/lib/geo/region";
import { fetchNearbyBanks } from "./agencies";
import { fetchNearbyHospitals, fetchNearbyPharmacies, fetchNearbyPublicHealthCenters } from "./health";
import { recommendPlacesForSituation } from "@/lib/place-recommend";
import type { OpenDataResult, PublicFacility } from "./types";

export async function fetchOpenDataForScenario(
  scenarioId?: "bank-account" | "residence-change" | "hospital",
  coords?: UserCoords,
  situation?: string,
): Promise<OpenDataResult> {
  const queriedAt = new Date().toISOString();
  if (!scenarioId) {
    return { live: false, queriedAt, facilities: [], errors: [] };
  }

  const region: CityRegion = coords ? regionFromCoords(coords.lat, coords.lng) : "other";
  const errors: string[] = [];
  let facilities: PublicFacility[] = [];
  let needAddressPrompt: string | undefined;
  let taskLabel: string | undefined;

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
    // Jurisdiction from situation text only — never GPS alone, never university affiliation.
    const recommended = await recommendPlacesForSituation({
      situation: situation ?? "",
      coords,
    });
    taskLabel = recommended.taskLabel;
    needAddressPrompt = recommended.needAddressPrompt;
    facilities = recommended.places.map(
      (row): PublicFacility => ({
        name: row.name,
        address: row.address,
        phone: row.phone,
        lat: row.lat,
        lng: row.lng,
        category: row.category,
        provider: row.provider,
        dataset: row.dataset,
        datasetUrl: row.datasetUrl,
        live: row.live,
        processableTasks: row.processableTasks,
        hours: row.hours,
        asOf: row.asOf,
        distanceMeters: row.distanceMeters,
        role: row.role,
      }),
    );
    errors.push(...recommended.errors);
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
    needAddressPrompt,
    taskLabel,
  };
}
