import { useEffect, useState } from "react";
import { onSnapshot, type DocumentData } from "firebase/firestore";
import { isAdPlacement, type Ad } from "../lib/ads";
import { adsCol } from "../lib/paths";

function asAd(id: string, data: DocumentData): Ad | null {
  if (typeof data.brand !== "string" || typeof data.imageUrl !== "string") {
    return null;
  }
  const placements = Array.isArray(data.placements)
    ? data.placements.filter(isAdPlacement)
    : [];
  return {
    id,
    brand: data.brand,
    imageUrl: data.imageUrl,
    href: typeof data.href === "string" ? data.href : "",
    placements,
    startsAt: typeof data.startsAt === "string" ? data.startsAt : "",
    endsAt: typeof data.endsAt === "string" ? data.endsAt : "",
    active: data.active === true,
    order: typeof data.order === "number" ? data.order : 0,
  };
}

/** Lee el inventario completo. El filtro de vigencia ocurre en el cliente. */
export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      adsCol(),
      (snap) => {
        const next: Ad[] = [];
        snap.forEach((docSnap) => {
          const ad = asAd(docSnap.id, docSnap.data());
          if (ad) next.push(ad);
        });
        next.sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand));
        setAds(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { ads, loading };
}
