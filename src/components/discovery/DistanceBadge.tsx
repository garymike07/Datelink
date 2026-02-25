interface DistanceBadgeProps {
  distanceKm: number | null | undefined;
  city?: string | null;
  isHidden?: boolean;
  passportMode?: boolean;
}

function formatDistance(distanceKm: number, city?: string | null, passportMode?: boolean) {
  if (passportMode && distanceKm >= 500) return "Very far away";
  if (distanceKm < 1) return "Less than 1 km away";
  if (distanceKm <= 10) return `${Math.round(distanceKm)} km away`;
  if (distanceKm <= 50) return `${Math.round(distanceKm)} km away${city ? ` in ${city}` : ""}`;
  return `${Math.round(distanceKm)} km away${city ? ` in ${city}` : ""}`;
}

export function DistanceBadge({ distanceKm, city, isHidden, passportMode }: DistanceBadgeProps) {
  if (isHidden) return "Hidden";
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return city || "";
  }
  return formatDistance(distanceKm, city, passportMode);
}
