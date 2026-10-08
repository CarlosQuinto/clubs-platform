import { type AdminAdsData, AdPlacementKind } from "../../../infrastructure/dataconnect";
import { calendarDay, type Ad, type AdPlacement } from "../../../domains/platform/ads";

const TO_PLACEMENT: Record<AdPlacementKind, AdPlacement> = {
  [AdPlacementKind.HOME]: "home",
  [AdPlacementKind.TOURNAMENT]: "tournament",
  [AdPlacementKind.CLUB]: "club",
  [AdPlacementKind.TEAMS]: "teams",
};

export const TO_SQL_PLACEMENT: Record<AdPlacement, AdPlacementKind> = {
  home: AdPlacementKind.HOME,
  tournament: AdPlacementKind.TOURNAMENT,
  club: AdPlacementKind.CLUB,
  teams: AdPlacementKind.TEAMS,
};

export function toAds(data: AdminAdsData | null): Ad[] {
  if (!data) return [];
  return data.ads.map((ad) => ({
    id: ad.id,
    brand: ad.brand,
    imageUrl: ad.imageUrl,
    href: ad.href,
    placements: ad.adPlacements_on_ad.map((row) => TO_PLACEMENT[row.placement]),
    startsAt: calendarDay(ad.startsOn),
    endsAt: calendarDay(ad.endsOn),
    status: ad.status,
    order: ad.sortOrder,
    price: ad.price ?? 0,
    advertiserName: ad.advertiserName ?? "",
    advertiserContact: ad.advertiserContact ?? "",
    hasLegacyPlacement: false,
  }));
}
