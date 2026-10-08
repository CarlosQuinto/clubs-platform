import {
  adminAds,
  type AdminAdsData,
  clearAdPlacements,
  dataConnect,
  deleteAd,
  QueryFetchPolicy,
  saveAd,
  saveAdPlacement,
  setAdOrder,
  setAdStatus,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";

export async function loadAds(): Promise<AdminAdsData> {
  return (await adminAds(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function upsertAd(input: {
  id: string;
  brand: string;
  imageUrl: string;
  href: string;
  startsOn: string;
  endsOn: string;
  status: string;
  sortOrder: number;
  price: number;
  advertiserName: string;
  advertiserContact: string;
  placements: string[];
}) {
  const { placements, ...ad } = input;
  const savedAd = await saveAd(dataConnect, ad);
  savedRow(savedAd.data.ad);
  await clearAdPlacements(dataConnect, { adId: input.id });
  for (const placement of placements) {
    await saveAdPlacement(dataConnect, { adId: input.id, placement });
  }
}

export async function saveAdStatus(id: string, status: string) {
  const result = await setAdStatus(dataConnect, { id, status });
  savedRow(result.data.ad);
}

/** Guarda el orden de todo el inventario en una sola petición. */
export async function orderAds(ids: string[]) {
  if (ids.length === 0) return;
  const result = await setAdOrder(dataConnect, { ids: ids.join(",") });
  savedRow(result.data.ad);
}

export async function removeAd(id: string) {
  const result = await deleteAd(dataConnect, { id });
  savedRow(result.data.ad);
}
