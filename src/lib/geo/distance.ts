const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)}km`;
}

export function withDistanceFromUser<T extends { lat: number; lng: number; distanceMeters?: number }>(
  places: T[],
  userLat: number,
  userLng: number,
): Array<T & { distanceMeters: number }> {
  return places
    .map((place) => ({
      ...place,
      distanceMeters:
        place.distanceMeters ?? haversineMeters(userLat, userLng, place.lat, place.lng),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
